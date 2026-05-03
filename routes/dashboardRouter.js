import { Router } from "express";
import { getDashboard, getRecentPage, getStarredPage, searchItems } from "../controllers/dashboardController.js";
import { isAuth } from "../middleware/authMiddleware.js";

const dashboardRouter = Router();

dashboardRouter.get('/', isAuth, getDashboard);
dashboardRouter.get('/recent', isAuth, getRecentPage);
dashboardRouter.get('/starred', isAuth, getStarredPage);
dashboardRouter.get('/api/search', isAuth, searchItems);
dashboardRouter.get('/:folderId', isAuth, getDashboard)

export default dashboardRouter;