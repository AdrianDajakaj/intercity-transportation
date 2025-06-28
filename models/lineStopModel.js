module.exports = {
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS line_stop (
      line_stop_id INT AUTO_INCREMENT PRIMARY KEY,
      line_id INT NOT NULL,
      stop_id INT NOT NULL,
      sequence SMALLINT NOT NULL,
      UNIQUE(line_id, sequence),
      FOREIGN KEY (line_id) REFERENCES line(line_id),
      FOREIGN KEY (stop_id) REFERENCES bus_stop(stop_id)
    )`;
    await db.execute(sql);
  },

  create: async (db, data) => {
    const sql = `INSERT INTO line_stop (line_id, stop_id, sequence) VALUES (?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.line_id,
      data.stop_id,
      data.sequence
    ]);
    return result.insertId;
  },

  getById: async (db, line_stop_id) => {
    const sql = `SELECT * FROM line_stop WHERE line_stop_id = ?`;
    const [rows] = await db.execute(sql, [line_stop_id]);
    return rows[0];
  },

  update: async (db, line_stop_id, data) => {
    const sql = `UPDATE line_stop SET line_id=?, stop_id=?, sequence=? WHERE line_stop_id=?`;
    const [result] = await db.execute(sql, [
      data.line_id,
      data.stop_id,
      data.sequence,
      line_stop_id
    ]);
    return result.affectedRows > 0;
  },

  delete: async (db, line_stop_id) => {
    const sql = `DELETE FROM line_stop WHERE line_stop_id = ?`;
    const [result] = await db.execute(sql, [line_stop_id]);
    return result.affectedRows > 0;
  },

  getAll: async (db) => {
    const sql = `SELECT * FROM line_stop`;
    const [rows] = await db.execute(sql);
    return rows;
  },

  getAllByLineIdWithStopName: async (db, line_id) => {
    const sql = `SELECT ls.line_stop_id, ls.sequence, bs.stop_name FROM line_stop ls JOIN bus_stop bs ON ls.stop_id = bs.stop_id WHERE ls.line_id = ? ORDER BY ls.sequence`;
    const [rows] = await db.query(sql, [line_id]);
    return rows;
  },
};
