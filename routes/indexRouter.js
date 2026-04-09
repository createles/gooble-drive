import { Router } from "express";
import { getSignup, postSignup } from "../controllers/signupController.js";
import { getLogin, postLogin } from "../controllers/loginController.js";

const indexRouter = Router();

indexRouter.get('/', (req, res) => {
    res.render('homepage', {
        title: 'Gooble Drive - Home'
    });
})

indexRouter.get('/sign-up', getSignup);
indexRouter.post('/signup', postSignup)

indexRouter.get('/login', getLogin);
// Calls passport authenticate with proper redirects
indexRouter.post('/login', postLogin);

export default indexRouter;