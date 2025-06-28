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

  // Get total price for a line between start and end stops (SQL range approach, fallback to segment-by-segment)
  getTotalPrice: async (line_id, start_line_stop_id, end_line_stop_id) => {
    // Force all IDs to integers
    line_id = parseInt(line_id);
    start_line_stop_id = parseInt(start_line_stop_id);
    end_line_stop_id = parseInt(end_line_stop_id);
    // Get start and end stop names (correct column: stop_name)
    const [startRows] = await db.query('SELECT bs.stop_name AS stop_name FROM line_stop ls JOIN bus_stop bs ON ls.stop_id = bs.stop_id WHERE ls.line_stop_id = ?', [start_line_stop_id]);
    const [endRows] = await db.query('SELECT bs.stop_name AS stop_name FROM line_stop ls JOIN bus_stop bs ON ls.stop_id = bs.stop_id WHERE ls.line_stop_id = ?', [end_line_stop_id]);
    const start_stop_name = startRows[0] ? startRows[0].stop_name : null;
    const end_stop_name = endRows[0] ? endRows[0].stop_name : null;
    // Try SQL range approach (works if fare table is filled for all direct pairs)
    let sql, rows;
    if (start_line_stop_id < end_line_stop_id) {
      sql = `SELECT SUM(base_price) AS total_price FROM fare WHERE line_id = ? AND start_line_stop_id >= ? AND end_line_stop_id <= ?`;
      [rows] = await db.query(sql, [line_id, start_line_stop_id, end_line_stop_id]);
    } else if (start_line_stop_id > end_line_stop_id) {
      sql = `SELECT SUM(base_price) AS total_price FROM fare WHERE line_id = ? AND start_line_stop_id <= ? AND end_line_stop_id >= ?`;
      [rows] = await db.query(sql, [line_id, start_line_stop_id, end_line_stop_id]);
    } else {
      return { total_price: 0, start_stop_name, end_stop_name };
    }
    if (rows && rows[0] && rows[0].total_price !== null) {
      return { total_price: Number(rows[0].total_price), start_stop_name, end_stop_name };
    }
    // Fallback: segment-by-segment (robust for any fare table)
    const stopsSql = `SELECT line_stop_id, sequence FROM line_stop WHERE line_id = ? ORDER BY sequence`;
    const [stopsRows] = await db.query(stopsSql, [line_id]);
    if (stopsRows.length < 2) return { total_price: null, start_stop_name, end_stop_name };
    const idToSeq = {};
    stopsRows.forEach(row => { idToSeq[row.line_stop_id] = row.sequence; });
    const startSeq = idToSeq[start_line_stop_id];
    const endSeq = idToSeq[end_line_stop_id];
    if (startSeq === undefined || endSeq === undefined) return { total_price: null, start_stop_name, end_stop_name };
    const path = [];
    if (startSeq < endSeq) {
      for (let seq = startSeq; seq < endSeq; seq++) {
        const from = stopsRows.find(r => r.sequence === seq);
        const to = stopsRows.find(r => r.sequence === seq + 1);
        if (from && to) path.push([from.line_stop_id, to.line_stop_id]);
      }
    } else if (startSeq > endSeq) {
      for (let seq = startSeq; seq > endSeq; seq--) {
        const from = stopsRows.find(r => r.sequence === seq);
        const to = stopsRows.find(r => r.sequence === seq - 1);
        if (from && to) path.push([from.line_stop_id, to.line_stop_id]);
      }
    } else {
      return { total_price: 0, start_stop_name, end_stop_name };
    }
    if (path.length === 0) return { total_price: null, start_stop_name, end_stop_name };
    let total = 0;
    for (const [fromId, toId] of path) {
      const segSql = `SELECT base_price FROM fare WHERE line_id = ? AND start_line_stop_id = ? AND end_line_stop_id = ?`;
      const [segRows] = await db.query(segSql, [line_id, fromId, toId]);
      if (!segRows[0]) return { total_price: null, start_stop_name, end_stop_name };
      total += Number(segRows[0].base_price);
    }
    return { total_price: total, start_stop_name, end_stop_name };
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
