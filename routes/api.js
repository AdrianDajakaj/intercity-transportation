// API routes
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
// Get all stops for a specific line_code and direction
router.get('/lines/:line_code/:direction/stops', lineController.getStopsForLineCodeAndDirection);
// Get timetable for a specific line_code and direction
router.get('/lines/:line_code/:direction/timetable', lineController.getTimetableForLineCodeAndDirection);

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
// Get line and bus stop for a specific line stop
router.get('/line-stops/:id/line-bus-stop', lineStopController.getLineAndBusStop);

// Timetable CRUD routes
router.post('/timetables', timetableController.create);
router.get('/timetables', timetableController.getAll);
router.get('/timetables/:id', timetableController.getById);
router.put('/timetables/:id', timetableController.update);
router.delete('/timetables/:id', timetableController.delete);
// Get line and bus stop for a specific timetable entry
router.get('/timetables/:id/line-bus-stop', timetableController.getLineAndBusStop);

// Trip CRUD routes
router.post('/trips', tripController.create);
router.get('/trips', tripController.getAll);
router.get('/trips/:id', tripController.getById);
router.put('/trips/:id', tripController.update);
router.delete('/trips/:id', tripController.delete);
// Get line for a specific trip
router.get('/trips/:id/line', tripController.getLine);
// Get bus for a specific trip
router.get('/trips/:id/bus', tripController.getBus);
// Get all stops and departure times for a specific trip
router.get('/trips/:id/stops', tripController.getTripStops);

// Discount CRUD routes
router.post('/discounts', discountController.create);
router.get('/discounts', discountController.getAll);
router.get('/discounts/:id', discountController.getById);
router.put('/discounts/:id', discountController.update);
router.delete('/discounts/:id', discountController.delete);

// Fare CRUD routes
router.post('/fares', fareController.create);
router.get('/fares', fareController.getAll);
router.get('/fares/:id', fareController.getById);
router.put('/fares/:id', fareController.update);
router.delete('/fares/:id', fareController.delete);
// Get total price for a line between start and end stops
router.get('/fares/total-price', fareController.getTotalPrice);
// Get line for a specific fare
router.get('/fares/:id/line', fareController.getLine);
// Get start line stop for a specific fare
router.get('/fares/:id/start-line-stop', fareController.getStartLineStop);
// Get end line stop for a specific fare
router.get('/fares/:id/end-line-stop', fareController.getEndLineStop);

// Booking CRUD routes
router.post('/bookings', bookingController.create);
router.get('/bookings', bookingController.getAll);
router.get('/bookings/:id', bookingController.getById);
router.put('/bookings/:id', bookingController.update);
router.delete('/bookings/:id', bookingController.delete);
// Get passenger for a specific booking
router.get('/bookings/:id/passenger', bookingController.getPassenger);
// Get start line stop for a specific booking
router.get('/bookings/:id/start-line-stop', bookingController.getStartLineStop);
// Get end line stop for a specific booking
router.get('/bookings/:id/end-line-stop', bookingController.getEndLineStop);
// Get all bookings for a specific passenger
router.get('/passengers/:passengerId/bookings', bookingController.getAllForPassenger);
// Get all bookings for a specific trip
router.get('/trips/:tripId/bookings', bookingController.getAllForTrip);

module.exports = router;
