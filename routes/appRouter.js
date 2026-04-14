import { Router } from "express";
import dboardRouter from "./dashboardRouter.js";
import userRouter from "./userRouter.js";
import { isLoggedIn } from "../middleware/authMiddleware.js"; // Updated import path

const appRouter = Router();

// Check for login status: yes -> dashboard // no -> homepage
appRouter.get('/', isLoggedIn, (req, res) => {
  res.render('homepage', {
      title: 'Gooble Drive - Welcome'
  });
})

appRouter.use('/', userRouter);
appRouter.use('/dashboard', dboardRouter);

export default appRouter;