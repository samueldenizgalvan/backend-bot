const requireTenant = (req, res, next) => {
  const tenantId = req.header('x-tenant-id');
  if (!tenantId) {
    return res.status(400).json({ error: 'tenantId required' });
  }
  req.tenantId = tenantId;
  next();
};

module.exports = { requireTenant };
