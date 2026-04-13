import { Router } from "express";
import { isAuth } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";

const dboardRouter = Router();

dboardRouter.get('/', isAuth, getDashboard);

export default dboardRouter;
