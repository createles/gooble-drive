import { Router } from "express";
import userRouter from "./userRouter.js";
import { isAuth, isLoggedIn } from "../middleware/authMiddleware.js"; // Updated import path
import { getDashboard, postCreateFolder } from "../controllers/dashboardController.js";
import { handleUpload, upload } from "../controllers/uploadController.js";
import dashboardRouter from "./dashboardRouter.js";
import { copyFile, deleteFile, deleteFolder, generateShareLink, getFileMetadata, getUserFolders, moveFile, moveFolder, renameFile, renameFolder, startDownload } from "../controllers/fileController.js";

const appRouter = Router();

// Check for login status: yes -> dashboard // no -> homepage
appRouter.get('/', isLoggedIn, (req, res) => {
  res.render('homepage', {
      title: 'Gooble Drive - Welcome'
  });
})

appRouter.use('/', userRouter);
appRouter.use('/dashboard', dashboardRouter);


appRouter.use('/upload', isAuth, upload.single('file'), handleUpload);
appRouter.get('/download/:fileId', getFileMetadata, startDownload);

appRouter.post('/folders/create', isAuth, postCreateFolder);

// Route for Fetch API call to get shareable link
appRouter.post('/files/share', isAuth, generateShareLink);

// Delete routes
appRouter.delete('/files/:fileId/delete', isAuth, deleteFile);
appRouter.delete('/folders/:folderId/delete', isAuth, deleteFolder);

// Rename routes
appRouter.patch('/files/:fileId/rename', isAuth, renameFile);
appRouter.patch('/folders/:folderId/rename', isAuth, renameFolder);

// Move Routes
appRouter.get('/folders', isAuth, getUserFolders);
appRouter.patch('/files/:fileId/move', isAuth, moveFile);
appRouter.patch('/folders/:folderId/move', isAuth, moveFolder);

// Copy Routes
appRouter.post('/files/:fileId/copy', isAuth, copyFile)

export default appRouter;