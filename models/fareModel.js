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
  }
};

module.exports = Fare;
