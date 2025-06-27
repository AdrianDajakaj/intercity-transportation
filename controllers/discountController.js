// Discount controller for CRUD operations
const db = require('../config/db');
const discountModel = require('../models/discountModel');

module.exports = {
  // Create a new discount
  create: async (req, res) => {
    try {
      const id = await discountModel.create(db, req.body);
      res.status(201).json({ discount_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create discount' });
    }
  },

  // Get all discounts
  getAll: async (req, res) => {
    try {
      const discounts = await discountModel.getAll(db);
      res.json(discounts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch discounts' });
    }
  },

  // Get discount by id
  getById: async (req, res) => {
    try {
      const discount = await discountModel.getById(db, req.params.id);
      if (!discount) return res.status(404).json({ error: 'Not found' });
      res.json(discount);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch discount' });
    }
  },

  // Update discount by id
  update: async (req, res) => {
    try {
      const updated = await discountModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update discount' });
    }
  },

  // Delete discount by id
  delete: async (req, res) => {
    try {
      const deleted = await discountModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete discount' });
    }
  }
};
