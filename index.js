const express = require('express');
const path = require('path');
require('dotenv').config();
const apiRouter = require('./routes/api');
const db = require('./config/db');
const addressModel = require('./models/addressModel');
const passengerModel = require('./models/passengerModel');
const busModel = require('./models/busModel');
const busStopModel = require('./models/busStopModel');
const lineModel = require('./models/lineModel'); // ✅ dodaj to
const lineStopModel = require('./models/lineStopModel'); // Ensure lineStopModel is required
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // ✅ dodaj to
app.set('layout', 'layouts/main');

// Mount API router
app.use(BASE_PATH + 'api', apiRouter);

// Home route
app.get(BASE_PATH, (req, res) => {
  res.render('index', { basePath: BASE_PATH });
});

// Ensure address, passenger, bus, bus_stop, line, and line_stop tables exist on startup
(async () => {
  try {
    await addressModel.createTable(db);
    await passengerModel.createTable(db);
    await busModel.createTable(db);
    await busStopModel.createTable(db);
    await lineModel.createTable(db);
    await lineStopModel.createTable(db); // Ensure line_stop table is created
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}, base path: ${BASE_PATH}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
