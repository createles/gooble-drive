import { prisma } from "../lib/prisma.js";

export const getFileMetadata = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.file.findUnique({ 
      where: { id: parseInt(fileId) }
    });

    if (!file) {
      req.flash("error", "File not found.");
      return res.redirect("/dashboard");
    }

    // Attach the file to the request object so the next function can see it
    req.fileMetadata = file; 
    next(); 
  } catch (err) {
    console.error('Failed to fetch file:', err);
    res.redirect("/dashboard");
  }
}

export const startDownload = async (req, res) => {
  // Grab the file metadata attached by the previous function
  const file = req.fileMetadata;

  // Use res.download(path, optionalName)
  res.download(file.url, file.name); 
}

