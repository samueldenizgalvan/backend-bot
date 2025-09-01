function requireTenant(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(400).json({ error: 'tenantId header missing' });
  }
  req.tenantId = tenantId;
  next();
}

module.exports = requireTenant;
