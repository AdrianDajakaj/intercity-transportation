const Booking = require('../models/bookingModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const tripModel = require('../models/tripModel');
const busModel = require('../models/busModel');
const fareModel = require('../models/fareModel');
const discountModel = require('../models/discountModel');

exports.create = async (req, res) => {
  try {
    // Debug: log session and body
    console.log('SESSION:', req.session);
    console.log('BOOKING BODY:', req.body);
    // Get passenger_id from session
    const passenger = req.session.passenger;
    if (!passenger || !passenger.passenger_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const passenger_id = passenger.passenger_id;
    const { trip_id, start_line_stop_id, end_line_stop_id, discount_id } = req.body;
    if (!trip_id || !start_line_stop_id || !end_line_stop_id) {
      return res.status(400).json({ error: 'Missing booking data' });
    }
    // Get trip and bus info
    const trip = await tripModel.getById(db, trip_id);
    if (!trip) return res.status(400).json({ error: 'Trip not found' });
    const bus = await busModel.getById(db, trip.bus_id);
    if (!bus) return res.status(400).json({ error: 'Bus not found' });
    // Get all bookings for this trip
    const allBookings = await Booking.getAllForTrip(trip_id);
    // Build seat map
    const seatsUpper = bus.seats_upper || 0;
    const seatsLower = bus.seats_lower || 0;
    const taken = { upper: new Set(), lower: new Set() };
    allBookings.forEach(b => {
      // Check for overlap in segment
      if (
        (b.start_line_stop_id <= end_line_stop_id && b.end_line_stop_id > start_line_stop_id) ||
        (b.start_line_stop_id < end_line_stop_id && b.end_line_stop_id >= start_line_stop_id)
      ) {
        taken[b.deck].add(b.seat_number);
      }
    });
    // Find available seats
    let available = [];
    if (seatsUpper > 0) {
      for (let i = 1; i <= seatsUpper; i++) {
        if (!taken.upper.has(i)) available.push({ seat: i, deck: 'upper' });
      }
    }
    if (seatsLower > 0) {
      for (let i = 1; i <= seatsLower; i++) {
        if (!taken.lower.has(i)) available.push({ seat: i, deck: 'lower' });
      }
    }
    if (available.length === 0) {
      return res.status(409).json({ error: 'No available seats' });
    }
    // Pick random seat
    const chosen = available[Math.floor(Math.random() * available.length)];
    // Debug: log chosen seat/deck
    console.log('CHOSEN SEAT/DECK:', chosen);
    // Calculate base price
    const fareResult = await fareModel.getTotalPrice(trip.line_id, start_line_stop_id, end_line_stop_id);
    if (!fareResult || fareResult.total_price == null) {
      return res.status(400).json({ error: 'Could not calculate fare for this route' });
    }
    let base_price = fareResult.total_price;
    let appliedDiscountId = null;
    if (discount_id !== undefined && discount_id !== null && discount_id !== '' && discount_id !== 'null' && discount_id !== 0 && discount_id !== '0') {
      // Check if discount exists
      const discount = await discountModel.getById(db, discount_id);
      if (discount && discount.percent_off > 0) {
        base_price = Number((base_price * (1 - discount.percent_off / 100)).toFixed(2));
        appliedDiscountId = discount.discount_id;
      }
    }
    // Create booking
    const booking = await Booking.create({
      passenger_id,
      trip_id,
      start_line_stop_id,
      end_line_stop_id,
      seat_number: chosen.seat,
      deck: chosen.deck,
      discount_id: appliedDiscountId,
      base_price,
      status: 'reserved'
    });
    res.status(201).json(booking);
  } catch (err) {
    // Debug: log error
    console.error('BOOKING ERROR:', err);
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
    // Pobierz dane rezerwacji dokładnie jak do /reservations
    const reservation = await Booking.getReservationCardData(db, bookingId);
    if (!reservation) return res.status(404).json({ error: 'Booking not found' });
    // Przygotuj PDF na podstawie tych danych
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');
    // Ensure tmp directory exists
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tempPath = path.join(tmpDir, `ticket_${bookingId}_${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const fileStream = fs.createWriteStream(tempPath);
    doc.pipe(fileStream);
    // Ustaw czcionkę z polskimi znakami
    const fontPath = path.join(__dirname, '../public/fonts/DejaVuSans.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      console.warn('Brak pliku czcionki DejaVuSans.ttf w public/fonts! PDF będzie bez polskich znaków.');
    }
    doc.fontSize(18).text('Bilet Intercity', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Linia: ${reservation.line_name}`);
    // Data przejazdu
    let tripDate = reservation.trip_date;
    if (tripDate && tripDate.length === 10 && tripDate.includes('-')) {
      const d = tripDate.split('-');
      tripDate = d[2] + '.' + d[1] + '.' + d[0];
    }
    doc.text(`Data przejazdu: ${tripDate || '-'}`);
    doc.moveDown(0.5);
    // Trasa
    doc.text(`Przystanek początkowy: ${reservation.start_stop_name}`);
    doc.text(`Godzina odjazdu: ${reservation.start_departure_time || '-'}`);
    doc.text(`Przystanek końcowy: ${reservation.end_stop_name}`);
    doc.text(`Godzina przyjazdu: ${reservation.end_departure_time || '-'}`);
    doc.moveDown(0.5);
    // Szczegóły
    doc.text(`Miejsce: ${reservation.seat_number} (${reservation.deck === 'upper' ? 'górny pokład' : 'dolny pokład'})`);
    // Zniżka
    let znizka = 'Brak';
    if (reservation.discount_code) {
      znizka = reservation.discount_description || reservation.discount_code;
      if (reservation.percent_off > 0) znizka += ` (-${reservation.percent_off}%)`;
    }
    doc.text(`Zniżka: ${znizka}`);
    // Cena
    if (reservation.final_price > 0) {
      doc.text(`Cena: ${reservation.final_price.toFixed(2)} zł`);
      if (reservation.percent_off > 0 && !isNaN(parseFloat(reservation.base_price))) {
        doc.text(`Cena przed zniżką: ${parseFloat(reservation.base_price).toFixed(2)} zł`);
      }
    } else {
      doc.text('Cena: Nie ustalono');
    }
    // Data rezerwacji
    let created = '-';
    if (reservation.created_at) {
      try {
        const dt = new Date(reservation.created_at);
        created = dt.toLocaleDateString('pl-PL') + ' ' + dt.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
      } catch {}
    }
    doc.text(`Zarezerwowano: ${created}`);
    doc.text(`Numer rezerwacji: ${reservation.booking_id}`);
    console.log('PDF: przed doc.end()');
    doc.end();
    fileStream.on('finish', () => {
      console.log('PDF: fileStream finish');
      res.download(tempPath, `bilet_${bookingId}.pdf`, err => {
        fs.unlink(tempPath, () => {}); // Delete temp file after sending
        if (err) {
          console.error('File download error:', err);
          if (!res.headersSent) res.status(500).json({ error: 'File download error' });
        }
      });
    });
    fileStream.on('error', (err) => {
      console.error('PDF fileStream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'PDF fileStream error' });
    });
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'PDF generation error' });
    });
  } catch (err) {
    console.error('DOWNLOAD TICKET ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};
