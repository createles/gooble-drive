import { Router } from "express";
import indexRouter from "./indexRouter.js";
import dboardRouter from "./dashboardRouter.js";

const appRouter = Router();

appRouter.use('/', indexRouter);
appRouter.use('/dashboard', dboardRouter);

export default appRouter;