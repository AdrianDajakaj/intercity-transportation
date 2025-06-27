// Bus model for MySQL
// Table: bus

module.exports = {
  // Create the bus table if it doesn't exist
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS bus (
      bus_id INT AUTO_INCREMENT PRIMARY KEY,
      registration_number VARCHAR(20) NOT NULL UNIQUE,
      brand VARCHAR(50) NOT NULL,
      model VARCHAR(50) NOT NULL,
      production_year YEAR NOT NULL,
      seats_upper SMALLINT NOT NULL,
      seats_lower SMALLINT NULL,
      status ENUM('available','on_trip','in_service','maintenance') NOT NULL DEFAULT 'available'
    )`;
    await db.execute(sql);
  },

  // Create a new bus
  create: async (db, data) => {
    const sql = `INSERT INTO bus (registration_number, brand, model, production_year, seats_upper, seats_lower, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.registration_number,
      data.brand,
      data.model,
      data.production_year,
      data.seats_upper,
      data.seats_lower || null,
      data.status || 'available'
    ]);
    return result.insertId;
  },

  // Read (get) a bus by id
  getById: async (db, bus_id) => {
    const sql = `SELECT * FROM bus WHERE bus_id = ?`;
    const [rows] = await db.execute(sql, [bus_id]);
    return rows[0];
  },

  // Update a bus by id
  update: async (db, bus_id, data) => {
    const sql = `UPDATE bus SET registration_number=?, brand=?, model=?, production_year=?, seats_upper=?, seats_lower=?, status=? WHERE bus_id=?`;
    const [result] = await db.execute(sql, [
      data.registration_number,
      data.brand,
      data.model,
      data.production_year,
      data.seats_upper,
      data.seats_lower || null,
      data.status || 'available',
      bus_id
    ]);
    return result.affectedRows > 0;
  },

  // Delete a bus by id
  delete: async (db, bus_id) => {
    const sql = `DELETE FROM bus WHERE bus_id = ?`;
    const [result] = await db.execute(sql, [bus_id]);
    return result.affectedRows > 0;
  },

  // List all buses
  getAll: async (db) => {
    const sql = `SELECT * FROM bus`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
