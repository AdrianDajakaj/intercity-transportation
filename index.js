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
const timetableModel = require('./models/timetableModel');
const tripModel = require('./models/tripModel'); // Ensure tripModel is required
const discountModel = require('./models/discountModel'); // Ensure discountModel is required
const fareModel = require('./models/fareModel'); // Ensure fareModel is required
const bookingModel = require('./models/bookingModel'); // Ensure bookingModel is required
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const lineScheduleController = require('./controllers/lineScheduleController');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Helper middleware to expose session passenger to all views
app.use((req, res, next) => {
  res.locals.passenger = req.session.passenger || null;
  next();
});

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // ✅ dodaj to
app.set('layout', 'layouts/main');

// Mount API router
app.use(BASE_PATH + 'api', apiRouter);

// Home route
app.get(BASE_PATH, async (req, res) => {
  // Fetch all lines for the chooser
  const lines = await lineModel.getAll(db);
  res.render('index', { basePath: BASE_PATH, lines });
});

// Login page route
app.get(BASE_PATH + 'login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Registration page route
app.get(BASE_PATH + 'register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// Timetable search result page
app.get(BASE_PATH + 'timetable', async (req, res) => {
  console.log('=== TIMETABLE ROUTE HIT ===');
  // Debug: log query params
  console.log('TIMETABLE QUERY:', req.query);
  // Parse query params from connection-finder
  const { line_code_direction, departure_from, departure_to, departure_date, ticket_type } = req.query;
  if (!line_code_direction || !departure_from || !departure_to || !departure_date) {
    console.log('Missing required query params');
    return res.render('timetable', { departures: [], passenger: req.session.passenger || null });
  }
  
  try {
  // Parse line_code and direction
  const [line_code, direction] = line_code_direction.split('_');
  // Find line by code and direction
  const lines = await lineModel.getAll(db);
  const line = lines.find(l => l.line_code === line_code && String(l.direction) === direction);
  console.log('Found line:', line);
  if (!line) {
    console.log('Line not found');
    return res.render('timetable', { departures: [], passenger: req.session.passenger || null });
  }
  // Find all trips for this line and date
  const trips = await tripModel.getAll(db);
  const tripsForDay = trips.filter(trip => {
    let tripDateStr = trip.trip_date instanceof Date
      ? trip.trip_date.toISOString().slice(0, 10)
      : String(trip.trip_date);
    return trip.line_id === line.line_id && tripDateStr === departure_date;
  });
  console.log('Trips for day:', tripsForDay);
  // Calculate price (with or without discount)
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
  // For each trip, get stops and times
  let departures = [];
  for (const trip of tripsForDay) {
    // Get all stops for this trip (ordered)
    const stops = await tripModel.getTripStops(db, trip.trip_id);
    console.log('Trip', trip.trip_id, 'stops:', stops);
    const depIdx = stops.findIndex(s => String(s.line_stop_id) === String(departure_from));
    const arrIdx = stops.findIndex(s => String(s.line_stop_id) === String(departure_to));
    console.log('depIdx:', depIdx, 'arrIdx:', arrIdx);
    if (depIdx === -1 || arrIdx === -1 || arrIdx <= depIdx) {
      console.log('Skipping trip', trip.trip_id, 'because stops not found or arrIdx <= depIdx');
      continue;
    }
    departures.push({
      trip_id: trip.trip_id,
      departure_time: stops[depIdx].departure_time,
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
  res.render('timetable', { departures, passenger: req.session.passenger || null });
  
  } catch (error) {
    console.error('Error in timetable route:', error);
    res.render('timetable', { departures: [], passenger: req.session.passenger || null });
  }
});

// New all-lines schedule page
app.get(BASE_PATH + 'line-schedules', lineScheduleController.showAllLineSchedules);

// Reservations page - show all bookings for logged-in user
app.get(BASE_PATH + 'reservations', async (req, res) => {
  if (!req.session.passenger || !req.session.passenger.passenger_id) {
    return res.redirect(BASE_PATH + 'login');
  }

  try {
    const passengerId = req.session.passenger.passenger_id;
    if (!passengerId) {
      throw new Error('Brak passenger_id w sesji.');
    }

    // Get detailed reservations for the logged-in passenger
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
      ORDER BY t.trip_date DESC
    `;

    const [reservations] = await db.query(sql, [passengerId]);

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
    });

    res.render('reservations', { 
      reservations, 
      passenger: req.session.passenger 
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.render('reservations', { 
      reservations: [], 
      passenger: req.session.passenger,
      error: 'Wystąpił błąd podczas pobierania rezerwacji. Szczegóły: ' + error.message
    });
  }
});

// Ensure address, passenger, bus, bus_stop, line, line_stop, timetable, trip, discount, fare, and booking tables exist on startup
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

    // Insert addresses if table is empty
    const [addressRows] = await db.query('SELECT COUNT(*) as count FROM address');
    if (addressRows[0].count === 0) {
      const addresses = [
        ['Polska', 'Babica', '38-120', 'Kolonia', '10', null],
        ['Polska', 'Medyka', '37-730', 'Granica', '14', null],
        ['Polska', 'Blizne', '36-221', 'Ośrodek Zdrowia', '5', null],
        ['Polska', 'Miejsce Piastowe', '38-440', 'Dworcowa', '1', null],
        ['Polska', 'Boguchwała', '36-040', 'Grunwaldzka', '1', null],
        ['Polska', 'Mielec', '39-300', 'Jagiellończyka', '12', null],
        ['Polska', 'Brzozów', '36-200', 'Plac Grunwaldzki', '4', null],
        ['Polska', 'Niebylec', '38-114', 'Rynek', '3', null],
        ['Polska', 'Busko-Zdrój', '28-100', 'Waryńskiego', '29', null],
        ['Polska', 'Nisko', '37-400', 'Kolejowa', '3', null],
        ['Polska', 'Dąbrowa Tarnowska', '33-200', 'Berka Joselewicza', '7', null],
        ['Polska', 'Nowa Dęba', '39-460', 'Centrum', '3', null],
        ['Polska', 'Dębica', '39-200', 'Głowackiego', '22', null],
        ['Polska', 'Opatów', '27-500', 'Sienkiewicza', '1', null],
        ['Polska', 'Domaradz', '38-420', 'Dworcowa', '15', null],
        ['Polska', 'Ostrowiec Świętokrzyski', '27-400', 'Żabia', '8', null],
        ['Polska', 'Gliwice', '44-100', 'Składowa', '8a', null],
        ['Polska', 'Piotrków Trybunalski', '97-300', 'P.O.W.', '12', null],
        ['Polska', 'Grabownica', '36-250', 'Skrzyżowanie', '1', null],
        ['Polska', 'Polańczyk', '38-610', 'Zdrojowa', '12', null],
        ['Polska', 'Humniska', '38-230', 'Środkowa', '6', null],
        ['Polska', 'Połaniec', '28-230', 'Czarnieckiego', '1', null],
        ['Polska', 'Iłża', '27-300', 'Podzamcze', '33', null],
        ['Polska', 'Przemyśl', '37-700', 'Czarnieckiego', '4', null],
        ['Polska', 'Iwonicz-Zdrój', '38-440', 'Plac Oczki', '1', null],
        ['Polska', 'Radom', '26-600', 'Warszawska', '10', null],
        ['Polska', 'Janów Lubelski', '23-300', 'Sukiennicza', '40', null],
        ['Polska', 'Rymanów', '38-480', 'Rynek', '1', null],
        ['Polska', 'Jarosław', '37-500', 'Pruchnicka', '5', null],
        ['Polska', 'Rymanów-Zdrój', '38-480', 'Poczekalnia', '1', null],
        ['Polska', 'Jarosław', '37-500', 'Poniatowskiego', '10', null],
        ['Polska', 'Rzeszów', '35-001', 'Grottgera', '3', null],
        ['Polska', 'Jasionka', '36-002', 'Port Lotniczy', '1', null],
        ['Polska', 'Sanok', '38-500', 'Krakowska', '15', null],
        ['Polska', 'Katowice', '40-001', 'Sądowa', '5', null],
        ['Polska', 'Sokołów Małopolski', '36-050', 'Rynek', '2', null],
        ['Polska', 'Kielce', '25-001', 'Czarnowska', '12', null],
        ['Polska', 'Solina', '38-610', 'Osiedle', '4', null],
        ['Polska', 'Kolbuszowa', '36-100', 'Ks. Ruczki', '8', null],
        ['Polska', 'Stalowa Wola', '37-450', 'Okulickiego', '3', null],
        ['Polska', 'Kraków', '31-001', 'Airport', '1', null],
        ['Polska', 'Stara Wieś', '38-200', 'Kościelna', '7', null],
        ['Polska', 'Kraków', '31-001', 'Bosacka', '18', null],
        ['Polska', 'Staszów', '28-200', 'Rynek', '2', null],
        ['Polska', 'Kraśnik', '23-200', 'Mostowa', '5', null],
        ['Polska', 'Tarnobrzeg', '39-400', 'Mickiewicza', '10', null],
        ['Polska', 'Krosno', '38-400', 'Naftowa', '2', null],
        ['Polska', 'Warszawa', '00-001', 'Port Lotniczy', '1', null],
        ['Polska', 'Lesko', '38-600', 'Piłsudskiego', '50', null],
        ['Polska', 'Warszawa', '01-001', 'Zachodnia', '2', null],
        ['Polska', 'Lublin', '20-001', 'Dworcowa', '2', null],
        ['Polska', 'Wrocław', '50-001', 'Sucha', '1', null],
        ['Polska', 'Lutcza', '38-610', 'Skrzyżowanie', '3', null],
        ['Polska', 'Zagórz', '38-610', 'Osiedle', '1', null],
        ['Polska', 'Łoniów', '27-600', 'Rondo', '1', null],
        ['Polska', 'Żarnów', '26-400', 'Plac Piłsudskiego', '3', null],
        ['Polska', 'Łódź', '90-001', 'Plac Sałacińskiego', '1', null]
      ];
      await db.query(
        'INSERT INTO address (country, city, postal_code, street, house_number, apartment) VALUES ?',
        [addresses]
      );
      console.log('Addresses inserted into address table.');
    }

    // Insert bus stops if table is empty
    const [busStopRows] = await db.query('SELECT COUNT(*) as count FROM bus_stop');
    if (busStopRows[0].count === 0) {
      const busStops = [
        ['BABICA - Kolonia', 1, false],
        ['MEDYKA Granica 14', 2, false],
        ['BLIZNE – Ośrodek Zdrowia', 3, false],
        ['MIEJSCE PIASTOWE - przystanek autobusowy (za rondem w stronę Krosna)', 4, false],
        ['BOGUCHWAŁA – ODR Grunwald 01', 5, false],
        ['MIELEC – Dw. Aut. PKS ul. Jagiellończyka', 6, false],
        ['BRZOZÓW – Dworzec PKS Plac Grunwaldzki 01', 7, false],
        ['NIEBYLEC – HUB', 8, true],
        ['BUSKO ZDRÓJ – MDA (Miejski Dw. Aut.) ul. Waryńskiego 29', 9, false],
        ['NISKO - ul. Kolejowa/Dworcowa 03/01 NOWOŚĆ!!!', 10, false],
        ['DĄBROWA TARNOWSKA - ul. Berka Joselewicza', 11, false],
        ['NOWA DĘBA - Centrum, przystanek dworcowy 03', 12, false],
        ['DĘBICA - Głowackiego Poczta 01', 13, false],
        ['OPATÓW – Dworzec Autobusowy, ul. Sienkiewicza', 14, false],
        ['DOMARADZ - przystanek autobusowy', 15, false],
        ['OSTROWIEC Św. – Dworzec PKS, ul. Żabia', 16, false],
        ['GLIWICE - Centrum Przesiadkowe ul. Składowa 8a stan. nr 23', 17, false],
        ['PIOTRKÓW TRYB. – Dw. Aut. ul. P.O.W. 12', 18, false],
        ['GRABOWNICA - skrzyżowanie', 19, false],
        ['POLAŃCZYK – ul. Zdrojowa, skrzyżowanie', 20, false],
        ['HUMNISKA - środek', 21, false],
        ['POŁANIEC – D.A. (Gal. Połaniecka) ul. Czarnieckiego 1', 22, false],
        ['IŁŻA D.A ul. Podzamcze 33', 23, false],
        ['PRZEMYŚL – Dw. Aut. PKS ul. Czarnieckiego 4', 24, false],
        ['IWONICZ ZDRÓJ – Plac Oczki 01', 25, false],
        ['RADOM – Warszawska/Rondo, Słowackiego/Idalińska', 26, false],
        ['JANÓW LUBELSKI - Dworzec Autobusowy ul. Sukiennicza 40 NOWOŚĆ!!!', 27, false],
        ['RYMANÓW - Rynek', 28, false],
        ['JAROSŁAW – D.A. ul. Pruchnicka - do 30.11.2024 r.', 29, false],
        ['RYMANÓW ZDRÓJ – Góra, Poczekalnia PKS', 30, false],
        ['JAROSŁAW Centrum Przesiadkowe ul. Poniatowskiego - Dworzec PKP - od 1.12.2024 r. NOWOŚĆ!!!', 31, false],
        ['RZESZÓW – Dw. Aut. PKS ul. Grottgera', 32, false],
        ['JASIONKA - Port Lotniczy Rzeszów - Jasionka NOWOŚĆ!!!', 33, false],
        ['SANOK – ul. Krakowska (Dąbrówka), ul. Dmowskiego/Staszica (ALFA), ul. Lipińskiego (Dworzec Autobusowy), ul. Rymanowska', 34, false],
        ['KATOWICE – Dw. Autobusowy ul. Sądowa 5', 35, false],
        ['SOKOŁÓW MŁP. - Rynek 02 NOWOŚĆ!!!', 36, false],
        ['KIELCE Dworzec Autobusowy ul. Czarnowska 12', 37, false],
        ['SOLINA - osiedle', 38, false],
        ['KOLBUSZOWA - Dw. Aut. PKS ul. Ks. Ruczki', 39, false],
        ['STALOWA WOLA - Dworzec Autobusowy ul. Okulickiego 3 NOWOŚĆ!!!', 40, false],
        ['KRAKÓW AIRPORT – przystanek autobusowy', 41, false],
        ['STARA WIEŚ - Kościół', 42, false],
        ['KRAKÓW MDA – Dw. Aut. ul. Bosacka 18', 43, false],
        ['STASZÓW – Rynek 01/02', 44, false],
        ['KRAŚNIK - Przystanek Kraśnik 05, ul. Mostowa NOWOŚĆ!!!', 45, false],
        ['TARNOBRZEG – Dworzec Autobusowy, ul. Mickiewicza', 46, false],
        ['KROSNO – Dw. Aut. PKS ul. Naftowa stan. nr 2', 47, false],
        ['WARSZAWA Port Lotniczy – Terminal Autokarowy', 48, false],
        ['LESKO – D.A. ul. Piłsudskiego 50', 49, false],
        ['WARSZAWA Zachodnia – Dworzec Zachodni PKS', 50, false],
        ['LUBLIN - Dworzec Lublin ul. Dworcowa 2', 51, false],
        ['WROCŁAW – Dw. Aut. ul. Sucha 1 (Galeria WROCLAVIA)', 52, false],
        ['LUTCZA - skrzyżowanie', 53, false],
        ['ZAGÓRZ – osiedle', 54, false],
        ['ŁONIÓW – Rondo', 55, false],
        ['ŻARNÓW – Plac Piłsudskiego/Rynek', 56, false],
        ['ŁÓDŹ FABRYCZNA – Plac Sałacińskiego 1', 57, false]
      ];
      await db.query(
        'INSERT INTO bus_stop (stop_name, address_id, is_hub) VALUES ?',
        [busStops]
      );
      console.log('Bus stops inserted into bus_stop table.');
    }

    // Insert buses if table is empty
    const [busRows] = await db.query('SELECT COUNT(*) as count FROM bus');
    if (busRows[0].count === 0) {
      const buses = [
        ['RZ12345', 'Irizar', 'i6s Efficiency', 2024, 71, null],
        ['RZ22345', 'Irizar', 'i6s Efficiency', 2024, 71, null],
        ['RZ32345', 'Irizar', 'i6s Efficiency', 2024, 71, null],
        ['RZ42345', 'Irizar', 'i6s Efficiency', 2023, 71, null],
        ['RZ52345', 'Irizar', 'i6s Efficiency', 2023, 71, null],
        ['RZ62345', 'Irizar', 'i6s', 2021, 71, null],
        ['RZ72345', 'Irizar', 'i6s', 2021, 71, null],
        ['RZ82345', 'Irizar', 'i6s', 2021, 71, null],
        ['RZ92345', 'Irizar', 'i6s', 2021, 71, null],
        ['RZ67890', 'VDL', 'Futura FDD2', 2021, 75, 21],
        ['RZ67891', 'VDL', 'Futura FDD2', 2021, 75, 21],
        ['RZ67892', 'VDL', 'Futura FDD2', 2021, 75, 21],
        ['RZ67893', 'VDL', 'Futura FDD2', 2021, 75, 21],
        ['RZ67894', 'VDL', 'Futura FDD2', 2021, 75, 21],
        ['KR34567', 'MAN', "Lion's Coach", 2022, 61, null],
        ['KR34568', 'MAN', "Lion's Coach", 2022, 61, null],
        ['RZ67895', 'VDL', 'Futura FHD2', 2020, 53, null],
        ['RZ67896', 'VDL', 'Futura FHD2', 2020, 53, null],
        ['RZ00001', 'Mercedes-Benz', 'Sprinter 519', 2025, 24, null],
        ['RZ00002', 'Mercedes-Benz', 'Sprinter 519', 2025, 24, null],
        ['RZ00003', 'Mercedes-Benz', 'Sprinter 519', 2025, 24, null]
      ];
      await db.query(
        'INSERT INTO bus (registration_number, brand, model, production_year, seats_upper, seats_lower) VALUES ?',
        [buses]
      );
      console.log('Buses inserted into bus table.');
    }

    // Insert lines if table is empty
    const [lineRows] = await db.query('SELECT COUNT(*) as count FROM line');
    if (lineRows[0].count === 0) {
      const lines = [
        ['N3', 'out', 'Polańczyk - WROCŁAW'],
        ['N3', 'back', 'WROCŁAW - Polańczyk'],
        ['N1', 'out', 'Polańczyk - WARSZAWA'],
        ['N1', 'back', 'WARSZAWA - Polańczyk']
      ];
      await db.query(
        'INSERT INTO line (line_code, direction, line_name) VALUES ?',
        [lines]
      );
      console.log('Lines inserted into line table.');
    }

    // Insert line stops if table is empty
    const [lineStopRows] = await db.query('SELECT COUNT(*) as count FROM line_stop');
    if (lineStopRows[0].count === 0) {
      const lineStops1 = [
        [1, 20, 1],   // POLAŃCZYK
        [1, 34, 2],   // SANOK
        [1, 7, 3],    // BRZOZÓW
        [1, 15, 4],   // DOMARADZ
        [1, 4, 5],    // MIEJSCE PIASTOWE
        [1, 47, 6],   // KROSNO
        [1, 53, 7],   // LUTCZA
        [1, 8, 8],    // NIEBYLEC (HUB)
        [1, 5, 9],    // BOGUCHWAŁA
        [1, 32, 10],  // RZESZÓW
        [1, 43, 11],  // KRAKÓW MDA
        [1, 41, 12],  // KRAKÓW AIRPORT
        [1, 35, 13],  // KATOWICE
        [1, 17, 14],  // GLIWICE
        [1, 52, 15]   // WROCŁAW
      ];
      const lineStops2 = [
        [2, 52, 1],   // WROCŁAW
        [2, 17, 2],   // GLIWICE
        [2, 35, 3],   // KATOWICE
        [2, 41, 4],   // KRAKÓW AIRPORT
        [2, 43, 5],   // KRAKÓW MDA
        [2, 32, 6],   // RZESZÓW
        [2, 5, 7],    // BOGUCHWAŁA
        [2, 8, 8],    // NIEBYLEC (HUB)
        [2, 53, 9],   // LUTCZA
        [2, 47, 10],  // KROSNO
        [2, 4, 11],   // MIEJSCE PIASTOWE
        [2, 15, 12],  // DOMARADZ
        [2, 7, 13],   // BRZOZÓW
        [2, 34, 14],  // SANOK
        [2, 20, 15]   // POLAŃCZYK
      ];
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops1]
      );
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops2]
      );
      const lineStops3 = [
        [3, 8, 1],   // NIEBYLEC (HUB)
        [3, 5, 2],   // BOGUCHWAŁA
        [3, 32, 3],  // RZESZÓW
        [3, 39, 4],  // KOLBUSZOWA
        [3, 12, 5],  // NOWA DĘBA
        [3, 55, 6],  // ŁONIÓW
        [3, 14, 7],  // OPATÓW
        [3, 16, 8],  // OSTROWIEC Św.
        [3, 23, 9],  // IŁŻA D.A.
        [3, 26, 10], // RADOM (Słowackiego/Warszawska)
        [3, 48, 11], // WARSZAWA Port Lotniczy
        [3, 50, 12]  // WARSZAWA Zachodnia
      ];
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops3]
      );
      const lineStops4 = [
        [4, 50, 1],   // WARSZAWA Zachodnia
        [4, 48, 2],   // WARSZAWA Port Lotniczy
        [4, 26, 3],   // RADOM (Słowackiego/Warszawska)
        [4, 23, 4],   // IŁŻA D.A.
        [4, 16, 5],   // OSTROWIEC Św.
        [4, 14, 6],   // OPATÓW
        [4, 55, 7],   // ŁONIÓW
        [4, 12, 8],   // NOWA DĘBA
        [4, 39, 9],   // KOLBUSZOWA
        [4, 32, 10],  // RZESZÓW
        [4, 5, 11],   // BOGUCHWAŁA
        [4, 8, 12]    // NIEBYLEC (HUB)
      ];
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops4]
      );
      console.log('Line stops inserted into line_stop table.');
    }

    // Insert timetables if table is empty
    const [timetableRows] = await db.query('SELECT COUNT(*) as count FROM timetable');
    if (timetableRows[0].count === 0) {
      const timetables = [
        // run_number 1
        [1, 1, 127, '00:00', 0],
        [2, 1, 127, '00:50', 0],
        [3, 1, 127, '01:30', 0],
        [4, 1, 127, '01:45', 0],
        [5, 1, 127, '02:10', 0],
        [6, 1, 127, '02:20', 0],
        [7, 1, 127, '02:50', 0],
        [8, 1, 127, '03:00', 0],
        [9, 1, 127, '03:30', 0],
        [10, 1, 127, '03:40', 0],
        [11, 1, 127, '05:00', 0],
        [12, 1, 127, '05:30', 0],
        [13, 1, 127, '06:45', 0],
        [14, 1, 127, '07:15', 0],
        [15, 1, 127, '08:45', 0],
        // run_number 1 for line_stop_id 16-30
        [16, 1, 127, '08:45', 0],
        [17, 1, 127, '10:15', 0],
        [18, 1, 127, '10:45', 0],
        [19, 1, 127, '12:00', 0],
        [20, 1, 127, '12:30', 0],
        [21, 1, 127, '13:50', 0],
        [22, 1, 127, '14:00', 0],
        [23, 1, 127, '14:30', 0],
        [24, 1, 127, '14:40', 0],
        [25, 1, 127, '15:10', 0],
        [26, 1, 127, '15:20', 0],
        [27, 1, 127, '15:45', 0],
        [28, 1, 127, '16:00', 0],
        [29, 1, 127, '16:40', 0],
        [30, 1, 127, '17:30', 0],
        // run_number 1 for line_stop_id 31-42
        [31, 1, 127, '03:00', 0],
        [32, 1, 127, '03:30', 0],
        [33, 1, 127, '03:40', 0],
        [34, 1, 127, '04:00', 0],
        [35, 1, 127, '04:20', 0],
        [36, 1, 127, '04:50', 0],
        [37, 1, 127, '05:45', 0],
        [38, 1, 127, '06:00', 0],
        [39, 1, 127, '06:30', 0],
        [40, 1, 127, '06:55', 0],
        [41, 1, 127, '07:20', 0],
        [42, 1, 127, '07:40', 0],
        // run_number 1 for line_stop_id 43-54
        [43, 1, 127, '07:40', 0],
        [44, 1, 127, '08:00', 0],
        [45, 1, 127, '08:25', 0],
        [46, 1, 127, '08:50', 0],
        [47, 1, 127, '09:10', 0],
        [48, 1, 127, '09:30', 0],
        [49, 1, 127, '09:50', 0],
        [50, 1, 127, '10:00', 0],
        [51, 1, 127, '10:30', 0],
        [52, 1, 127, '11:00', 0],
        [53, 1, 127, '11:30', 0],
        [54, 1, 127, '12:00', 0],
        // run_number 2
        [1, 2, 127, '03:30', 0],
        [2, 2, 127, '04:20', 0],
        [3, 2, 127, '05:00', 0],
        [4, 2, 127, '05:15', 0],
        [5, 2, 127, '05:40', 0],
        [6, 2, 127, '05:50', 0],
        [7, 2, 127, '06:20', 0],
        [8, 2, 127, '06:30', 0],
        [9, 2, 127, '07:00', 0],
        [10, 2, 127, '07:10', 0],
        [11, 2, 127, '08:30', 0],
        [12, 2, 127, '09:00', 0],
        [13, 2, 127, '10:15', 0],
        [14, 2, 127, '10:45', 0],
        [15, 2, 127, '12:15', 0],
        // run_number 2 for line_stop_id 16-30
        [16, 2, 127, '12:15', 0],
        [17, 2, 127, '13:45', 0],
        [18, 2, 127, '14:15', 0],
        [19, 2, 127, '15:30', 0],
        [20, 2, 127, '16:00', 0],
        [21, 2, 127, '17:20', 0],
        [22, 2, 127, '17:30', 0],
        [23, 2, 127, '18:00', 0],
        [24, 2, 127, '18:10', 0],
        [25, 2, 127, '18:40', 0],
        [26, 2, 127, '18:50', 0],
        [27, 2, 127, '19:15', 0],
        [28, 2, 127, '19:30', 0],
        [29, 2, 127, '20:10', 0],
        [30, 2, 127, '21:00', 0],
        // run_number 2 for line_stop_id 31-42
        [31, 2, 127, '06:30', 0],
        [32, 2, 127, '07:00', 0],
        [33, 2, 127, '07:10', 0],
        [34, 2, 127, '07:30', 0],
        [35, 2, 127, '07:50', 0],
        [36, 2, 127, '08:20', 0],
        [37, 2, 127, '09:15', 0],
        [38, 2, 127, '09:30', 0],
        [39, 2, 127, '10:00', 0],
        [40, 2, 127, '10:25', 0],
        [41, 2, 127, '10:50', 0],
        [42, 2, 127, '11:10', 0],
        [43, 2, 127, '11:30', 0],
        [44, 2, 127, '11:55', 0],
        [45, 2, 127, '12:25', 0],
        [46, 2, 127, '12:45', 0],
        [47, 2, 127, '13:15', 0],
        [48, 2, 127, '14:10', 0],
        [49, 2, 127, '14:25', 0],
        [50, 2, 127, '14:55', 0],
        [51, 2, 127, '15:20', 0],
        [52, 2, 127, '15:45', 0],
        [53, 2, 127, '16:05', 0],
        // run_number 3
        [1, 3, 127, '07:15', 0],
        [2, 3, 127, '08:05', 0],
        [3, 3, 127, '08:45', 0],
        [4, 3, 127, '09:00', 0],
        [5, 3, 127, '09:25', 0],
        [6, 3, 127, '09:35', 0],
        [7, 3, 127, '10:05', 0],
        [8, 3, 127, '10:15', 0],
        [9, 3, 127, '10:45', 0],
        [10, 3, 127, '10:55', 0],
        [11, 3, 127, '12:15', 0],
        [12, 3, 127, '12:45', 0],
        [13, 3, 127, '14:00', 0],
        [14, 3, 127, '14:30', 0],
        [15, 3, 127, '16:00', 0],
        // run_number 3 for line_stop_id 16-30
        [16, 3, 127, '16:00', 0],
        [17, 3, 127, '17:30', 0],
        [18, 3, 127, '18:00', 0],
        [19, 3, 127, '19:15', 0],
        [20, 3, 127, '19:45', 0],
        [21, 3, 127, '21:05', 0],
        [22, 3, 127, '21:15', 0],
        [23, 3, 127, '21:45', 0],
        [24, 3, 127, '21:55', 0],
        [25, 3, 127, '22:25', 0],
        [26, 3, 127, '22:35', 0],
        [27, 3, 127, '23:00', 0],
        [28, 3, 127, '23:15', 0],
        [29, 3, 127, '23:55', 0],
        [30, 3, 127, '00:45', 1],
        // run_number 3 for line_stop_id 31-42
        [31, 3, 127, '10:00', 0],
        [32, 3, 127, '10:30', 0],
        [33, 3, 127, '10:40', 0],
        [34, 3, 127, '11:00', 0],
        [35, 3, 127, '11:20', 0],
        [36, 3, 127, '11:50', 0],
        [37, 3, 127, '12:45', 0],
        [38, 3, 127, '13:00', 0],
        [39, 3, 127, '13:30', 0],
        [40, 3, 127, '13:55', 0],
        [41, 3, 127, '14:20', 0],
        [42, 3, 127, '14:40', 0],
        // run_number 4
        [1, 4, 127, '12:00', 0],
        [2, 4, 127, '12:50', 0],
        [3, 4, 127, '13:30', 0],
        [4, 4, 127, '13:45', 0],
        [5, 4, 127, '14:10', 0],
        [6, 4, 127, '14:20', 0],
        [7, 4, 127, '14:50', 0],
        [8, 4, 127, '15:00', 0],
        [9, 4, 127, '15:30', 0],
        [10, 4, 127, '15:40', 0],
        [11, 4, 127, '17:00', 0],
        [12, 4, 127, '17:30', 0],
        [13, 4, 127, '18:45', 0],
        [14, 4, 127, '19:15', 0],
        [15, 4, 127, '20:45', 0],
        // run_number 4 for line_stop_id 16-30
        [16, 4, 127, '20:45', 0],
        [17, 4, 127, '22:15', 0],
        [18, 4, 127, '22:45', 0],
        [19, 4, 127, '00:00', 1],
        [20, 4, 127, '00:30', 1],
        [21, 4, 127, '01:50', 1],
        [22, 4, 127, '02:00', 1],
        [23, 4, 127, '02:30', 1],
        [24, 4, 127, '02:40', 1],
        [25, 4, 127, '03:10', 1],
        [26, 4, 127, '03:20', 1],
        [27, 4, 127, '03:45', 1],
        [28, 4, 127, '04:00', 1],
        [29, 4, 127, '04:40', 1],
        [30, 4, 127, '05:30', 1],
        // run_number 4 for line_stop_id 31-42
        [31, 4, 127, '15:00', 0],
        [32, 4, 127, '15:30', 0],
        [33, 4, 127, '15:40', 0],
        [34, 4, 127, '16:00', 0],
        [35, 4, 127, '16:20', 0],
        [36, 4, 127, '16:50', 0],
        [37, 4, 127, '17:45', 0],
        [38, 4, 127, '18:00', 0],
        [39, 4, 127, '18:30', 0],
        [40, 4, 127, '18:55', 0],
        [41, 4, 127, '19:20', 0],
        [42, 4, 127, '19:40', 0],
        [43, 4, 127, '19:40', 0],
        [44, 4, 127, '20:00', 0],
        [45, 4, 127, '20:25', 0],
        [46, 4, 127, '20:55', 0],
        [47, 4, 127, '21:15', 0],
        [48, 4, 127, '21:45', 0],
        [49, 4, 127, '22:40', 0],
        [50, 4, 127, '22:55', 0],
        [51, 4, 127, '23:25', 0],
        [52, 4, 127, '23:50', 0],
        ];
      await db.query(
        'INSERT INTO timetable (line_stop_id, run_number, day_mask, departure_time, offset_days) VALUES ?',
        [timetables]
      );
      console.log('Timetables inserted into timetable table.');
    }

    // Insert fares if table is empty
    const [fareRows] = await db.query('SELECT COUNT(*) as count FROM fare');
    if (fareRows[0].count === 0) {
      const fares = [
        [1, 1, 2, 3.50],
        [1, 2, 3, 5.00],
        [1, 3, 4, 2.50],
        [1, 4, 5, 2.00],
        [1, 5, 6, 1.00],
        [1, 6, 7, 5.00],
        [1, 7, 8, 4.00],
        [1, 8, 9, 5.00],
        [1, 9, 10, 15.00],
        [1, 10, 11, 10.00],
        [1, 11, 12, 5.00],
        [1, 12, 13, 5.00],
        [1, 13, 14, 5.00],
        [1, 14, 15, 5.00],
        [2, 16, 17, 5.00],
        [2, 17, 18, 5.00],
        [2, 18, 19, 5.00],
        [2, 19, 20, 5.00],
        [2, 20, 21, 10.00],
        [2, 21, 22, 15.00],
        [2, 22, 23, 5.00],
        [2, 23, 24, 4.00],
        [2, 24, 25, 5.00],
        [2, 25, 26, 1.00],
        [2, 26, 27, 2.00],
        [2, 27, 28, 2.50],
        [2, 28, 29, 5.00],
        [2, 29, 30, 3.50],
        [3, 31, 32, 5.00],
        [3, 32, 33, 5.00],
        [3, 33, 34, 3.50],
        [3, 34, 35, 4.50],
        [3, 35, 36, 3.25],
        [3, 36, 37, 7.50],
        [3, 37, 38, 2.50],
        [3, 38, 39, 1.50],
        [3, 39, 40, 3.00],
        [3, 40, 41, 10.00],
        [3, 41, 42, 2.50],
        [4, 43, 44, 2.50],
        [4, 44, 45, 10.00],
        [4, 45, 46, 3.00],
        [4, 46, 47, 1.50],
        [4, 47, 48, 2.50],
        [4, 48, 49, 7.50],
        [4, 49, 50, 3.25],
        [4, 50, 51, 4.50],
        [4, 51, 52, 3.50],
        [4, 52, 53, 5.00],
        [4, 53, 54, 5.00],
      ];
      await db.query(
        'INSERT INTO fare (line_id, start_line_stop_id, end_line_stop_id, base_price) VALUES ?',
        [fares]
      );
      console.log('Fares inserted into fare table.');
    }

    // Insert discounts if table is empty
    const [discountRows] = await db.query('SELECT COUNT(*) as count FROM discount');
    if (discountRows[0].count === 0) {
      const discounts = [
        ['STUDENT', 'Zniżka dla uczniów / studentów', 25.00],
      ];
      await db.query(
        'INSERT INTO discount (discount_code, discount_description, percent_off) VALUES ?',
        [discounts]
      );
      console.log('Discounts inserted into discount table.');
    }

    // Insert trips if table is empty
    const [tripRows] = await db.query('SELECT COUNT(*) as count FROM trip');
    if (tripRows[0].count === 0) {
      const trips = [
        [1, '2025-06-28', 1, 1],
        [1, '2025-06-28', 2, 2],
        [1, '2025-06-28', 3, 3],
        [1, '2025-06-28', 4, 4],
        [2, '2025-06-28', 1, 1],
        [2, '2025-06-28', 2, 2],
        [2, '2025-06-28', 3, 3],
        [2, '2025-06-28', 4, 4],
        [3, '2025-06-28', 1, 5],
        [3, '2025-06-28', 2, 6],
        [3, '2025-06-28', 3, 7],
        [3, '2025-06-28', 4, 8],
        [4, '2025-06-28', 1, 5],
        [4, '2025-06-28', 2, 6],
        [4, '2025-06-28', 3, 7],
        [4, '2025-06-28', 4, 8],
      ];
      await db.query(
        'INSERT INTO trip (line_id, trip_date, run_number, bus_id) VALUES ?',
        [trips]
      );
      console.log('Trips inserted into trip table.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}, base path: ${BASE_PATH}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
