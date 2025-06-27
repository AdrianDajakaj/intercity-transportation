// Trip model for MySQL
// Table: trip

module.exports = {
  // Create the trip table if it doesn't exist
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS trip (
      trip_id INT AUTO_INCREMENT PRIMARY KEY,
      line_id INT NOT NULL,
      trip_date DATE NOT NULL,
      run_number SMALLINT NOT NULL,
      bus_id INT NOT NULL,
      UNIQUE (line_id, trip_date, run_number),
      FOREIGN KEY (line_id) REFERENCES line(line_id),
      FOREIGN KEY (bus_id) REFERENCES bus(bus_id)
    )`;
    await db.execute(sql);
  },

  // Create a new trip
  create: async (db, data) => {
    const sql = `INSERT INTO trip (line_id, trip_date, run_number, bus_id) VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.line_id,
      data.trip_date,
      data.run_number,
      data.bus_id
    ]);
    return result.insertId;
  },

  // Read (get) a trip by id
  getById: async (db, trip_id) => {
    const sql = `SELECT * FROM trip WHERE trip_id = ?`;
    const [rows] = await db.execute(sql, [trip_id]);
    return rows[0];
  },

  // Update a trip by id
  update: async (db, trip_id, data) => {
    const sql = `UPDATE trip SET line_id=?, trip_date=?, run_number=?, bus_id=? WHERE trip_id=?`;
    const [result] = await db.execute(sql, [
      data.line_id,
      data.trip_date,
      data.run_number,
      data.bus_id,
      trip_id
    ]);
    return result.affectedRows > 0;
  },

  // Delete a trip by id
  delete: async (db, trip_id) => {
    const sql = `DELETE FROM trip WHERE trip_id = ?`;
    const [result] = await db.execute(sql, [trip_id]);
    return result.affectedRows > 0;
  },

  // List all trips
  getAll: async (db) => {
    const sql = `SELECT * FROM trip`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
