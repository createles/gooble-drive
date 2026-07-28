import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";

// Memory Storage Configuration
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware wrapper to handle Multer upload errors cleanly
export const handleSingleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    const parentId = req.body.parentId;
    const redirectURL = parentId ? `/dashboard/${parentId}` : '/dashboard';

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash("error", "File is too large! Max limit is 10MB.");
        return res.redirect(redirectURL);
      }
      req.flash("error", `Upload Error: ${err.message}`);
      return res.redirect(redirectURL);
    } else if (err) {
      return next(err);
    }
    next();
  });
};

export const handleUpload = async (req, res) => {
  // Capture current folder context for the redirect logic
  const folderId = req.body.parentId; 
  const file = req.file;
  const userId = req.user.id;

  const redirectURL = folderId ? `/dashboard/${folderId}` : '/dashboard';

  if (!file) {
    req.flash('error', 'No file selected.');
    return res.redirect(redirectURL);
  }

  const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  if (!allowedFileTypes.includes(file.mimetype)) {
    req.flash("error", "Invalid file type. Only JPG, PNG, PDF, and TXT files are allowed.");
    return res.redirect(redirectURL);
  }

  try {
    // --- Path & Name Generation ---
    // We create a unique path in the Supabase bucket: user-ID/timestamp-filename
    // Allows users to upload files with the same name eg. "resume.pdf"
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `user-${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false // Set to true if you want to overwrite files with the same name
      });

    if (error) throw error;

    // Retrieve Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // Insert File metadata into database
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
    res.redirect(redirectURL);

  } catch (err) {
    console.error('Supabase Upload Error:', err);
    req.flash('error', 'Upload failed.');
    res.redirect(redirectURL);
  }
};