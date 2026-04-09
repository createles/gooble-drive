import passport from "passport";

export const getLogin = (req, res) => {
  res.render('login', {
    title: 'Gooble Drive - Log in',
    errorMessage: req.flash('error')
  })
};

// Export the passport authentication middleware directly
export const postLogin = passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
});
