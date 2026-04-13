export const getDashboard = (req, res) => {
  res.render('dashboard', {
    title: 'Gooble Drive - Dashboard'
  });
}