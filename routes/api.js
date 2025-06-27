// API routes
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const passengerController = require('../controllers/passengerController');
const busController = require('../controllers/busController');
const busStopController = require('../controllers/busStopController');
const lineController = require('../controllers/lineController');
const lineStopController = require('../controllers/lineStopController');

// Address CRUD routes
router.post('/addresses', addressController.create);
router.get('/addresses', addressController.getAll);
router.get('/addresses/:id', addressController.getById);
router.put('/addresses/:id', addressController.update);
router.delete('/addresses/:id', addressController.delete);

// Passenger CRUD routes
router.post('/passengers', passengerController.create);
router.get('/passengers', passengerController.getAll);
router.get('/passengers/:id', passengerController.getById);
router.put('/passengers/:id', passengerController.update);
router.delete('/passengers/:id', passengerController.delete);
// Get address for a specific passenger
router.get('/passengers/:id/address', passengerController.getAddress);
// Update address for a specific passenger
router.put('/passengers/:id/address', passengerController.updateAddress);

// Bus CRUD routes
router.post('/buses', busController.create);
router.get('/buses', busController.getAll);
router.get('/buses/:id', busController.getById);
router.put('/buses/:id', busController.update);
router.delete('/buses/:id', busController.delete);

// BusStop CRUD routes
router.post('/bus-stops', busStopController.create);
router.get('/bus-stops', busStopController.getAll);
router.get('/bus-stops/:id', busStopController.getById);
router.put('/bus-stops/:id', busStopController.update);
router.delete('/bus-stops/:id', busStopController.delete);
// Get address for a specific bus stop
router.get('/bus-stops/:id/address', busStopController.getAddress);
// Update address for a specific bus stop
router.put('/bus-stops/:id/address', busStopController.updateAddress);

// Line CRUD routes
router.post('/lines', lineController.create);
router.get('/lines', lineController.getAll);
router.get('/lines/:id', lineController.getById);
router.put('/lines/:id', lineController.update);
router.delete('/lines/:id', lineController.delete);

// LineStop CRUD routes
router.post('/line-stops', lineStopController.create);
router.get('/line-stops', lineStopController.getAll);
router.get('/line-stops/:id', lineStopController.getById);
router.put('/line-stops/:id', lineStopController.update);
router.delete('/line-stops/:id', lineStopController.delete);
// Get line for a specific line stop
router.get('/line-stops/:id/line', lineStopController.getLine);
// Get bus stop for a specific line stop
router.get('/line-stops/:id/bus-stop', lineStopController.getBusStop);

module.exports = router;
