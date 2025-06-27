const db = require('../config/db');

const Fare = {
  createTable: async () => {
    const sql = `CREATE TABLE IF NOT EXISTS fare (
      fare_id INT AUTO_INCREMENT PRIMARY KEY,
      line_id INT NOT NULL,
      start_line_stop_id INT NOT NULL,
      end_line_stop_id INT NOT NULL,
      base_price DECIMAL(6,2) NOT NULL,
      FOREIGN KEY (line_id) REFERENCES line(line_id),
      FOREIGN KEY (start_line_stop_id) REFERENCES line_stop(line_stop_id),
      FOREIGN KEY (end_line_stop_id) REFERENCES line_stop(line_stop_id),
      UNIQUE (line_id, start_line_stop_id, end_line_stop_id)
    )`;
    await db.query(sql);
  },

  create: async (fare) => {
    const sql = `INSERT INTO fare (line_id, start_line_stop_id, end_line_stop_id, base_price) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(sql, [fare.line_id, fare.start_line_stop_id, fare.end_line_stop_id, fare.base_price]);
    return { fare_id: result.insertId, ...fare };
  },

  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM fare');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM fare WHERE fare_id = ?', [id]);
    return rows[0];
  },

  update: async (id, fare) => {
    const sql = `UPDATE fare SET line_id=?, start_line_stop_id=?, end_line_stop_id=?, base_price=? WHERE fare_id=?`;
    await db.query(sql, [fare.line_id, fare.start_line_stop_id, fare.end_line_stop_id, fare.base_price, id]);
    return { fare_id: id, ...fare };
  },

  delete: async (id) => {
    await db.query('DELETE FROM fare WHERE fare_id = ?', [id]);
  },

  // Get total price for a line between start and end stops (inclusive)
  getTotalPrice: async (line_id, start, end) => {
    const sql = `SELECT SUM(base_price) AS total_price FROM fare WHERE line_id = ? AND start_line_stop_id >= ? AND end_line_stop_id <= ?`;
    const [rows] = await db.query(sql, [line_id, start, end]);
    return rows[0];
  },

  // Get line for a specific fare
  getLineForFare: async (fare_id) => {
    const sql = `SELECT l.* FROM line l JOIN fare f ON l.line_id = f.line_id WHERE f.fare_id = ?`;
    const [rows] = await db.query(sql, [fare_id]);
    return rows[0];
  },

  // Get start line stop for a specific fare
  getStartLineStopForFare: async (fare_id) => {
    const sql = `SELECT ls.* FROM line_stop ls JOIN fare f ON ls.line_stop_id = f.start_line_stop_id WHERE f.fare_id = ?`;
    const [rows] = await db.query(sql, [fare_id]);
    return rows[0];
  },

  // Get end line stop for a specific fare
  getEndLineStopForFare: async (fare_id) => {
    const sql = `SELECT ls.* FROM line_stop ls JOIN fare f ON ls.line_stop_id = f.end_line_stop_id WHERE f.fare_id = ?`;
    const [rows] = await db.query(sql, [fare_id]);
    return rows[0];
  }
};

module.exports = Fare;
