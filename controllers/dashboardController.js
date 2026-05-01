import { prisma } from "../lib/prisma.js";

export const getDashboard = async (req, res) => {
  try {
    // Determine current folder location
    // Convert param to Int as Prisma uses Int for IDs
    const folderId = req.params.folderId ? parseInt(req.params.folderId) : null
    const userId = req.user.id;

    // Fetch current folder details
    let currentFolder = null;
    if (folderId) {
      currentFolder = await prisma.folder.findUnique({
        where: { id: folderId }
      });
    }
    
    // Fetch sub-folders
    const folders = await prisma.folder.findMany({
      where: {
        userId: userId,
        parentId: folderId,
      },
      orderBy: { name: 'asc' }
    });

    // Fetch files
    const files = await prisma.file.findMany({
      where: {
        userId: userId,
        folderId: folderId,
      },
      orderBy: { uploadTime: 'desc' }
    });

    // 5. Render the view with the fetched data
    res.render("dashboard", {
      title: currentFolder ? currentFolder.name : "My Drive",
      viewMode: 'dashboard',
      currentFolder, // Useful for breadcrumbs
      folders,
      files,
      isPublic: false
    });

  } catch (err) {
    console.error("Dashboard loading error:", err);
    res.status(500).send("Error loading dashboard");
  }
}

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

    // Define the time thresholds
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Fetch all files from the past month in a single query
    const recentFiles = await prisma.file.findMany({
      where: {
        userId: userId,
        updatedAt: { gte: oneMonthAgo } // Only fetch files updated in the last 30 days (gte = Greater than or Equal to)
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Group the files into buckets by filtering
    const categorizedFiles = {
      today: recentFiles.filter(file => file.updatedAt >= oneDayAgo),
      pastWeek: recentFiles.filter(file => file.updatedAt >= oneWeekAgo && file.updatedAt < oneDayAgo),
      pastMonth: recentFiles.filter(file => file.updatedAt < oneWeekAgo) // Anything left over
    };

    console.log(categorizedFiles);
    
    // Render dashboard view with 'Recent' flag
    res.render('dashboard', { 
        title: 'Gooble Drive - Recent Files',
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