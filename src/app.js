// v0.0.9
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const { setupStorage } = require('./storage');
const logger = require('./services/logger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const reportRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const logsRoutes = require('./routes/logs');

setupStorage();

const app = express();
// Allow PDF previews to be embedded from the frontend dev host
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "object-src": ["'self'", "blob:", "data:", "http:", "https:"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"]
      },
    },
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // HTTP over LAN
  })
);

app.get('/', (_req, res) => res.json({ status: 'ok', storage: config.storageRoot }));

// Debug: List all registered routes
app.get('/debug/routes', (_req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source.replace(/\\/g, '').replace('/?(?=\\/|$)', '').replace('^', '');
          routes.push({
            path: path + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

app.use('/auth', authRoutes);
app.use('/templates', templateRoutes);
app.use('/reports', reportRoutes);
app.use('/users', usersRoutes);
app.use('/logs', logsRoutes);

// Static file serving - templates ve generated dosyalari
app.use('/files/templates', express.static(path.join(config.storageRoot, 'templates')));
app.use('/files/generated', express.static(path.join(config.storageRoot, 'generated')));
app.use('/files', express.static(config.storageRoot));

// Error handler (must be last)
app.use(errorHandler);

if (require.main === module) {
  const port = config.port;
  const server = app.listen(port, config.host, () => {
    logger.info('Server started successfully', { host: config.host, port: port });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error('Port already in use', { port: port });
      logger.info('Please stop the old service or change APP_PORT in .env file');
      process.exit(1);
    } else {
      logger.error('Server error', { error: err.message, stack: err.stack });
      process.exit(1);
    }
  });
}

module.exports = app;
