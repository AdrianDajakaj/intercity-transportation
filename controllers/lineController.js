// Line controller for CRUD operations
const db = require('../config/db');
const lineModel = require('../models/lineModel');

module.exports = {
  // Create a new line
  create: async (req, res) => {
    try {
      const id = await lineModel.create(db, req.body);
      res.status(201).json({ line_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create line' });
    }
  },

  // Get all lines
  getAll: async (req, res) => {
    try {
      const lines = await lineModel.getAll(db);
      res.json(lines);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch lines' });
    }
  },

  // Get line by id
  getById: async (req, res) => {
    try {
      const line = await lineModel.getById(db, req.params.id);
      if (!line) return res.status(404).json({ error: 'Not found' });
      res.json(line);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line' });
    }
  },

  // Update line by id
  update: async (req, res) => {
    try {
      const updated = await lineModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update line' });
    }
  },

  // Delete line by id
  delete: async (req, res) => {
    try {
      const deleted = await lineModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete line' });
    }
  },

  // Get all stops for a specific line_code and direction
  getStopsForLineCodeAndDirection: async (req, res) => {
    try {
      const { line_code, direction } = req.params;
      const sql = `SELECT ls.line_stop_id, ls.sequence, bs.stop_name
        FROM line l
        JOIN line_stop ls ON l.line_id = ls.line_id
        JOIN bus_stop bs ON ls.stop_id = bs.stop_id
        WHERE l.line_code = ? AND l.direction = ?
        ORDER BY ls.sequence`;
      const [rows] = await db.execute(sql, [line_code, direction]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stops for line_code and direction' });
    }
  },

  // Get timetable for a specific line_code and direction
  getTimetableForLineCodeAndDirection: async (req, res) => {
    try {
      const { line_code, direction } = req.params;
      const sql = `SELECT 
        ls.sequence,
        bs.stop_name,
        tt.departure_time,
        tt.run_number,
        tt.day_mask,
        tt.offset_days
      FROM line l
      JOIN line_stop ls ON l.line_id = ls.line_id
      JOIN bus_stop bs ON ls.stop_id = bs.stop_id
      JOIN timetable tt ON tt.line_stop_id = ls.line_stop_id
      WHERE l.line_code = ? AND l.direction = ?
      ORDER BY ls.sequence, tt.run_number, tt.departure_time`;
      const [rows] = await db.execute(sql, [line_code, direction]);
      // Group by stop (sequence, stop_name)
      const grouped = {};
      for (const row of rows) {
        const key = `${row.sequence}|${row.stop_name}`;
        if (!grouped[key]) grouped[key] = { sequence: row.sequence, stop_name: row.stop_name, departures: [] };
        grouped[key].departures.push({
          departure_time: row.departure_time,
          run_number: row.run_number,
          day_mask: row.day_mask,
          offset_days: row.offset_days
        });
      }
      res.json(Object.values(grouped));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch timetable for line_code and direction' });
    }
  }
};
