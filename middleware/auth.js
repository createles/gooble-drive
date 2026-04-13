export const isAuth = (req, res, next) => {
  // Passport checks for user
  if (req.isAuthenticated()) {
    return next();
  }

  // if not found, redirect back to login
  res.redirect('/login');
}