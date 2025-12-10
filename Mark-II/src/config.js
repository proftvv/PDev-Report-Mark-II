// v0.0.2
const path = require('path');
require('dotenv').config();

function env(key, fallback) {
  return process.env[key] || fallback;
}

const config = {
  port: Number(env('APP_PORT', 3000)),
  host: env('APP_HOST', '0.0.0.0'),
  sessionSecret: env('SESSION_SECRET', 'change-me'),
  storageRoot: env('STORAGE_ROOT', 'Z:\\\\Report-Mark-II\\\\raporlar'),
  adminIps: env('ADMIN_IPS', '127.0.0.1,::1')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean),
  docPrefix: env('DOC_PREFIX', 'P'),
  db: {
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT', 3306)),
    user: env('DB_USER', 'root'),
    password: env('DB_PASSWORD', ''),
    database: env('DB_NAME', 'report_mark2')
  }
};

config.paths = {
  templates: path.join(config.storageRoot, 'templates'),
  generated: path.join(config.storageRoot, 'generated'),
  uploads: path.join(config.storageRoot, 'uploads')
};

module.exports = config;

