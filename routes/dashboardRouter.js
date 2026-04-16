import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { isAuth } from "../middleware/authMiddleware.js";

const dashboardRouter = Router();

dashboardRouter.get('/', isAuth, getDashboard);

dashboardRouter.get('/:folderId', isAuth, getDashboard)

export default dashboardRouter;