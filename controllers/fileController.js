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

export const generateShareLink = async (req, res) => {
  try {
    const { fileId, duration } = req.body; // Grab from a fetch request
    
    // Calculate expiration date object
    // in milliseconds (e.g., 1 day = 86400000)
    const expiresAt = new Date(Date.now() + parseInt(duration));

    // Create the share record
    const sharedFile = await prisma.share.create({
      data: {
        fileId: parseInt(fileId),
        expiresAt: expiresAt
      }
    });

    // Send the UUID (sharedFile.id) back to the client
    // Use req.get('host') to build a full URL automatically
    const fullUrl = `${req.protocol}://${req.get('host')}/share/${sharedFile.id}`;
    
    // Return json with shareLink
    return res.json({ shareLink: fullUrl });

  } catch (err) {
    console.error("Failed to generate shareable Link:", err);
    return res.status(500).json({ error: "Could not generate link." });
  }
}

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // 1. Fetch file to get the URL/Path for storage deletion
    const file = await prisma.file.findUnique({ where: { id: parseInt(fileId) } });
    
    if (!file) return res.status(404).json({ error: "File not found" });

    // [FUTURE CLOUD LOGIC HERE]: call cloudinary.uploader.destroy(file.publicId)

    // 2. Delete from Database
    await prisma.file.delete({ where: { id: parseInt(fileId) } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
};