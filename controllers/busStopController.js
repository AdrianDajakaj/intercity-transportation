// BusStop controller for CRUD operations
const db = require('../config/db');
const busStopModel = require('../models/busStopModel');
const addressModel = require('../models/addressModel');

module.exports = {
  // Create a new bus stop
  create: async (req, res) => {
    try {
      const id = await busStopModel.create(db, req.body);
      res.status(201).json({ stop_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create bus stop' });
    }
  },

  // Get all bus stops
  getAll: async (req, res) => {
    try {
      const stops = await busStopModel.getAll(db);
      res.json(stops);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch bus stops' });
    }
  },

  // Get bus stop by id
  getById: async (req, res) => {
    try {
      const stop = await busStopModel.getById(db, req.params.id);
      if (!stop) return res.status(404).json({ error: 'Not found' });
      res.json(stop);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch bus stop' });
    }
  },

  // Update bus stop by id
  update: async (req, res) => {
    try {
      const updated = await busStopModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update bus stop' });
    }
  },

  // Delete bus stop by id
  delete: async (req, res) => {
    try {
      const deleted = await busStopModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete bus stop' });
    }
  },

  // Get address for a specific bus stop
  getAddress: async (req, res) => {
    try {
      const stop = await busStopModel.getById(db, req.params.id);
      if (!stop || !stop.address_id) return res.status(404).json({ error: 'Address not found for this bus stop' });
      const address = await addressModel.getById(db, stop.address_id);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.json(address);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch address for bus stop' });
    }
  },

  // Update address for a specific bus stop
  updateAddress: async (req, res) => {
    try {
      const stop = await busStopModel.getById(db, req.params.id);
      if (!stop) return res.status(404).json({ error: 'Bus stop not found' });
      if (!stop.address_id) return res.status(404).json({ error: 'Bus stop has no address to update' });
      const updated = await addressModel.update(db, stop.address_id, req.body);
      if (!updated) return res.status(404).json({ error: 'Address not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update address for bus stop' });
    }
  }
};
