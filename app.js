import express from "express";
import session from "express-session";
import passport from "passport";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma"; // project's prisma client
import path from 'path';
import { fileURLToPath } from "node:url";

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

// Passport Initialization
// -- Passport will use sessions from DB --
app.use(passport.initialize());
app.use(passport.session());

// Connect to router
app.use('/', appRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
