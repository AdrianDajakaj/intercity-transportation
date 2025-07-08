const express = require('express');
const path = require('path');
require('dotenv').config();
const apiRouter = require('./routes/api');
const db = require('./config/db');
const addressModel = require('./models/addressModel');
const passengerModel = require('./models/passengerModel');
const busModel = require('./models/busModel');
const busStopModel = require('./models/busStopModel');
const lineModel = require('./models/lineModel');
const lineStopModel = require('./models/lineStopModel');
const timetableModel = require('./models/timetableModel');
const tripModel = require('./models/tripModel'); 
const discountModel = require('./models/discountModel'); 
const fareModel = require('./models/fareModel'); 
const bookingModel = require('./models/bookingModel'); 
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const lineScheduleController = require('./controllers/lineScheduleController');
const addressService = require('./services/addressService');
const busStopService = require('./services/busStopService');
const busService = require('./services/busService');
const lineService = require('./services/lineService');
const lineStopService = require('./services/lineStopService');
const timetableService = require('./services/timetableService');
const fareService = require('./services/fareService');
const discountService = require('./services/discountService');
const tripService = require('./services/tripService');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/';

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: false
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

app.use((req, res, next) => {
  res.locals.passenger = req.session.passenger || null;
  res.locals.basePath = BASE_PATH.endsWith('/') ? BASE_PATH : BASE_PATH + '/';
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); 
app.set('layout', 'layouts/main');

app.use('/api', apiRouter);

app.get('/', async (req, res) => {
  const lines = await lineModel.getAll(db);
  res.render('index', { basePath: BASE_PATH, lines });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.get('/timetable', async (req, res) => {
  console.log('=== TIMETABLE ROUTE HIT ===');
  console.log('TIMETABLE QUERY:', req.query);
  const { line_code_direction, departure_from, departure_to, departure_date, ticket_type } = req.query;
  if (!line_code_direction || !departure_from || !departure_to || !departure_date) {
    console.log('Missing required query params');
    return res.render('timetable', { departures: [], passenger: req.session.passenger || null, departure_date: null });
  }
  
  try {
  const [line_code, direction] = line_code_direction.split('_');
  const lines = await lineModel.getAll(db);
  const line = lines.find(l => l.line_code === line_code && String(l.direction) === direction);
  console.log('Found line:', line);
  if (!line) {
    console.log('Line not found');
    return res.render('timetable', { departures: [], passenger: req.session.passenger || null, departure_date });
  }
  const trips = await tripModel.getAll(db);
  const tripsForDay = trips.filter(trip => {
    let tripDateStr = trip.trip_date instanceof Date
      ? trip.trip_date.toISOString().slice(0, 10)
      : String(trip.trip_date);
    return trip.line_id === line.line_id && tripDateStr === departure_date;
  });
  console.log('Trips for day:', tripsForDay);
  let price = null;
  if (tripsForDay.length > 0) {
    const fareModel = require('./models/fareModel');
    const discountModel = require('./models/discountModel');
    const fare = await fareModel.getTotalPrice(line.line_id, departure_from, departure_to);
    let basePrice = fare && fare.total_price !== null ? fare.total_price : null;
    if (basePrice !== null && ticket_type === 'ulgowy') {
      const studentDiscount = await discountModel.getById(db, 1);
      if (studentDiscount && studentDiscount.percent_off) {
        price = (basePrice * (1 - studentDiscount.percent_off / 100)).toFixed(2);
      } else {
        price = basePrice;
      }
    } else {
      price = basePrice;
    }
  }
  let departures = [];
  const today = new Date().toISOString().split('T')[0];
  const isToday = departure_date === today;
  const currentTime = new Date().toTimeString().slice(0, 5);
  
  for (const trip of tripsForDay) {
    const stops = await tripModel.getTripStops(db, trip.trip_id);
    console.log('Trip', trip.trip_id, 'stops:', stops);
    const depIdx = stops.findIndex(s => String(s.line_stop_id) === String(departure_from));
    const arrIdx = stops.findIndex(s => String(s.line_stop_id) === String(departure_to));
    console.log('depIdx:', depIdx, 'arrIdx:', arrIdx);
    if (depIdx === -1 || arrIdx === -1 || arrIdx <= depIdx) {
      console.log('Skipping trip', trip.trip_id, 'because stops not found or arrIdx <= depIdx');
      continue;
    }
    
    const departureTime = stops[depIdx].departure_time;
    
    if (isToday && departureTime <= currentTime) {
      console.log('Skipping trip', trip.trip_id, 'because departure time', departureTime, 'has already passed (current time:', currentTime, ')');
      continue;
    }
    
    departures.push({
      trip_id: trip.trip_id,
      departure_time: departureTime,
      departure_stop: stops[depIdx].stop_name,
      arrival_time: stops[arrIdx].departure_time,
      arrival_stop: stops[arrIdx].stop_name,
      price,
      start_line_stop_id: stops[depIdx].line_stop_id,
      end_line_stop_id: stops[arrIdx].line_stop_id,
      discount_id: ticket_type === 'ulgowy' ? 1 : 0
    });
  }
  if (departures.length === 0) {
    console.log('No departures found for these params');
  }
  console.log('DEPARTURES SENT TO EJS:', departures);
  res.render('timetable', { departures, passenger: req.session.passenger || null, departure_date });
  
  } catch (error) {
    console.error('Error in timetable route:', error);
    res.render('timetable', { departures: [], passenger: req.session.passenger || null, departure_date: null });
  }
});

app.get('/line-schedules', lineScheduleController.showAllLineSchedules);

app.get('/reservations', async (req, res) => {
  if (!req.session.passenger || !req.session.passenger.passenger_id) {
    return res.redirect('/login');
  }

  try {
    const passengerId = req.session.passenger.passenger_id;
    if (!passengerId) {
      throw new Error('Brak passenger_id w sesji.');
    }

    const sql = `
      SELECT 
        b.booking_id,
        b.trip_id,
        b.seat_number,
        b.deck,
        b.status,
        b.created_at,
        t.trip_date,
        l.line_name,
        start_stop.stop_name AS start_stop_name,
        end_stop.stop_name AS end_stop_name,
        start_stop.is_hub AS start_is_hub,
        end_stop.is_hub AS end_is_hub,
        start_tt.departure_time AS start_departure_time,
        end_tt.departure_time AS end_departure_time,
        d.discount_code,
        d.discount_description,
        d.percent_off,
        b.base_price
      FROM booking b
      JOIN trip t ON b.trip_id = t.trip_id
      JOIN line l ON t.line_id = l.line_id
      JOIN line_stop start_ls ON b.start_line_stop_id = start_ls.line_stop_id
      JOIN bus_stop start_stop ON start_ls.stop_id = start_stop.stop_id
      JOIN line_stop end_ls ON b.end_line_stop_id = end_ls.line_stop_id
      JOIN bus_stop end_stop ON end_ls.stop_id = end_stop.stop_id
      LEFT JOIN discount d ON b.discount_id = d.discount_id
      LEFT JOIN fare f ON (
        f.line_id = l.line_id AND
        f.start_line_stop_id = b.start_line_stop_id AND
        f.end_line_stop_id = b.end_line_stop_id
      )
      LEFT JOIN timetable start_tt ON start_tt.line_stop_id = start_ls.line_stop_id AND start_tt.run_number = t.run_number
      LEFT JOIN timetable end_tt ON end_tt.line_stop_id = end_ls.line_stop_id AND end_tt.run_number = t.run_number
      WHERE b.passenger_id = ?
      ORDER BY t.trip_date ASC, start_tt.departure_time ASC
    `;

    const [reservations] = await db.query(sql, [passengerId]);

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    const currentReservations = [];
    const archivedReservations = [];

    reservations.forEach(reservation => {
      if (reservation.trip_date instanceof Date) {
        reservation.trip_date = reservation.trip_date.toISOString().split('T')[0];
      }
      if (reservation.base_price) {
        const discount = reservation.percent_off || 0;
        const discountAmount = (reservation.base_price * discount) / 100;
        reservation.final_price = reservation.base_price - discountAmount;
      } else {
        reservation.final_price = 0;
      }
      reservation.color_hex = '#003366';
      
      const reservationDate = reservation.trip_date;
      const departureTime = reservation.start_departure_time || '00:00';
      
      if (reservationDate > today || (reservationDate === today && departureTime > currentTime)) {
        currentReservations.push(reservation);
      } else {
        archivedReservations.push(reservation);
      }
    });

    res.render('reservations', { 
      currentReservations,
      archivedReservations,
      passenger: req.session.passenger 
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.render('reservations', { 
      currentReservations: [], 
      archivedReservations: [],
      passenger: req.session.passenger,
      error: 'Wystąpił błąd podczas pobierania rezerwacji. Szczegóły: ' + error.message
    });
  }
});

(async () => {
  try {
    await addressModel.createTable(db);
    await passengerModel.createTable(db);
    await busModel.createTable(db);
    await busStopModel.createTable(db);
    await lineModel.createTable(db);
    await lineStopModel.createTable(db);
    await timetableModel.createTable(db);
    await tripModel.createTable(db);
    await discountModel.createTable(db);
    await fareModel.createTable(db);
    await bookingModel.createTable(db);

    await addressService.initializeAddresses(db);
    await busStopService.initializeBusStops(db);
    await busService.initializeBuses(db);
    await lineService.initializeLines(db);
    await lineStopService.initializeLineStops(db);
    await timetableService.initializeTimetables(db);
    await fareService.initializeFares(db);
    await discountService.initializeDiscounts(db);
    await tripService.initializeTrips(db);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}, base path: ${BASE_PATH}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
