import express from "express";
import session from "express-session";
import passport from "passport";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma.js"; // project's prisma client
import path from 'path';
import { fileURLToPath } from "node:url";
import appRouter from "./routes/appRouter.js";
import initializePassport from "./config/passport-config.js";
import flash from 'connect-flash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View Engine & Static Assets
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Basic express setup to handle HTML forms and JSON
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Session Middleware & The Database Vault
// -- Creates session and saves data to Postgres via Prisma --
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // Cookie expires in 1 day
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // Checks and deletes expired sessions; set to 2 min intervals
      dbRecordIdIsSessionId: true, // Uses session id as id for session data in DB
    })
  })
);

// enable flash error messages with connect-flash
app.use(flash());

// Set up passport configuration
initializePassport(passport);

// Passport Initialization
// -- Passport will use sessions from DB --
app.use(passport.initialize());
app.use(passport.session());

// Grab user info and pin to res.locals.currentUser for easy access
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Connect to router
app.use('/', appRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
