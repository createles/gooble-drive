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


// === MOVE FILES/FOLDER ===

// Determines illegal folders to move to
const getDescendantFolderIds = async (folderId) => {
  let ids = [parseInt(folderId)]; // Includes the folder itself

  const subFolders = await prisma.folder.findMany({
    where: { parentId: parseInt(folderId) },
    select: { id: true }
  });

  for (const folder of subFolders) {
    const nestedIds = await getDescendantFolderIds(folder.id);
    ids.push(...nestedIds);
  }

  // List of illegal folder ids
  return ids;
};


// Fetch all possible destination folders for the dropdown
export const getUserFolders = async (req, res) => {
  try {
    const { movingId, type } = req.query;

    // First, get all folders belonging to the user
    const allFolders = await prisma.folder.findMany({
      where: { userId: req.user.id },
      select: { id: true, name: true }
    });

    // Identify illegal folders to move to
    let illegalIds = [];
    if (type === 'folder' && movingId) {
      illegalIds = await getDescendantFolderIds(movingId);
    }

    // Map folders and add 'isInvalid' flag
    const folderList = allFolders.map(folder => ({
      ...folder,
      isInvalid: illegalIds.includes(folder.id)
    }));

    // Return folders including isInvalid flag
    res.json(folderList);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch folders" });
  }
};

// Circularity check to prevent illegal moves (eg. moves into a nested sub-folder)
const isDescendant = async (potentialParentId, folderId) => {
  // Destination being Root (null) is always safe
  if (!folderId) return false;

  // Fetch the folder we are trying to move INTO
  const currentFolder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { parentId: true }
  });

  // If this folder's parent is the folder we are moving, return true
  if (currentFolder.parentId === potentialParentId) return true;

  // Keep climbing up the tree until we hit the root, recursively call function
  if (currentFolder.parentId !== null) {
    return await isDescendant(potentialParentId, currentFolder.parentId);
  }

  // Hit the root folder without illegal moves, move is SAFE
  return false;
};

// Move Folder Logic
export const moveFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    let { destinationId } = req.body;
    
    // targetId = folder to be moved
    const targetId = parseInt(folderId);
    const destId = destinationId === 'root' ? null : parseInt(destinationId);

    // Guardrail: Prevent moving into self/current folder
    if (targetId === destId) {
      return res.status(400).json({ error: "Cannot move a folder into itself" });
    }

    // Guardrail 2: Prevent moving into descendant
    const isIllegal = await isDescendant(targetId, destId);
    if (isIllegal) {
      return res.status(400).json({
        error: "Illegal Move: You cannot move a folder into one of its own sub-folders."
      })
    }

    await prisma.folder.update({
      where: { id: targetId },
      data: { parentId: destId }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to move folder" });
  }
};


// Move File Logic
export const moveFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { destinationId } = req.body;
    
    const destId = destinationId === 'root' ? null : parseInt(destinationId);

    await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: { folderId: destId }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to move file" });
  }
};
