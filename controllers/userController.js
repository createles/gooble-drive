import passport from "passport";
import bcrypt from "bcryptjs";
import { prisma } from '../lib/prisma.js' // the project's prisma client

// -- Sign Up Handlers -- 
export const getSignup = (req, res) => {
      res.render("sign-up-form", {
        title: 'Gooble Drive - Sign Up'
    })
};

export const postSignup = async (req, res, next) => {
  try {
    // grab data from form
    const { username, password } = req.body;

    // hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user into DB
    const user = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });

    // redirect to login page on success
    res.redirect('/login');

  } catch (error) {
    console.error("Error creating user:", error);
    req.flash('error', 'Sign up failed. Username might be taken.');
    res.redirect('/sign-up'); 
  }
};

// -- Login Handlers -- 
export const getLogin = (req, res) => {
  res.render('login', {
    title: 'Gooble Drive - Log in',
    errorMessage: req.flash('error'),
    successMessage: req.flash('success')
  })
};

// Export the passport authentication middleware directly
export const postLogin = passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
});
