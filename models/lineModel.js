module.exports = {
  createTable: async (db) => {
    const sql = `CREATE TABLE IF NOT EXISTS line (
      line_id INT AUTO_INCREMENT PRIMARY KEY,
      line_code VARCHAR(20) NOT NULL,
      direction ENUM('out', 'back') NOT NULL,
      line_name VARCHAR(255) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE(line_code, direction)
    )`;
    await db.execute(sql);
  },

  create: async (db, data) => {
    const sql = `INSERT INTO line (line_code, direction, line_name, is_active) VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      data.line_code,
      data.direction,
      data.line_name,
      data.is_active === undefined ? true : !!data.is_active
    ]);
    return result.insertId;
  },

  getById: async (db, line_id) => {
    const sql = `SELECT * FROM line WHERE line_id = ?`;
    const [rows] = await db.execute(sql, [line_id]);
    return rows[0];
  },

  update: async (db, line_id, data) => {
    const sql = `UPDATE line SET line_code=?, direction=?, line_name=?, is_active=? WHERE line_id=?`;
    const [result] = await db.execute(sql, [
      data.line_code,
      data.direction,
      data.line_name,
      data.is_active === undefined ? true : !!data.is_active,
      line_id
    ]);
    return result.affectedRows > 0;
  },

  delete: async (db, line_id) => {
    const sql = `DELETE FROM line WHERE line_id = ?`;
    const [result] = await db.execute(sql, [line_id]);
    return result.affectedRows > 0;
  },

  getAll: async (db) => {
    const sql = `SELECT * FROM line`;
    const [rows] = await db.execute(sql);
    return rows;
  }
};
