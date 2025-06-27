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
      discount_id INT NOT NULL DEFAULT 1,
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
    const sql = `INSERT INTO booking (passenger_id, trip_id, start_line_stop_id, end_line_stop_id, seat_number, deck, discount_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      booking.passenger_id,
      booking.trip_id,
      booking.start_line_stop_id,
      booking.end_line_stop_id,
      booking.seat_number,
      booking.deck,
      booking.discount_id || 1,
      booking.status || 'reserved'
    ]);
    return { booking_id: result.insertId, ...booking };
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

  // Get passenger for a specific booking
  getPassengerForBooking: async (booking_id) => {
    const sql = `SELECT p.* FROM passenger p JOIN booking b ON p.passenger_id = b.passenger_id WHERE b.booking_id = ?`;
    const [rows] = await db.query(sql, [booking_id]);
    return rows[0];
  },

  // Get start line stop for a specific booking
  getStartLineStopForBooking: async (booking_id) => {
    const sql = `SELECT ls.* FROM line_stop ls JOIN booking b ON ls.line_stop_id = b.start_line_stop_id WHERE b.booking_id = ?`;
    const [rows] = await db.query(sql, [booking_id]);
    return rows[0];
  },

  // Get end line stop for a specific booking
  getEndLineStopForBooking: async (booking_id) => {
    const sql = `SELECT ls.* FROM line_stop ls JOIN booking b ON ls.line_stop_id = b.end_line_stop_id WHERE b.booking_id = ?`;
    const [rows] = await db.query(sql, [booking_id]);
    return rows[0];
  },

  // Get all bookings for a specific passenger
  getAllForPassenger: async (passenger_id) => {
    const sql = `SELECT * FROM booking WHERE passenger_id = ?`;
    const [rows] = await db.query(sql, [passenger_id]);
    return rows;
  },

  // Get all bookings for a specific trip
  getAllForTrip: async (trip_id) => {
    const sql = `SELECT * FROM booking WHERE trip_id = ?`;
    const [rows] = await db.query(sql, [trip_id]);
    return rows;
  }
};

module.exports = Booking;
