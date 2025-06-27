// Discount model for MySQL
// Table: discount

module.exports = {
  // Create the discount table if it doesn't exist
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS discount (
      discount_id INT AUTO_INCREMENT PRIMARY KEY,
      discount_code VARCHAR(50) NOT NULL UNIQUE,
      discount_description VARCHAR(255),
      percent_off DECIMAL(5,2) NOT NULL DEFAULT 0
    )`;
    await db.execute(sql);
  },

  // Create a new discount
  create: async (db, data) => {
    const sql = `INSERT INTO discount (discount_code, discount_description, percent_off) VALUES (?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.discount_code,
      data.discount_description || null,
      data.percent_off || 0
    ]);
    return result.insertId;
  },

  // Read (get) a discount by id
  getById: async (db, discount_id) => {
    const sql = `SELECT * FROM discount WHERE discount_id = ?`;
    const [rows] = await db.execute(sql, [discount_id]);
    return rows[0];
  },

  // Update a discount by id
  update: async (db, discount_id, data) => {
    const sql = `UPDATE discount SET discount_code=?, discount_description=?, percent_off=? WHERE discount_id=?`;
    const [result] = await db.execute(sql, [
      data.discount_code,
      data.discount_description || null,
      data.percent_off || 0,
      discount_id
    ]);
    return result.affectedRows > 0;
  },

  // Delete a discount by id
  delete: async (db, discount_id) => {
    const sql = `DELETE FROM discount WHERE discount_id = ?`;
    const [result] = await db.execute(sql, [discount_id]);
    return result.affectedRows > 0;
  },

  // List all discounts
  getAll: async (db) => {
    const sql = `SELECT * FROM discount`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
