import { Router } from "express";
import indexRouter from "./indexRouter.js";

const appRouter = Router();

appRouter.use('/', indexRouter);

export default appRouter;