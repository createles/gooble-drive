import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";

// === MIDDLEWARE ===

// Fetching File Metadata for Downloads
export const getFileMetadata = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    // Query for file, verifying user ownership
    const file = await prisma.file.findFirst({ 
      where: { 
        id: parseInt(fileId),
        userId: req.user.id // Ownership check
      }
    });

    if (!file) {
      req.flash("error", "File could not be found or verified to the current user.");
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

// Download Logic
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


// Generate Share Token Link for Shared Access
export const generateShareLink = async (req, res) => {
  try {
    const { itemId, itemType, duration } = req.body; // Grab from a fetch request
    
    // Calculate expiration date object
    // in milliseconds (e.g., 1 day = 86400000)
    const expiresAt = new Date(Date.now() + parseInt(duration));
  
    if (itemType === 'file') {
      // Verify file exists and belongs to user
      const file = await prisma.file.findFirst({
        where: { id: parseInt(itemId), userId: req.user.id }
      });
      if (!file) return res.status(404).json({ error: "File not found" });
      
    } else if (itemType === 'folder') {
      // Verify folder exists and belongs to user
      const folder = await prisma.folder.findFirst({
        where: { id: parseInt(itemId), userId: req.user.id }
      });
      if (!folder) return res.status(404).json({ error: "Folder not found" });
    }

    // Create the share record
    const sharedItem = await prisma.share.create({
      data: {
        fileId: itemType === 'file' ? parseInt(itemId) : null, // Only set fileId if it's a file **FIXED: null being parsed into NaN
        folderId: itemType === 'folder' ? parseInt(itemId) : null, // Only set folderId if it's a folder
        expiresAt: expiresAt
      }
    });

    // Send the UUID (sharedItem.id) back to the client
    // Use req.get('host') to build a full URL automatically
    const fullUrl = `${req.protocol}://${req.get('host')}/share/${sharedItem.id}`;
    
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

    // Check for file and ownership
    const file = await prisma.file.findFirst({
      where: {
        id: parseInt(fileId),
        userId: req.user.id
      }
    })

    if (!file) return res.status(404).json({ error: "File could not be found or authorized for renaming."})
    
    // Grab file ext eg. ".pdf"
    const extension = path.extname(file.name);

    // Construct new name with file extension appended
    const fullNewName = `${newName}${extension}`;
    
    await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: { name: fullNewName }
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

    const folder = await prisma.folder.findFirst({ 
      where: {
        id: parseInt(folderId),
        userId: req.user.id
      } });

    if (!folder) return res.status(404).json({ error: "Folder could not be found or authorized for renaming." });

    await prisma.folder.update({
      where: { id: parseInt(folderId) },
      data: { name: newName }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to rename folder." });
  }
};


// === DELETE FILES/FOLDERS ===

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Fetch file to get the URL/Path for storage deletion
    // Check for file and ownership
    const file = await prisma.file.findFirst({ 
      where: {
        id: parseInt(fileId),
        userId: req.user.id
      } 
    });
    
    if (!file) return res.status(404).json({ error: "File could not be found or authorized for deletion." });


    // Count how many records share this same path (duplicated files)
    const pathCount = await prisma.file.count({
      where: { path: file.path }
    });

    // GUARD: Prevents Tutorial files from being deleted from Supabase
    if (!file.path.startsWith('tutorial-assets/')) {
      // -- Non-Tutorial Files --
      // Delete from Supabase Storage first
      if (pathCount === 1) { // Only delete from storage if this is the last record with that path  
        const { error: storageError } = await supabase.storage
          .from('uploads')
          .remove([file.path]);

        if (storageError) throw storageError;
      }
    }

    // Delete from Database
    await prisma.file.delete({ where: { id: parseInt(fileId) } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
};


// Recursive helper to find ALL nested file paths
const getAllNestedFileData = async (folderId) => {
  let fileIds = []; // holds all fileIds to be deleted
  let paths = [];

  // Get all files in CURRENT folder
  const files = await prisma.file.findMany({
    where: { folderId: parseInt(folderId) },
    select: { id: true, path: true }
  });

  fileIds.push(...files.map(f => f.id));
  paths.push(...files.map(f => f.path));

  // Get all sub-folders in located in CURRENT folder
  const subFolders = await prisma.folder.findMany({
    where: { parentId: parseInt(folderId) },
    select: { id: true }
  });

  /// Recursively call this function for each sub-folder
  for (const folder of subFolders) {
    const nestedData = await getAllNestedFileData(folder.id);
    fileIds.push(...nestedData.fileIds);
    paths.push(...nestedData.paths);
  }

  return { fileIds, paths }; // Return an object with both fileIds and paths
};


export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    // Check for folder and ownership
    const folder = await prisma.folder.findFirst({ 
      where: { 
        id: parseInt(folderId),
        userId: req.user.id
      }
    });

    if (!folder) return res.status(404).json({ error: "Folder could not be found or authorized for deletion." });
    
    // Use recursive helper to find all files to be deleted
    const { fileIds, paths } = await getAllNestedFileData(folderId);
    const uniquePaths = [...new Set(paths)]; // Remove duplicate paths

    // Determine which paths are safe to delete (not shared by other records outside this folder tree)
    const pathsToRemoveFromStorage = [];

    for (const path of uniquePaths) {
      // Check for database records sharing this path
      const sharedCount = await prisma.file.count({
        where: { 
          path: path, 
          id: { notIn: fileIds } } // Exclude files that are being deleted in this operation 
      });

      if (sharedCount === 0) { // Only delete from storage if no other records share this path
        pathsToRemoveFromStorage.push(path);
      }
    }

    // Delete them from Supabase in one go
    if (pathsToRemoveFromStorage.length > 0) {
      await supabase.storage.from('uploads').remove(pathsToRemoveFromStorage);
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


//  === COPY FILES/FOLDERS ===
export const copyFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Fetch the original file metadata
    const originalFile = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    });

    if (!originalFile) return res.status(404).json({ error: "File not found" });

    // Generate new unique path and name for Copy
    // Pattern: "original-path-copy-timestamp" to ensure Supabase uniqueness
    const timestamp = Date.now();

    // Split path and name to preserve extension on copy
    // eg. "user-1/my-image.png"
    const ext = path.extname(originalFile.path); // ".png"
    const pathBase = originalFile.path.slice(0, originalFile.path.lastIndexOf(ext)); // "user-1/my-image"
    const nameBase = originalFile.name.slice(0, originalFile.name.lastIndexOf(ext)); // "my-image"
    
    // Construct new Path and Name and append extension
    const newPath = `${pathBase}-copy-${timestamp}${ext}`; // "user-1/my-image-copy-123.png"
    const newName = `${nameBase} (copy)${ext}`; // "my-image (copy).png"

    // Supabase handles Server-side Copy
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .copy(originalFile.path, newPath);

    if (storageError) throw storageError;

    // Create the new Database record
    // Omit 'id' so Prisma generates a new one, and reset 'uploadTime' to now
    await prisma.file.create({
      data: {
        name: newName,
        url: originalFile.url.replace(originalFile.path, newPath), // Update URL if it contains the path, skips api call
        path: newPath,
        size: originalFile.size,
        userId: originalFile.userId,
        folderId: originalFile.folderId,
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Copy Error:", err);
    res.status(500).json({ error: "Failed to duplicate file." });
  }
};


export const copyFolderRecursive = async (originalFolderId, targetParentId, userId) => {
  try {
    // Fetch the original folder details
    const original = await prisma.folder.findUnique({
      where: { id: originalFolderId },
      include: { files: true, children: true } // 'Children' are immediate sub-folders
    });

    // Create new folder record
    const newFolder = await prisma.folder.create({
      data: {
        name: `${original.name} (copy)`,
        userId: userId,
        parentId: targetParentId, // Where the copy is being placed
      }
    });

    // Copy all Files in this folder
    if (original.files.length > 0) {
      const fileData = original.files.map(file => ({
        name: file.name,
        url: file.url,
        path: file.path,
        size: file.size,
        userId: userId,
        folderId: newFolder.id // Link to the NEW folder
      }));
      
      await prisma.file.createMany({ data: fileData });
    }

    // Recursively copy subfolders
    for (const childFolder of original.children) {
      await copyFolderRecursive(childFolder.id, newFolder.id, userId);
    }

    return newFolder; // Return the newly created folder object
  } catch (err) {
    console.error("Recursive Copy Error:", err);
    throw new Error("Failed to copy folder tree.");
  }
}

// === DISPLAY SHARED ITEM METADATA (for both files and folders) ===
export const getSharedItemMetadata = async (req, res, next) => {
  try {
    const { shareId } = req.params; // This is the UUID from the share link

    // Fetch the share record and include related file or folder metadata
    const shareRecord = await prisma.share.findUnique({
      where: { id: shareId },
      include: {
        file: true, // Include file metadata if it's a file share
        folder: true, // Include folder metadata if it's a folder share
      }
    });

    if (!shareRecord) {
      return res.status(404).render('public-error', { message: "Shared item not found." });
    }

    if (new Date() > shareRecord.expiresAt) {
      return res.status(403).render('public-error', { message: "This share link has expired." });
    }

    // If sharing a folder, fetch immediate contents (files and sub-folders)
    if (shareRecord.folder) {
      const folderId = shareRecord.folder.id;
      shareRecord.contents = {
        folders: await prisma.folder.findMany({ where: { parentId: folderId } }),
        files: await prisma.file.findMany({ where: { folderId: folderId } })
      };
    }

    // Attach to request for the next function (the Page Controller)
    req.sharedData = shareRecord;
    next();
  } catch (err) {
    console.error("Error fetching shared item metadata:", err);
    return res.status(500).render('public-error', { message: "Failed to fetch shared item metadata." });
  }
};


// === MIDDLEWARE: VALIDATE PUBLIC SHARE TOKEN ===
export const validatePublicShare = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const { fileId } = req.query; // If coming from folder share, need to pass specific fileId to download

    // Find the share record
    const shareRecord = await prisma.share.findUnique({
      where: { id: shareId },
      include: { file: true, folder: true }
    });

    // If token exists, but has no file or folder attached, mark as invalid
    if (!shareRecord) return res.status(404).send("Invalid share link.");

    // If token is expired, show expired message
    if (new Date() > shareRecord.expiresAt) {
      return res.status(403).send("This share link has expired.");
    }

    // Resolve the File
    let fileToDownload = null;

    if (shareRecord.file) {
      // Direct file download
      fileToDownload = shareRecord.file;
    } else if (shareRecord.folder && fileId) {
      // If downloading from a folder, verify file first
      fileToDownload = await prisma.file.findFirst({
        where: { 
          id: parseInt(fileId),
          folderId: shareRecord.folderId 
        }
      });
    }

    if (!fileToDownload) return res.status(404).send("Error downloading file.");

    // SUCCESS: Attach metadata so startDownload can take over
    req.fileMetadata = fileToDownload;
    next();
  } catch (err) {
    console.error("Public Share Validation Error:", err);
    res.status(500).send("Server error during download.");
  }
};

// === STAR TOGGLE ===
export const toggleStar = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType, isStarred } = req.body;

    let item = null;

    if (itemType === 'file') {
      item = await prisma.file.findFirst({
        where: {
          id: parseInt(itemId),
          userId: req.user.id
        }
      });
    } else if (itemType === 'folder') {
      item = await prisma.folder.findFirst({
        where: {
          id: parseInt(itemId),
          userId: req.user.id
        }
      });
    } else {
      return res.status(400).json({ error: "Invalid itemType. Must be 'file' or 'folder'." });
    }

    if (!item) return res.status(404).json({ error: "File/Folder not found or unauthorized." });

    // set updatedItem AFTER calling prisma update
    // assign it as return value of .update call
    const updatedItem = itemType === 'file'
      ? await prisma.file.update({
          where: { id: parseInt(itemId) },
          data: { isStarred }
        })
      : await prisma.folder.update({
          where: { id: parseInt(itemId) },
          data: { isStarred }
        });

    res.json({ success: true, isStarred: updatedItem.isStarred });
  } catch (err) {
    console.error('Error toggling star:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};