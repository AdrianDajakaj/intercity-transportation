const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const passengerController = require('../controllers/passengerController');
const busController = require('../controllers/busController');
const busStopController = require('../controllers/busStopController');
const lineController = require('../controllers/lineController');
const lineStopController = require('../controllers/lineStopController');
const timetableController = require('../controllers/timetableController');
const tripController = require('../controllers/tripController');
const discountController = require('../controllers/discountController');
const fareController = require('../controllers/fareController');
const bookingController = require('../controllers/bookingController');

// Add logging middleware for API routes only
router.use((req, res, next) => {
  console.log(`API: ${req.method} ${req.path}`);
  next();
});

router.post('/addresses', addressController.create);
router.get('/addresses', addressController.getAll);
router.get('/addresses/:id', addressController.getById);
router.put('/addresses/:id', addressController.update);
router.delete('/addresses/:id', addressController.delete);

router.post('/passengers', passengerController.create);
router.get('/passengers', passengerController.getAll);
router.get('/passengers/:id', passengerController.getById);
router.put('/passengers/:id', passengerController.update);
router.delete('/passengers/:id', passengerController.delete);
router.get('/passengers/:id/address', passengerController.getAddress);
router.put('/passengers/:id/address', passengerController.updateAddress);
router.post('/passengers/login', passengerController.login);
router.post('/passengers/logout', passengerController.logout);

router.post('/buses', busController.create);
router.get('/buses', busController.getAll);
router.get('/buses/:id', busController.getById);
router.put('/buses/:id', busController.update);
router.delete('/buses/:id', busController.delete);

router.post('/bus-stops', busStopController.create);
router.get('/bus-stops', busStopController.getAll);
router.get('/bus-stops/:id', busStopController.getById);
router.put('/bus-stops/:id', busStopController.update);
router.delete('/bus-stops/:id', busStopController.delete);
router.get('/bus-stops/:id/address', busStopController.getAddress);
router.put('/bus-stops/:id/address', busStopController.updateAddress);

router.post('/lines', lineController.create);
router.get('/lines', lineController.getAll);
router.get('/lines/:id', lineController.getById);
router.put('/lines/:id', lineController.update);
router.delete('/lines/:id', lineController.delete);
router.get('/lines/:line_code/:direction/stops', lineController.getStopsForLineCodeAndDirection);
router.get('/lines/:line_code/:direction/timetable', lineController.getTimetableForLineCodeAndDirection);

router.post('/line-stops', lineStopController.create);
router.get('/line-stops', lineStopController.getAll);
router.get('/line-stops/:id', lineStopController.getById);
router.put('/line-stops/:id', lineStopController.update);
router.delete('/line-stops/:id', lineStopController.delete);
router.get('/line-stops/:id/line', lineStopController.getLine);
router.get('/line-stops/:id/bus-stop', lineStopController.getBusStop);
router.get('/line-stops/:id/line-bus-stop', lineStopController.getLineAndBusStop);
router.get('/line-stops', async (req, res) => {
    const db = require('../config/db');
    const lineStopModel = require('../models/lineStopModel');
    const busStopModel = require('../models/busStopModel');
    const line_id = req.query.line_id;
    if (!line_id) return res.status(400).json({ error: 'Missing line_id' });
    const stops = await lineStopModel.getAllByLineIdWithStopName(db, line_id);
    res.json(stops);
});

router.post('/timetables', timetableController.create);
router.get('/timetables', timetableController.getAll);
router.get('/timetables/:id', timetableController.getById);
router.put('/timetables/:id', timetableController.update);
router.delete('/timetables/:id', timetableController.delete);
router.get('/timetables/:id/line-bus-stop', timetableController.getLineAndBusStop);

router.post('/trips', tripController.create);
router.get('/trips', tripController.getAll);
router.get('/trips/:id', tripController.getById);
router.put('/trips/:id', tripController.update);
router.delete('/trips/:id', tripController.delete);
router.get('/trips/:id/line', tripController.getLine);
router.get('/trips/:id/bus', tripController.getBus);
router.get('/trips/:id/stops', tripController.getTripStops);

router.post('/discounts', discountController.create);
router.get('/discounts', discountController.getAll);
router.get('/discounts/:id', discountController.getById);
router.put('/discounts/:id', discountController.update);
router.delete('/discounts/:id', discountController.delete);

router.post('/fares', fareController.create);
router.get('/fares', fareController.getAll);
router.get('/fares/:id', fareController.getById);
router.put('/fares/:id', fareController.update);
router.delete('/fares/:id', fareController.delete);
router.get('/fares/total-price/:line_id', fareController.getTotalPrice);
router.get('/fares/:id/line', fareController.getLine);
router.get('/fares/:id/start-line-stop', fareController.getStartLineStop);
router.get('/fares/:id/end-line-stop', fareController.getEndLineStop);

router.post('/bookings', bookingController.create);
router.get('/bookings', bookingController.getAll);
router.get('/bookings/:id', bookingController.getById);
router.put('/bookings/:id', bookingController.update);
router.delete('/bookings/:id', bookingController.delete);
router.get('/bookings/:id/passenger', bookingController.getPassenger);
router.get('/bookings/:id/start-line-stop', bookingController.getStartLineStop);
router.get('/bookings/:id/end-line-stop', bookingController.getEndLineStop);
router.get('/passengers/:passengerId/bookings', bookingController.getAllForPassenger);
router.get('/trips/:tripId/bookings', bookingController.getAllForTrip);
router.get('/bookings/:id/ticket', bookingController.downloadTicket);

module.exports = router;
