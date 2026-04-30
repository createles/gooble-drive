import { Router } from "express";
import { getSignup, postSignup, getLogin, postLogin } from "../controllers/userController.js";

const userRouter = Router();

// Sign Up Routes
userRouter.get('/signup', getSignup);
userRouter.post('/signup', postSignup)

// Login Routes
userRouter.get('/login', getLogin);
// Calls passport authenticate with proper redirects
userRouter.post('/login', postLogin);

export default userRouter;