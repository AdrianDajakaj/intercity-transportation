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
    console.log('SESSION:', req.session);
    console.log('BOOKING BODY:', req.body);
    const passenger = req.session.passenger;
    if (!passenger || !passenger.passenger_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const passenger_id = passenger.passenger_id;
    const { trip_id, start_line_stop_id, end_line_stop_id, discount_id } = req.body;
    if (!trip_id || !start_line_stop_id || !end_line_stop_id) {
      return res.status(400).json({ error: 'Missing booking data' });
    }
    const trip = await tripModel.getById(db, trip_id);
    if (!trip) return res.status(400).json({ error: 'Trip not found' });
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    const tripDateStr = trip.trip_date instanceof Date
      ? trip.trip_date.toISOString().split('T')[0]
      : String(trip.trip_date);
    
    const tripStops = await tripModel.getTripStops(db, trip_id);
    const startStop = tripStops.find(s => String(s.line_stop_id) === String(start_line_stop_id));
    
    if (!startStop) {
      return res.status(400).json({ error: 'Start stop not found in trip' });
    }
    
    if (tripDateStr === today && startStop.departure_time <= currentTime) {
      return res.status(400).json({ error: 'Cannot book past departures. This trip has already departed.' });
    }
    
    const bus = await busModel.getById(db, trip.bus_id);
    if (!bus) return res.status(400).json({ error: 'Bus not found' });
    const allBookings = await Booking.getAllForTrip(trip_id);
    const seatsUpper = bus.seats_upper || 0;
    const seatsLower = bus.seats_lower || 0;
    const taken = { upper: new Set(), lower: new Set() };
    allBookings.forEach(b => {
      if (
        (b.start_line_stop_id <= end_line_stop_id && b.end_line_stop_id > start_line_stop_id) ||
        (b.start_line_stop_id < end_line_stop_id && b.end_line_stop_id >= start_line_stop_id)
      ) {
        taken[b.deck].add(b.seat_number);
      }
    });
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
    const chosen = available[Math.floor(Math.random() * available.length)];
    console.log('CHOSEN SEAT/DECK:', chosen);
    const fareResult = await fareModel.getTotalPrice(trip.line_id, start_line_stop_id, end_line_stop_id);
    if (!fareResult || fareResult.total_price == null) {
      return res.status(400).json({ error: 'Could not calculate fare for this route' });
    }
    let base_price = fareResult.total_price;
    let appliedDiscountId = null;
    if (discount_id !== undefined && discount_id !== null && discount_id !== '' && discount_id !== 'null' && discount_id !== 0 && discount_id !== '0') {
      const discount = await discountModel.getById(db, discount_id);
      if (discount && discount.percent_off > 0) {
        base_price = Number((base_price * (1 - discount.percent_off / 100)).toFixed(2));
        appliedDiscountId = discount.discount_id;
      }
    }
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

exports.getAllForPassenger = async (req, res) => {
  try {
    const passenger_id = req.params.passengerId;
    const bookings = await Booking.getAllForPassenger(passenger_id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllForTrip = async (req, res) => {
  try {
    const trip_id = req.params.tripId;
    const bookings = await Booking.getAllForTrip(trip_id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadTicket = async (req, res) => {
  const bookingId = req.params.id;
  try {
    const reservation = await Booking.getReservationCardData(db, bookingId);
    if (!reservation) return res.status(404).json({ error: 'Booking not found' });
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tempPath = path.join(tmpDir, `ticket_${bookingId}_${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const fileStream = fs.createWriteStream(tempPath);
    doc.pipe(fileStream);
    const fontPath = path.join(__dirname, '../public/fonts/DejaVuSans.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      console.warn('Brak pliku czcionki DejaVuSans.ttf w public/fonts! PDF będzie bez polskich znaków.');
    }

    const margin = 50;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 2 * margin;
    
    const frameHeight = 380;
    doc.rect(margin, margin, contentWidth, frameHeight).stroke();
    
    let currentY = margin + 15;
    
    doc.fontSize(22).text('INTERCITY BUS', margin + 15, currentY);
    doc.fontSize(14).text(`Bilet nr. ${reservation.booking_id.toString().padStart(8, '0')}`, margin + contentWidth - 150, currentY);
    
    currentY += 35;
    
    doc.moveTo(margin + 15, currentY).lineTo(margin + contentWidth - 15, currentY).stroke();
    
    currentY += 25;
    
    doc.fontSize(12);
    doc.text('Z: ' + reservation.start_stop_name, margin + 15, currentY);
    
    currentY += 22;
    doc.text('Do: ' + reservation.end_stop_name, margin + 15, currentY);
    
    currentY += 40;
    
    let tripDate = reservation.trip_date;
    if (tripDate && tripDate.length === 10 && tripDate.includes('-')) {
      const d = tripDate.split('-');
      tripDate = d[2] + '.' + d[1] + '.' + d[0];
    }
    const dayName = new Date(reservation.trip_date).toLocaleDateString('pl-PL', { weekday: 'long' });
    
    doc.fontSize(13);
    doc.text('Termin odjazdu: ', margin + 15, currentY, { continued: true });
    
    const dateTimeText = `${tripDate} (${dayName}) - godz.: ${reservation.start_departure_time || '--:--'}`;
    doc.text(dateTimeText, { continued: false });
    doc.text(dateTimeText, margin + 15 + doc.widthOfString('Termin odjazdu: ') + 0.3, currentY);
    
    currentY += 35;
    
    doc.fontSize(12);
    
    doc.text('Imię: ', margin + 15, currentY, { continued: true });
    doc.text(reservation.passenger_name, { continued: false });
    doc.text(reservation.passenger_name, margin + 15 + doc.widthOfString('Imię: ') + 0.3, currentY);
    
    currentY += 20;
    
    doc.text('Nazwisko: ', margin + 15, currentY, { continued: true });
    doc.text(reservation.passenger_surname, { continued: false });
    doc.text(reservation.passenger_surname, margin + 15 + doc.widthOfString('Nazwisko: ') + 0.3, currentY);
    
    currentY += 20;
    
    doc.text('E-Mail: ', margin + 15, currentY, { continued: true });
    doc.text(reservation.email, { continued: false });
    doc.text(reservation.email, margin + 15 + doc.widthOfString('E-Mail: ') + 0.3, currentY);
    
    currentY += 20;
    
    let znizka = 'NORMALNY';
    if (reservation.discount_code) {
      znizka = reservation.discount_description || reservation.discount_code;
      if (reservation.percent_off > 0) znizka += ` (-${reservation.percent_off}%)`;
    }
    doc.text('Uwagi: ', margin + 15, currentY, { continued: true });
    doc.text(znizka, { continued: false });
    doc.text(znizka, margin + 15 + doc.widthOfString('Uwagi: ') + 0.3, currentY);
    
    const rightColumnX = margin + contentWidth - 180;
    const rightStartY = currentY - 60;
    doc.fontSize(11);
    doc.text('INTERCITY TRANSPORT', rightColumnX, rightStartY);
    doc.text('SPÓŁKA TRANSPORTOWA', rightColumnX, rightStartY + 16);
    doc.text('ul. Przykładowa 123', rightColumnX, rightStartY + 32);
    doc.text('NIP: 1234567890', rightColumnX, rightStartY + 48);
    
    currentY += 30;
    
    doc.fontSize(14);
    
    const seatText = `${reservation.seat_number} (${reservation.deck === 'upper' ? 'górny pokład' : 'dolny pokład'})`;
    doc.text('Miejsce: ', margin + 15, currentY, { continued: true });
    doc.text(seatText, { continued: false });
    doc.text(seatText, margin + 15 + doc.widthOfString('Miejsce: ') + 0.3, currentY);
    
    if (reservation.final_price > 0) {
      const priceText = `${reservation.final_price.toFixed(2)} zł`;
      doc.text('Zapłacono: ', margin + 320, currentY, { continued: true });
      doc.text(priceText, { continued: false });
      doc.text(priceText, margin + 320 + doc.widthOfString('Zapłacono: ') + 0.3, currentY);
    } else {
      const priceText = 'Nie ustalono';
      doc.text('Zapłacono: ', margin + 320, currentY, { continued: true });
      doc.text(priceText, { continued: false });
      doc.text(priceText, margin + 320 + doc.widthOfString('Zapłacono: ') + 0.3, currentY);
    }
    
    currentY += 30;
    
    let created = '-';
    if (reservation.created_at) {
      try {
        const dt = new Date(reservation.created_at);
        created = dt.toISOString().split('T')[0];
      } catch {}
    }
    doc.fontSize(11);
    doc.text('Data sprzedaży: ', margin + 15, currentY, { continued: true });
    doc.text(created, { continued: false });
    doc.text(created, margin + 15 + doc.widthOfString('Data sprzedaży: ') + 0.3, currentY);
    
    currentY += 25;
    
    doc.fontSize(9);
    doc.text('Bilet ważny tylko na trasie i w dniu określonym w bilecie.', margin + 15, currentY);
    doc.text('Bilet należy okazać kontrolerowi na żądanie.', margin + 15, currentY + 12);
    doc.text(`Linia: ${reservation.line_name}`, margin + 15, currentY + 28);
    
    console.log('PDF: przed doc.end()');
    doc.end();
    fileStream.on('finish', () => {
      console.log('PDF: fileStream finish');
      res.download(tempPath, `bilet_${bookingId}.pdf`, err => {
        fs.unlink(tempPath, () => {});
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
