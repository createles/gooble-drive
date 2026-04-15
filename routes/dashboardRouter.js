import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { isAuth } from "../middleware/authMiddleware";

const dashboardRouter = Router();

dashboardRouter.get('/', isAuth, getDashboard);

export default dashboardRouter;