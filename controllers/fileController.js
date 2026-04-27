import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";

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
  const file = req.fileMetadata;

  try {
    // Fetch the file directly from the Supabase bucket using its 'path', returns a Blob
    const { data, error } = await supabase.storage
      .from('uploads')
      .download(file.path); // Use path key "eg. user-id/filename"

    if (error) throw error;

    // Convert the Blob to a Buffer and stream to user
    const buffer = Buffer.from(await data.arrayBuffer());
    
    // Set headers so the browser knows it's a file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.send(buffer);

  } catch (err) {
    console.error("Download Error:", err);
    req.flash('error', 'Could not download file.');
    res.redirect('/dashboard');
  }
};

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

// === RENAME FILES/FOLDERS ===
export const renameFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;

    await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: { name: newName }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to rename file" });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { newName } = req.body;

    await prisma.folder.update({
      where: { id: parseInt(folderId) },
      data: { name: newName }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to rename folder" });
  }
};


// === DELETE FILES/FOLDERS ===

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // 1. Fetch file to get the URL/Path for storage deletion
    const file = await prisma.file.findUnique({ where: { id: parseInt(fileId) } });
    
    if (!file) return res.status(404).json({ error: "File not found" });

    // Delete from Supabase Storage first
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove([file.path]);

    if (storageError) throw storageError;

    // 2. Delete from Database
    await prisma.file.delete({ where: { id: parseInt(fileId) } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
};


// Recursive helper to find ALL nested file paths
const getAllNestedFilePaths = async (folderId) => {
  let paths = [];

  // Get all files in CURRENT folder
  const files = await prisma.file.findMany({
    where: { folderId: parseInt(folderId) },
    select: { path: true }
  });
  paths.push(...files.map(f => f.path));

  // Get all sub-folders in located in CURRENT folder
  const subFolders = await prisma.folder.findMany({
    where: { parentId: parseInt(folderId) },
    select: { id: true }
  });

  /// Recursively call this function for each sub-folder
  for (const folder of subFolders) {
    const nestedPaths = await getAllNestedFilePaths(folder.id);
    paths.push(...nestedPaths);
  }

  return paths;
};


export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    // Use recursive helper to find all files to be deleted
    const allPaths = await getAllNestedFilePaths(folderId);

    // If we found any files, delete them from Supabase in one go
    if (allPaths.length > 0) {
      await supabase.storage.from('uploads').remove(allPaths);
    }

    // Prisma wipes folders from database w/ help from OnCascade
    await prisma.folder.delete({ where: { id: parseInt(folderId) } });

    res.json({ success: true });
  } catch (err) {
    console.error("Deep Delete Error:", err);
    res.status(500).json({ error: "Failed to delete folder tree." });
  }
};
