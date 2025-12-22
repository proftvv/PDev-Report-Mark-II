const fs = require('fs');
const path = require('path');
const config = require('./config');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
      // On Vercel, /tmp is the only writable location
      if (err.code === 'EROFS' && !dirPath.startsWith('/tmp')) {
        console.warn(`Cannot create directory ${dirPath} on read-only filesystem. Using /tmp instead.`);
      } else if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }
}

function setupStorage() {
  ensureDir(config.storageRoot);
  ensureDir(config.paths.templates);
  ensureDir(config.paths.generated);
  ensureDir(config.paths.uploads);
}

function buildTemplatePath(filename) {
  return path.join(config.paths.templates, filename);
}

function buildGeneratedPath(filename) {
  return path.join(config.paths.generated, filename);
}

module.exports = {
  setupStorage,
  buildTemplatePath,
  buildGeneratedPath
};

