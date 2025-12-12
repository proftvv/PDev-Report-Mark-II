/**
 * Role ve Permission Validation Helpers
 * Merkezi kullanıcı rol ve yetki kontrolü
 */

/**
 * Kullanıcının admin olup olmadığını kontrol et
 * @param {Object} user - Session user object
 * @returns {boolean}
 */
function isAdmin(user) {
  return user && user.username === 'proftvv';
}

/**
 * Kullanıcının authenticated olup olmadığını kontrol et
 * @param {Object} user - Session user object
 * @returns {boolean}
 */
function isAuthenticated(user) {
  return user && user.id !== undefined;
}

/**
 * Admin yetkisi kontrol et ve error döndür
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {boolean} - True if admin, false otherwise
 */
function checkAdminPermission(req, res) {
  const { sendError } = require('./errorCodes');
  
  if (!isAuthenticated(req.session?.user)) {
    sendError(res, 'AUTH.NO_SESSION');
    return false;
  }
  
  if (!isAdmin(req.session.user)) {
    sendError(res, 'AUTHZ.ADMIN_ONLY');
    return false;
  }
  
  return true;
}

/**
 * Authentication kontrol et ve error döndür
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {boolean} - True if authenticated, false otherwise
 */
function checkAuthentication(req, res) {
  const { sendError } = require('./errorCodes');
  
  if (!isAuthenticated(req.session?.user)) {
    sendError(res, 'AUTH.NO_SESSION');
    return false;
  }
  
  return true;
}

/**
 * IP bazlı yetki kontrol et (local machine only)
 * @param {Object} req - Express request
 * @returns {boolean} - True if local, false otherwise
 */
function isLocalIp(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const localIps = ['127.0.0.1', '::1', 'localhost'];
  return localIps.includes(ip);
}

/**
 * Admin işlemini log et
 * @param {Object} req - Express request
 * @param {string} action - Yapılan işlem
 * @param {Object} details - Ek detaylar
 */
function logAdminAction(req, action, details = {}) {
  const logger = require('../services/logger');
  const user = req.session?.user;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  
  logger.info(
    `Admin action: ${action}`,
    {
      type: 'ADMIN_ACTION',
      user: user?.username || 'unknown',
      userId: user?.id || null,
      action,
      ip,
      timestamp: new Date().toISOString(),
      ...details
    }
  );
}

module.exports = {
  isAdmin,
  isAuthenticated,
  checkAdminPermission,
  checkAuthentication,
  isLocalIp,
  logAdminAction
};
