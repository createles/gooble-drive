import passport from "passport";
import bcrypt from "bcryptjs";
import { prisma } from '../lib/prisma.js' // the project's prisma client

// -- Sign Up Handlers -- 
export const getSignup = (req, res) => {
      res.render("sign-up-form", {
        title: 'Gooble Drive - Sign Up',
        errorMessage: req.flash('error'), // pass notif messages to ejs
        successMessage: req.flash('success')
    })
};

export const postSignup = async (req, res, next) => {
  try {
    // grab data from form
    const { username, password } = req.body;
    const confirmPassword = req.body['confirm-password']; // need brackets to access hyphenated name element

    // Validate Password Match
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/signup');
    }

    // hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Define metadata for tutorial files
    const TUTORIAL_ASSETS = [
      {
        name: 'Welcome to Gooble Drive.txt',
        path: 'tutorial-assets/Welcome to Gooble Drive.txt',
        url: 'https://znethacxsuqbizfrtkul.supabase.co/storage/v1/object/public/uploads/tutorial-assets/Welcome%20to%20Gooble%20Drive.txt',
        size: '0.322 KB'
      },
      {
        name: 'El Nido.jpg',
        path: 'tutorial-assets/El Nido.jpg',
        url: 'https://znethacxsuqbizfrtkul.supabase.co/storage/v1/object/public/uploads/tutorial-assets/El%20Nido.jpg',
        size: '1010 KB',
      },
      {
        name: 'awesome.jpg',
        path: 'tutorial-assets/awesome.jpg',
        url: 'https://znethacxsuqbizfrtkul.supabase.co/storage/v1/object/public/uploads/tutorial-assets/awesome.jpg',
        size: '1720 KB',
      },
      {
        name: 'super friends.jpg',
        path: 'tutorial-assets/super friends.jpg',
        url: 'https://znethacxsuqbizfrtkul.supabase.co/storage/v1/object/public/uploads/tutorial-assets/super%20friends.jpg',
        size: '1760 KB',
      }
    ]
    
    // Prisma Transaction to create user
    // and populate dashboard with tutorial folder
    await prisma.$transaction(async (tx) => {
      
      // insert user into DB
      const newUser = await tx.user.create({
        data: {
          username: username,
          password: hashedPassword,
        },
      });

      // Create "Getting Started" Folder
      const gettingStarted = await tx.folder.create({
        data: {
          name: 'Getting Started',
          userId: newUser.id,
        },
      });

      // Create "Close ups" Folder
      const closeUps = await tx.folder.create({
        data: {
          name: 'Close ups',
          userId: newUser.id,
          parentId: gettingStarted.id,
        }
      });

      // Link assets to new user in database
      const starterRecords = TUTORIAL_ASSETS.map(asset => ({
        ...asset,
        userId: newUser.id,
        folderId: asset.name === 'awesome.jpg' || asset.name === 'super friends.jpg' ? closeUps.id : gettingStarted.id,
        isStarred: asset.name.includes('Welcome') // Star the Welcome file
      }));

      await tx.file.createMany({
        data: starterRecords
      });
    });

    // redirect to login page on success
    req.flash('success', 'Account created successfully! Please log in.');
    res.redirect('/login');

  } catch (error) {
    console.error("Error creating user:", error);
    req.flash('error', 'Sign up failed. Username is already taken.');
    res.redirect('/signup'); 
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


export const postLogout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been logged out.');
    res.redirect('/login');
  });
};