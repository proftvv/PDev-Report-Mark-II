// v0.0.2
const config = require('../config');

function adminOnly(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (config.adminIps.includes(ip)) {
    return next();
  }
  return res.status(403).json({ error: 'Bu islem sadece ana makineden yapilabilir' });
}

module.exports = adminOnly;

