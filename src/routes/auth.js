const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const logger = require('../services/logger');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Support legacy 'username' field for backward compatibility
    const loginIdentifier = identifier || req.body.username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: '[L-001] Kullanici ve sifre gerekli' });
    }

    // Query both username and custom_id fields
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR custom_id = ?',
      [loginIdentifier, loginIdentifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '[L-002] Kullanıcı bulunamadı' });
    }

    if (rows.length > 1) {
      // This shouldn't happen with UNIQUE constraints, but handle it gracefully
      logger.error('Multiple users found for identifier', { identifier: loginIdentifier });
      return res.status(500).json({ error: '[L-003] Birden fazla kullanıcı bulundu (sistem hatası)' });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      logger.warn('Password mismatch', { identifier: loginIdentifier });
      return res.status(401).json({ error: '[L-001] Gecersiz bilgiler' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      custom_id: user.custom_id,
      role: user.role || 'user' // Include role in session
    };
    return res.json({ user: req.session.user });
  } catch (err) {
    logger.error('Login error', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: `[S-001] Sunucu hatasi: ${err.message}` });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Oturum yok' });
  }
  return res.json({ user: req.session.user });
});

// ============================================
// RBAC (Role-Based Access Control)
// ============================================

// RBAC Error Codes
const RBAC_ERRORS = {
  UNAUTHORIZED: '[A-001] Yetkisiz erişim',
  ADMIN_ONLY: '[A-002] Bu işlem sadece admin kullanıcılar için',
  INVALID_ROLE: '[A-003] Geçersiz kullanıcı rolü'
};

// Enhanced adminOnly middleware
function adminOnly(req, res, next) {
  if (!req.session?.user) {
    logger.warn('Unauthorized access attempt - No session', { endpoint: req.path });
    return res.status(401).json({
      error: RBAC_ERRORS.UNAUTHORIZED,
      code: 'A-001'
    });
  }

  if (req.session.user.role !== 'admin') {
    logger.warn('Non-admin user attempted admin action', {
      username: req.session.user.username,
      userId: req.session.user.id,
      method: req.method,
      path: req.path
    });
    return res.status(403).json({
      error: RBAC_ERRORS.ADMIN_ONLY,
      code: 'A-002'
    });
  }

  logger.info('Admin user accessing endpoint', {
    username: req.session.user.username,
    method: req.method,
    path: req.path
  });
  next();
}

// Role validation helper
function hasRole(user, requiredRole) {
  return user && user.role === requiredRole;
}

// Export router and RBAC utilities
module.exports = router;
module.exports.adminOnly = adminOnly;
module.exports.hasRole = hasRole;
module.exports.RBAC_ERRORS = RBAC_ERRORS;
