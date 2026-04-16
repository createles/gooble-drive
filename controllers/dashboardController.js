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
      currentFolder, // Useful for breadcrumbs
      folders,
      files,
    });

  } catch (err) {
    console.error("Dashboard loading error:", err);
    res.status(500).send("Error loading dashboard");
  }
}