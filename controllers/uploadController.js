import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js"
import { supabase } from "../lib/supabase.js";

// ES Modules requires grabbing file and path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define uploadDir's path relative to project root
const projectRoot = path.resolve(__dirname, '..');
const uploadDir = path.join(projectRoot, 'uploads');

// Check if upload directory already exists; create it if not
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Use recursive: true to create parent directories if they don't exist
}

// === Memory Storage Configuration ===

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const handleUpload = async (req, res) => {
  // Capture current folder context for the redirect logic
  const folderId = req.body.parentId; 
  const file = req.file;
  const userId = req.user.id;

  if (!file) {
    req.flash('error', 'No file selected.');
    return res.redirect(folderId ? `/dashboard/${folderId}` : '/dashboard');
  }

  try {
    // --- Path & Name Generation ---
    // We create a unique path in the Supabase bucket: user-ID/timestamp-filename
    // Allows users to upload files with the same name eg. "resume.pdf"
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `user-${userId}/${fileName}`;

    // --- Supabase Handshake ---
    const { data, error } = await supabase.storage
      .from('uploads') // Your bucket name from Phase 1
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false // Set to true if you want to overwrite files with the same name
      });

    if (error) throw error;

    // --- Grab Public URL ---
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // --- Insert Into Prisma Database ---
    // Store publicUrl for the Download / View features, 
    // filePath (key) for the Delete feature.
    await prisma.file.create({
      data: {
        name: file.originalname,
        size: file.size,
        url: publicUrl,
        path: filePath, // Acts as Supabases Storage Key; used for identifying file for deletion
        userId: userId,
        folderId: folderId ? parseInt(folderId) : null,
      }
    });

    req.flash('success', 'File uploaded successfully!');
    res.redirect(folderId ? `/dashboard/${folderId}` : '/dashboard');

  } catch (err) {
    console.error('Supabase Upload Error:', err);
    req.flash('error', 'Upload failed.');
    res.redirect(folderId ? `/dashboard/${folderId}` : '/dashboard');
  }
};

// === OLD: Persistent Disk Storage ===
// // Define Disk Storage Configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     // We add a timestamp to prevent filename collisions
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// export const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 } // Optional: 10MB limit on filesize
// });


// === OLD: handleUpload Function ===
// // Upload logic
// export const handleUpload = async (req, res) => {

//   // Grab current folder id (the parent folder)
//   const parentId = req.body.parentId;

//   try {
//     if (!req.file) {
//       req.flash("error", "No file selected.");
//       return res.redirect("/dashboard");
//     }

//     // Save metadata to Prisma
//     await prisma.file.create({
//       data: {
//         name: req.file.originalname,
//         url: req.file.path, // USE url FOR SCHEMA METADATA; path FOR file's original location
//         size: req.file.size,
//         userId: req.user.id,
//         folderId: parentId ? parseInt(parentId) : null
//       },
//     });

//     req.flash("success", "File uploaded successfully!");
    
//     const redirectUrl = parentId ? `/dashboard/${parentId}` : "/dashboard";
//     res.redirect(redirectUrl);
//   } catch (error) {
//     console.error("Upload error:", error);
//     req.flash("error", "An error occurred during upload.");

//     const redirectUrl = parentId ? `/dashboard/${parentId}` : "/dashboard";
//     res.redirect(redirectUrl);
//   }
// };