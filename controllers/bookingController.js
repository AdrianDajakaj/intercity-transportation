const Booking = require('../models/bookingModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// Download PDF ticket for a booking
exports.downloadTicket = async (req, res) => {
  const bookingId = req.params.id;
  try {
    // 1. Get booking, passenger, trip, fare, discount info
    const booking = await require('../models/bookingModel').getById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const passenger = await require('../models/passengerModel').getById(booking.passenger_id);
    const trip = await require('../models/tripModel').getById(booking.trip_id);
    const line = await require('../models/lineModel').getById(trip.line_id);
    const startLineStop = await require('../models/lineStopModel').getById(booking.start_line_stop_id);
    const endLineStop = await require('../models/lineStopModel').getById(booking.end_line_stop_id);
    const startBusStop = await require('../models/busStopModel').getById(startLineStop.bus_stop_id);
    const endBusStop = await require('../models/busStopModel').getById(endLineStop.bus_stop_id);
    const discount = booking.discount_id ? await require('../models/discountModel').getById(booking.discount_id) : null;
    // Get total price (with discount)
    const fareResult = await require('../models/fareModel').getTotalPrice(line.line_id, booking.start_line_stop_id, booking.end_line_stop_id);
    let price = fareResult.total_price;
    let discountInfo = 'BRAK';
    if (discount) {
      price = price * (1 - discount.percentage / 100);
      discountInfo = discount.discount_type;
    }
    // 2. Generate PDF
    const doc = new PDFDocument();
    const tempPath = path.join(__dirname, `../../tmp/ticket_${bookingId}_${Date.now()}.pdf`);
    doc.pipe(fs.createWriteStream(tempPath));
    doc.fontSize(18).text('Bilet Intercity', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Imię i nazwisko: ${passenger.first_name} ${passenger.last_name}`);
    doc.text(`Przystanek początkowy: ${startBusStop.stop_name}`);
    doc.text(`Przystanek końcowy: ${endBusStop.stop_name}`);
    doc.text(`Data odjazdu: ${trip.departure_date}`);
    doc.text(`Godzina odjazdu: ${trip.departure_time}`);
    doc.text(`Cena: ${price.toFixed(2)} PLN`);
    doc.text(`Zniżka: ${discount ? discount.percentage + '%' : 'Brak'}`);
    doc.text(`Typ zniżki: ${discountInfo}`);
    doc.end();
    // 3. Wait for PDF to finish, then send as download
    doc.on('finish', () => {
      res.download(tempPath, `bilet_${bookingId}.pdf`, err => {
        fs.unlink(tempPath, () => {}); // Delete temp file after sending
        if (err) res.status(500).json({ error: 'File download error' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
