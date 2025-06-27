// Bus controller for CRUD operations
const db = require('../config/db');
const busModel = require('../models/busModel');

module.exports = {
  // Create a new bus
  create: async (req, res) => {
    try {
      const id = await busModel.create(db, req.body);
      res.status(201).json({ bus_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create bus' });
    }
  },

  // Get all buses
  getAll: async (req, res) => {
    try {
      const buses = await busModel.getAll(db);
      res.json(buses);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch buses' });
    }
  },

  // Get bus by id
  getById: async (req, res) => {
    try {
      const bus = await busModel.getById(db, req.params.id);
      if (!bus) return res.status(404).json({ error: 'Not found' });
      res.json(bus);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch bus' });
    }
  },

  // Update bus by id
  update: async (req, res) => {
    try {
      const updated = await busModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update bus' });
    }
  },

  // Delete bus by id
  delete: async (req, res) => {
    try {
      const deleted = await busModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete bus' });
    }
  }
};
