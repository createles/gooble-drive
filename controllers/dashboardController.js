import { prisma } from "../lib/prisma.js";
import { copyFolderRecursive } from "./fileController.js";

// Recursive Helper for Sidebar Folder Tree
const buildFolderTree = (folders, parentId = null) => {
  return folders
    .filter(folder => folder.parentId === parentId)
    .map(folder => ({
      ...folder,
      children: buildFolderTree(folders, folder.id) 
    }));
};

export const getDashboard = async (req, res) => {
  try {
    const folderId = req.params.folderId ? parseInt(req.params.folderId, 10) : null;
    const userId = req.user.id;

    // Fetch data concurrently for improved responsiveness
    const [allFolders, currentFolder, folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),
      folderId
        ? prisma.folder.findFirst({
            where: { id: folderId, userId }
          })
        : Promise.resolve(null),
      prisma.folder.findMany({
        where: { userId, parentId: folderId },
        orderBy: { name: 'asc' }
      }),
      prisma.file.findMany({
        where: { userId, folderId: folderId },
        orderBy: { uploadTime: 'desc' }
      })
    ]);

    // If a folder ID was passed but not found or unauthorized for this user
    if (folderId && !currentFolder) {
      req.flash("error", "Folder not found or unauthorized.");
      return res.redirect("/dashboard");
    }

    const folderTree = buildFolderTree(allFolders);

    res.render("dashboard", {
      title: currentFolder ? currentFolder.name : "My Drive",
      sidebarTree: folderTree,
      viewMode: 'dashboard',
      showTutorial: req.user.showTutorial,
      currentFolder,
      folders,
      files,
      isPublic: false
    });

  } catch (err) {
    console.error("Dashboard loading error:", err);
    res.status(500).send("Error loading dashboard");
  }
};

export const postCreateFolder = async (req, res, next) => {
  // Grab name and parentId from form
  const { name, parentId } = req.body;
  const parsedParentId = parentId ? parseInt(parentId) : null;

  try {
    if (parsedParentId) {
      // Check parent folder ownership
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parsedParentId,
          userId: req.user.id
        }
      });

      if (!parentFolder) {
        req.flash("error", "Invalid destination folder.");
        return res.redirect("/dashboard");
      }
    }

    await prisma.folder.create({
      data: {
        name: name,
        userId: req.user.id,
        parentId: parsedParentId
      }
    })

    const redirectUrl = parsedParentId ? `/dashboard/${parsedParentId}` : '/dashboard';
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Folder creation error:", err);
    req.flash("error", "Could not create folder.")
    const redirectUrl = parsedParentId ? `/dashboard/${parsedParentId}` : '/dashboard';
    res.redirect(redirectUrl);
  }
}


export const postCopyFolder = async (req, res) => {
  const folderId = parseInt(req.params.folderId, 10);
  const currentFolderId = req.body.currentFolderId ? parseInt(req.body.currentFolderId, 10) : null;
  if (Number.isNaN(folderId)) {
    req.flash('error', 'Invalid folder selected for copying.');
    const redirectUrl = currentFolderId ? `/dashboard/${currentFolderId}` : '/dashboard';
    return res.redirect(redirectUrl);
  }

  try {
    await copyFolderRecursive(folderId, currentFolderId, req.user.id);
    req.flash('success', 'Folder copied successfully.');
  } catch (err) {
    console.error('Folder copy error:', err);
    req.flash('error', 'Could not copy folder.');
  }

  const redirectUrl = currentFolderId ? `/dashboard/${currentFolderId}` : '/dashboard';
  res.redirect(redirectUrl );
};


// Renders Shared Item Page
export const getSharedItemPage = async (req, res) => {
  const sharedData = req.sharedData; // Set by middleware

  if (!sharedData) {
    return res.status(404).render('public-error', { 
      message: "Shared item not found or link has expired." 
    });
  }

  res.render('shared-item', {
    title: `Shared: ${sharedData.file ? sharedData.file.name : sharedData.folder.name}`,  
    sharedData: sharedData,
    user: req.user || null // Pass user info if logged in, else null
  });
}


export const getRecentPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const [allFolders, recentFiles] = await Promise.all([
      prisma.folder.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),
      prisma.file.findMany({
        where: {
          userId,
          updatedAt: { gte: oneMonthAgo }
        },
        include: {
          folder: true
        },
        orderBy: { updatedAt: 'desc' }
      })
    ]);
    
    const folderTree = buildFolderTree(allFolders);

    const categorizedFiles = {
      today: recentFiles.filter(file => file.updatedAt >= oneDayAgo),
      pastWeek: recentFiles.filter(file => file.updatedAt >= oneWeekAgo && file.updatedAt < oneDayAgo),
      pastMonth: recentFiles.filter(file => file.updatedAt < oneWeekAgo)
    };

    res.render('dashboard', { 
        title: 'Recent Files',
        sidebarTree: folderTree,
        showTutorial: false,
        viewMode: 'recent',
        currentFolder: null,
        categorizedFiles: categorizedFiles,
        isPublic: false
    });

  } catch (error) {
    console.error("Error fetching recent files:", error);
    req.flash('error', 'Could not load recent files.');
    res.redirect('/dashboard');
  }
};


export const getStarredPage = async (req, res) => {
  try {
    const userId = req.user.id;

    const [allFolders, starredFolders, starredFiles] = await Promise.all([
      prisma.folder.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),
      prisma.folder.findMany({
        where: {
          userId,
          isStarred: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.file.findMany({
        where: {
          userId,
          isStarred: true
        },
        include: {
          folder: true
        },
        orderBy: { name: 'asc' } 
      })
    ]);

    const folderTree = buildFolderTree(allFolders);

    res.render('dashboard', { 
        title: 'Starred',
        sidebarTree: folderTree, 
        showTutorial: false,
        viewMode: 'starred',
        currentFolder: null, 
        folders: starredFolders,
        files: starredFiles,
        isPublic: false
    });

  } catch (error) {
    console.error("Error fetching starred items:", error);
    req.flash('error', 'Could not load starred items.');
    res.redirect('/dashboard');
  }
};


// === API For Search Suggestions in Navbar ===
export const searchItems = async (req, res) => {
  try {
    const { q } = req.query; // e.g., /api/search?q=myFile
    const userId = req.user.id;

    // If query is empty or too short, return empty arrays to save DB load
    if (!q || q.trim().length < 2) {
      return res.json({ files: [], folders: [] });
    }

    // Search Folders (mode: 'insensitive' makes it case-blind)
    const folders = await prisma.folder.findMany({
      where: {
        userId: userId,
        name: { contains: q, mode: 'insensitive' }
      },
      take: 5 // Limit to top 5 results
    });

    // Search Files
    const files = await prisma.file.findMany({
      where: {
        userId: userId,
        name: { contains: q, mode: 'insensitive' }
      },
      include: {
        folder: true // We need the folder data so we know where to redirect!
      },
      take: 5
    });

    res.json({ files, folders });

  } catch (error) {
    console.error("Search API error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};