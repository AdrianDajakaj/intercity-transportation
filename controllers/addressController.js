// Address controller for CRUD operations
const db = require('../config/db');
const addressModel = require('../models/addressModel');

module.exports = {
  // Create a new address
  create: async (req, res) => {
    try {
      const id = await addressModel.create(db, req.body);
      res.status(201).json({ address_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create address' });
    }
  },

  // Get all addresses
  getAll: async (req, res) => {
    try {
      const addresses = await addressModel.getAll(db);
      res.json(addresses);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  },

  // Get address by id
  getById: async (req, res) => {
    try {
      const address = await addressModel.getById(db, req.params.id);
      if (!address) return res.status(404).json({ error: 'Not found' });
      res.json(address);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch address' });
    }
  },

  // Update address by id
  update: async (req, res) => {
    try {
      const updated = await addressModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update address' });
    }
  },

  // Delete address by id
  delete: async (req, res) => {
    try {
      const deleted = await addressModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete address' });
    }
  }
};
