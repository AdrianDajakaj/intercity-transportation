const Booking = require('../models/bookingModel');

exports.create = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const bookings = await Booking.getAll();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const booking = await Booking.getById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const booking = await Booking.update(req.params.id, req.body);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Booking.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get passenger for a specific booking
exports.getPassenger = async (req, res) => {
  try {
    const booking_id = req.params.id;
    const passenger = await Booking.getPassengerForBooking(booking_id);
    if (!passenger) return res.status(404).json({ error: 'Passenger not found for this booking' });
    res.json(passenger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get start line stop for a specific booking
exports.getStartLineStop = async (req, res) => {
  try {
    const booking_id = req.params.id;
    const stop = await Booking.getStartLineStopForBooking(booking_id);
    if (!stop) return res.status(404).json({ error: 'Start line stop not found for this booking' });
    res.json(stop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get end line stop for a specific booking
exports.getEndLineStop = async (req, res) => {
  try {
    const booking_id = req.params.id;
    const stop = await Booking.getEndLineStopForBooking(booking_id);
    if (!stop) return res.status(404).json({ error: 'End line stop not found for this booking' });
    res.json(stop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all bookings for a specific passenger
exports.getAllForPassenger = async (req, res) => {
  try {
    const passenger_id = req.params.passengerId;
    const bookings = await Booking.getAllForPassenger(passenger_id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all bookings for a specific trip
exports.getAllForTrip = async (req, res) => {
  try {
    const trip_id = req.params.tripId;
    const bookings = await Booking.getAllForTrip(trip_id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
