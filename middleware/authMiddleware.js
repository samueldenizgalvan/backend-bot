function protegerRuta(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'No autorizado' });
}

module.exports = { protegerRuta };
