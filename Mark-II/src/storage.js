// v0.0.2
const fs = require('fs');
const path = require('path');
const config = require('./config');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
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

