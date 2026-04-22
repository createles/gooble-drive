import { Router } from "express";
import userRouter from "./userRouter.js";
import { isAuth, isLoggedIn } from "../middleware/authMiddleware.js"; // Updated import path
import { getDashboard, postCreateFolder } from "../controllers/dashboardController.js";
import { handleUpload, upload } from "../controllers/uploadController.js";
import dashboardRouter from "./dashboardRouter.js";
import { generateShareLink, getFileMetadata, startDownload } from "../controllers/fileController.js";

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


export default appRouter;