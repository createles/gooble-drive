import { Router } from "express";
import { getSignup, postSignup, getLogin, postLogin, postLogout } from "../controllers/userController.js";
import { isAuth } from "../middleware/authMiddleware.js";

const userRouter = Router();

// Sign Up Routes
userRouter.get('/signup', getSignup);
userRouter.post('/signup', postSignup)

// Login Routes
userRouter.get('/login', getLogin);
// Calls passport authenticate with proper redirects
userRouter.post('/login', postLogin);

// Tutorial Completion route
userRouter.post('/user/complete-tutorial', isAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { showTutorial: false } // Tick tutorial flag to false
  });
  res.sendStatus(200);
});

// Logout Route
userRouter.post('/logout', postLogout);

export default userRouter;