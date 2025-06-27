// Passenger model for MySQL
// Table: passenger

module.exports = {
  // Create the passenger table if it doesn't exist
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS passenger (
      passenger_id INT AUTO_INCREMENT PRIMARY KEY,
      passenger_name VARCHAR(100) NOT NULL,
      passenger_surname VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(60) NOT NULL,
      address_id INT NULL,
      FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE SET NULL
    )`;
    await db.execute(sql);
  },

  // Create a new passenger
  create: async (db, data) => {
    const sql = `INSERT INTO passenger (passenger_name, passenger_surname, email, password_hash, address_id) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.passenger_name,
      data.passenger_surname,
      data.email,
      data.password_hash,
      data.address_id || null
    ]);
    return result.insertId;
  },

  // Read (get) a passenger by id
  getById: async (db, passenger_id) => {
    const sql = `SELECT * FROM passenger WHERE passenger_id = ?`;
    const [rows] = await db.execute(sql, [passenger_id]);
    return rows[0];
  },

  // Update a passenger by id
  update: async (db, passenger_id, data) => {
    const sql = `UPDATE passenger SET passenger_name=?, passenger_surname=?, email=?, password_hash=?, address_id=? WHERE passenger_id=?`;
    const [result] = await db.execute(sql, [
      data.passenger_name,
      data.passenger_surname,
      data.email,
      data.password_hash,
      data.address_id || null,
      passenger_id
    ]);
    return result.affectedRows > 0;
  },

  // Delete a passenger by id
  delete: async (db, passenger_id) => {
    const sql = `DELETE FROM passenger WHERE passenger_id = ?`;
    const [result] = await db.execute(sql, [passenger_id]);
    return result.affectedRows > 0;
  },

  // List all passengers
  getAll: async (db) => {
    const sql = `SELECT * FROM passenger`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
