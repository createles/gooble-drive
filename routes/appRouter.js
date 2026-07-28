import { Router } from "express";
import userRouter from "./userRouter.js";
import dashboardRouter from "./dashboardRouter.js";
import { isAuth, isLoggedIn } from "../middleware/authMiddleware.js";
import { getSharedItemPage, postCreateFolder, postCopyFolder } from "../controllers/dashboardController.js";
import { handleUpload, handleSingleUpload } from "../controllers/uploadController.js";
import { 
  copyFile, 
  deleteFile, 
  deleteFolder, 
  generateShareLink, 
  getFileMetadata, 
  getSharedItemMetadata, 
  getUserFolders, 
  moveFile, 
  moveFolder, 
  renameFile, 
  renameFolder, 
  startDownload, 
  toggleStar, 
  validatePublicShare 
} from "../controllers/fileController.js";

const appRouter = Router();

// Check for login status: yes -> dashboard // no -> homepage
appRouter.get('/', isLoggedIn, (req, res) => {
  res.render('homepage', {
    title: 'Gooble Drive - Welcome'
  });
});

appRouter.use('/', userRouter);
appRouter.use('/dashboard', dashboardRouter);

// File Upload Route
appRouter.post('/upload', isAuth, handleSingleUpload, handleUpload);

// Download Route
appRouter.get('/download/:fileId', getFileMetadata, startDownload);

// Folder Creation Route
appRouter.post('/folders/create', isAuth, postCreateFolder);

// Share Link Generation Route
appRouter.post('/share', isAuth, generateShareLink);

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
appRouter.post('/files/:fileId/copy', isAuth, copyFile);
appRouter.post('/folders/:folderId/copy', isAuth, postCopyFolder);

// Star Toggle Routes
appRouter.patch('/files/:itemId/star', isAuth, toggleStar);
appRouter.patch('/folders/:itemId/star', isAuth, toggleStar);

// Public Share Routes
appRouter.get('/share/:shareId', getSharedItemMetadata, getSharedItemPage);
appRouter.get('/public/download/:shareId', validatePublicShare, startDownload);

export default appRouter;