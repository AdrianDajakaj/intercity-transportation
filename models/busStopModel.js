// BusStop model for MySQL
// Table: bus_stop

module.exports = {
  // Create the bus_stop table if it doesn't exist
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS bus_stop (
      stop_id INT AUTO_INCREMENT PRIMARY KEY,
      stop_name VARCHAR(255) NOT NULL,
      address_id INT NULL,
      is_hub BOOLEAN NOT NULL DEFAULT FALSE,
      FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE SET NULL
    )`;
    await db.execute(sql);
  },

  // Create a new bus stop
  create: async (db, data) => {
    const sql = `INSERT INTO bus_stop (stop_name, address_id, is_hub) VALUES (?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.stop_name,
      data.address_id || null,
      data.is_hub === undefined ? false : !!data.is_hub
    ]);
    return result.insertId;
  },

  // Read (get) a bus stop by id
  getById: async (db, stop_id) => {
    const sql = `SELECT * FROM bus_stop WHERE stop_id = ?`;
    const [rows] = await db.execute(sql, [stop_id]);
    return rows[0];
  },

  // Update a bus stop by id
  update: async (db, stop_id, data) => {
    const sql = `UPDATE bus_stop SET stop_name=?, address_id=?, is_hub=? WHERE stop_id=?`;
    const [result] = await db.execute(sql, [
      data.stop_name,
      data.address_id || null,
      data.is_hub === undefined ? false : !!data.is_hub,
      stop_id
    ]);
    return result.affectedRows > 0;
  },

  // Delete a bus stop by id
  delete: async (db, stop_id) => {
    const sql = `DELETE FROM bus_stop WHERE stop_id = ?`;
    const [result] = await db.execute(sql, [stop_id]);
    return result.affectedRows > 0;
  },

  // List all bus stops
  getAll: async (db) => {
    const sql = `SELECT * FROM bus_stop`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
