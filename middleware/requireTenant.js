function requireTenant(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const tenantId = user.tenant_id || user.id;
  if (!tenantId) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  req.tenantId = tenantId;
  return next();
}

module.exports = { requireTenant };
