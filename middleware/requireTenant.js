function requireTenant(req, res, next) {
  const user = req.user;
  if (user) {
    const tenantId = user.tenant_id || user.id;
    if (tenantId) {
      req.tenantId = tenantId;
      return next();
    }
  }
  res.status(401).json({ error: 'Tenant ID requerido' });
}

module.exports = { requireTenant };
