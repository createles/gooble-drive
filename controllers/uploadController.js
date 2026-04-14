import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js"

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

// Define Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // We add a timestamp to prevent filename collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Optional: 10MB limit on filesize
});

// Upload logic
export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error", "No file selected.");
      return res.redirect("/dashboard");
    }

    // Save metadata to Prisma
    await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        userId: req.user.id,
        // folderId: null // For now, everything goes to root
      },
    });

    req.flash("success", "File uploaded successfully!");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Upload error:", error);
    req.flash("error", "An error occurred during upload.");
    res.redirect("/dashboard");
  }
};