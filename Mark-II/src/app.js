// v0.0.1
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const { setupStorage } = require('./storage');
const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const reportRoutes = require('./routes/reports');

setupStorage();

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // HTTP over LAN
  })
);

app.get('/', (_req, res) => res.json({ status: 'ok', storage: config.storageRoot }));
app.use('/auth', authRoutes);
app.use('/templates', templateRoutes);
app.use('/reports', reportRoutes);

// Static file serving - templates ve generated dosyalari
app.use('/files/templates', express.static(path.join(config.storageRoot, 'templates')));
app.use('/files/generated', express.static(path.join(config.storageRoot, 'generated')));
app.use('/files', express.static(config.storageRoot));

const port = config.port;
const server = app.listen(port, config.host, () => {
  console.log(`Server running on http://${config.host}:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nHATA: Port ${port} zaten kullaniliyor!`);
    console.error(`Lutfen eski servisi kapatin veya .env dosyasinda APP_PORT degistirin.\n`);
    process.exit(1);
  } else {
    console.error('Server hatasi:', err);
    process.exit(1);
  }
});

