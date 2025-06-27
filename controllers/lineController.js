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
  }
};
