import { Router } from "express";

const indexRouter = Router();

indexRouter.get('/', (req, res) => {
    res.send("File Uploader App is Running!");
})

export default indexRouter;