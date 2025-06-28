const db = require('../config/db');

const Booking = {
  createTable: async () => {
    const sql = `CREATE TABLE IF NOT EXISTS booking (
      booking_id INT AUTO_INCREMENT PRIMARY KEY,
      passenger_id INT NOT NULL,
      trip_id INT NOT NULL,
      start_line_stop_id INT NOT NULL,
      end_line_stop_id INT NOT NULL,
      seat_number INT NOT NULL,
      deck ENUM('upper','lower') NOT NULL,
      discount_id INT DEFAULT NULL,
      base_price DECIMAL(8,2) DEFAULT NULL,
      status ENUM('reserved', 'cancelled', 'completed') NOT NULL DEFAULT 'reserved',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
      FOREIGN KEY (trip_id) REFERENCES trip(trip_id),
      FOREIGN KEY (start_line_stop_id) REFERENCES line_stop(line_stop_id),
      FOREIGN KEY (end_line_stop_id) REFERENCES line_stop(line_stop_id),
      FOREIGN KEY (discount_id) REFERENCES discount(discount_id),
      UNIQUE (trip_id, seat_number, deck, start_line_stop_id, end_line_stop_id)
    )`;
    await db.query(sql);
  },

  create: async (booking) => {
    let discountId = (booking.discount_id === undefined || booking.discount_id === null || booking.discount_id === '') ? null : booking.discount_id;
    if (booking.base_price === undefined || booking.base_price === null) {
      throw new Error('base_price must be provided when creating a booking');
    }
    const sql = `INSERT INTO booking (passenger_id, trip_id, start_line_stop_id, end_line_stop_id, seat_number, deck, discount_id, base_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      booking.passenger_id,
      booking.trip_id,
      booking.start_line_stop_id,
      booking.end_line_stop_id,
      booking.seat_number,
      booking.deck,
      discountId,
      booking.base_price,
      booking.status || 'reserved'
    ]);
    return { booking_id: result.insertId, ...booking, discount_id: discountId };
  },

  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM booking');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM booking WHERE booking_id = ?', [id]);
    return rows[0];
  },

  update: async (id, booking) => {
    const sql = `UPDATE booking SET passenger_id=?, trip_id=?, start_line_stop_id=?, end_line_stop_id=?, seat_number=?, deck=?, discount_id=?, status=? WHERE booking_id=?`;
    await db.query(sql, [
      booking.passenger_id,
      booking.trip_id,
      booking.start_line_stop_id,
      booking.end_line_stop_id,
      booking.seat_number,
      booking.deck,
      booking.discount_id,
      booking.status,
      id
    ]);
    return { booking_id: id, ...booking };
  },

  delete: async (id) => {
    await db.query('DELETE FROM booking WHERE booking_id = ?', [id]);
  },

  getPassengerForBooking: async (booking_id) => {
    const sql = `SELECT p.* FROM passenger p JOIN booking b ON p.passenger_id = b.passenger_id WHERE b.booking_id = ?`;
    const [rows] = await db.query(sql, [booking_id]);
    return rows[0];
  },

  getStartLineStopForBooking: async (booking_id) => {
    const sql = `SELECT ls.* FROM line_stop ls JOIN booking b ON ls.line_stop_id = b.start_line_stop_id WHERE b.booking_id = ?`;
    const [rows] = await db.query(sql, [booking_id]);
    return rows[0];
  },

  getEndLineStopForBooking: async (booking_id) => {
    const sql = `SELECT ls.* FROM line_stop ls JOIN booking b ON ls.line_stop_id = b.end_line_stop_id WHERE b.booking_id = ?`;
    const [rows] = await db.query(sql, [booking_id]);
    return rows[0];
  },

  getAllForPassenger: async (passenger_id) => {
    const sql = `SELECT * FROM booking WHERE passenger_id = ?`;
    const [rows] = await db.query(sql, [passenger_id]);
    return rows;
  },

  getAllForTrip: async (trip_id) => {
    const sql = `SELECT * FROM booking WHERE trip_id = ?`;
    const [rows] = await db.query(sql, [trip_id]);
    return rows;
  },

  getReservationCardData: async (db, booking_id) => {
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
      LEFT JOIN timetable start_tt ON start_tt.line_stop_id = start_ls.line_stop_id AND start_tt.run_number = t.run_number
      LEFT JOIN timetable end_tt ON end_tt.line_stop_id = end_ls.line_stop_id AND end_tt.run_number = t.run_number
      WHERE b.booking_id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [booking_id]);
    if (!rows[0]) return null;
    const reservation = rows[0];
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
    return reservation;
  },
};

module.exports = Booking;
