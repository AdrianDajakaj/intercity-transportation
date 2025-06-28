module.exports = {
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS address (
      address_id   INT AUTO_INCREMENT PRIMARY KEY,
      country      VARCHAR(50)    NOT NULL,
      city         VARCHAR(100)   NOT NULL,
      postal_code  VARCHAR(20)    NULL,
      street       VARCHAR(100)   NULL,
      house_number VARCHAR(20)    NOT NULL,
      apartment    VARCHAR(20)    NULL
    )`;
    await db.execute(sql);
  },

  create: async (db, data) => {
    const sql = `INSERT INTO address (country, city, postal_code, street, house_number, apartment) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.country,
      data.city,
      data.postal_code,
      data.street,
      data.house_number,
      data.apartment
    ]);
    return result.insertId;
  },

  getById: async (db, address_id) => {
    const sql = `SELECT * FROM address WHERE address_id = ?`;
    const [rows] = await db.execute(sql, [address_id]);
    return rows[0];
  },

  update: async (db, address_id, data) => {
    const sql = `UPDATE address SET country=?, city=?, postal_code=?, street=?, house_number=?, apartment=? WHERE address_id=?`;
    const [result] = await db.execute(sql, [
      data.country,
      data.city,
      data.postal_code,
      data.street,
      data.house_number,
      data.apartment,
      address_id
    ]);
    return result.affectedRows > 0;
  },

  delete: async (db, address_id) => {
    const sql = `DELETE FROM address WHERE address_id = ?`;
    const [result] = await db.execute(sql, [address_id]);
    return result.affectedRows > 0;
  },

  getAll: async (db) => {
    const sql = `SELECT * FROM address`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
