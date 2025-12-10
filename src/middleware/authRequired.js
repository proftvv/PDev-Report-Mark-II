// v0.0.4
function authRequired(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Giris gerekli' });
}

module.exports = authRequired;

