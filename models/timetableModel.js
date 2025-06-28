module.exports = {
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS timetable (
      schedule_id INT AUTO_INCREMENT PRIMARY KEY,
      line_stop_id INT NOT NULL,
      run_number SMALLINT NOT NULL,
      day_mask TINYINT NOT NULL,
      departure_time TIME NOT NULL,
      offset_days TINYINT NOT NULL DEFAULT 0,
      FOREIGN KEY (line_stop_id) REFERENCES line_stop(line_stop_id)
    )`;
    await db.execute(sql);
  },

  create: async (db, data) => {
    const sql = `INSERT INTO timetable (line_stop_id, run_number, day_mask, departure_time, offset_days) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.line_stop_id,
      data.run_number,
      data.day_mask,
      data.departure_time,
      data.offset_days || 0
    ]);
    return result.insertId;
  },

  getById: async (db, schedule_id) => {
    const sql = `SELECT * FROM timetable WHERE schedule_id = ?`;
    const [rows] = await db.execute(sql, [schedule_id]);
    return rows[0];
  },

  update: async (db, schedule_id, data) => {
    const sql = `UPDATE timetable SET line_stop_id=?, run_number=?, day_mask=?, departure_time=?, offset_days=? WHERE schedule_id=?`;
    const [result] = await db.execute(sql, [
      data.line_stop_id,
      data.run_number,
      data.day_mask,
      data.departure_time,
      data.offset_days || 0,
      schedule_id
    ]);
    return result.affectedRows > 0;
  },

  delete: async (db, schedule_id) => {
    const sql = `DELETE FROM timetable WHERE schedule_id = ?`;
    const [result] = await db.execute(sql, [schedule_id]);
    return result.affectedRows > 0;
  },

  getAll: async (db) => {
    const sql = `SELECT * FROM timetable`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
