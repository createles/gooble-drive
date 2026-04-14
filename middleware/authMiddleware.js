const createAuthMiddleware = ({
  redirectIfAuthenticated = null,
  redirectIfNotAuthenticated = null,
  flashMessage = null
}) => {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      if (redirectIfAuthenticated) {
        return res.redirect(redirectIfAuthenticated);
      }
    } else { // User is not authenticated
      if (redirectIfNotAuthenticated) {
        if (flashMessage && req.flash) { // Ensure req.flash exists before using it
          req.flash('error', flashMessage);
        }
        return res.redirect(redirectIfNotAuthenticated);
      }
    }
    next(); // Proceed if no redirection condition is met
  };
};

// Specific middleware instances for common use cases
// homepage -- not logged in, dashboard --- logged in
export const isLoggedIn = createAuthMiddleware({
  redirectIfAuthenticated: '/dashboard'
});

// Redirect to log in page
export const isAuth = createAuthMiddleware({
  redirectIfNotAuthenticated: '/login', // Assuming '/login' is your login route
  flashMessage: 'Please log in to view that resource'
});

export default createAuthMiddleware;