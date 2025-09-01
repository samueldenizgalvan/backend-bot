function protegerRuta(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'No autorizado' });
}

function requireTenant(req, res, next) {
  if (req.session && req.session.user) {
    req.tenant = req.session.user;
    return next();
  }
  res.status(401).json({ error: 'Tenant requerido' });
}

module.exports = { protegerRuta, requireTenant };
