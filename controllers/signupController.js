import bcrypt from "bcryptjs";
import { prisma } from '../lib/prisma.js' // the project's prisma client

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

    res.redirect('/register');
  }
};