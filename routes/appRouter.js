import { Router } from "express";
import userRouter from "./userRouter.js";
import { isAuth, isLoggedIn } from "../middleware/authMiddleware.js"; // Updated import path
import { getDashboard } from "../controllers/dashboardController.js";
import { handleUpload, upload } from "../controllers/uploadController.js";

const appRouter = Router();

// Check for login status: yes -> dashboard // no -> homepage
appRouter.get('/', isLoggedIn, (req, res) => {
  res.render('homepage', {
      title: 'Gooble Drive - Welcome'
  });
})

appRouter.use('/', userRouter);
appRouter.get('/dashboard', isAuth, getDashboard);
appRouter.use('/upload', isAuth, upload.single('file'), handleUpload)


export default appRouter;