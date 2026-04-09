import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export default function initializePassport(passport) {
  
  // Verification Callback function
  const authenticateUser = async (username, password, done) => {
    try {
      // Find user in DB
      const user = await prisma.user.findUnique({
        where: { username: username }
      });

      if (!user) {
        // done(error, user, options) syntax
        return done(null, false, { message: 'No user with that username' });
      }

      // Compare hashed password
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        return done(null, user); // Success, return User
      } else {
        return done(null, false, { message: 'Password incorrect'}); // Wrong password
      }
    } catch (error) {
      return done(error); // Server/Database error
    }
  };

  // Register strategy
  passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));

  // Serialize User (Write to Session DB)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize User (Read from Session DB)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: id }
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}