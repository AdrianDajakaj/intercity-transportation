// Passenger controller for CRUD operations
const db = require('../config/db');
const passengerModel = require('../models/passengerModel');
const addressModel = require('../models/addressModel');

module.exports = {
  // Create a new passenger
  create: async (req, res) => {
    try {
      const id = await passengerModel.create(db, req.body);
      res.status(201).json({ passenger_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create passenger' });
    }
  },

  // Get all passengers
  getAll: async (req, res) => {
    try {
      const passengers = await passengerModel.getAll(db);
      res.json(passengers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch passengers' });
    }
  },

  // Get passenger by id
  getById: async (req, res) => {
    try {
      const passenger = await passengerModel.getById(db, req.params.id);
      if (!passenger) return res.status(404).json({ error: 'Not found' });
      res.json(passenger);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch passenger' });
    }
  },

  // Update passenger by id
  update: async (req, res) => {
    try {
      const updated = await passengerModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update passenger' });
    }
  },

  // Delete passenger by id
  delete: async (req, res) => {
    try {
      const deleted = await passengerModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete passenger' });
    }
  },

  // Get address for a specific passenger
  getAddress: async (req, res) => {
    try {
      const passenger = await passengerModel.getById(db, req.params.id);
      if (!passenger || !passenger.address_id) return res.status(404).json({ error: 'Address not found for this passenger' });
      const address = await addressModel.getById(db, passenger.address_id);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.json(address);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch address for passenger' });
    }
  },

  // Update address for a specific passenger
  updateAddress: async (req, res) => {
    try {
      const passenger = await passengerModel.getById(db, req.params.id);
      if (!passenger) return res.status(404).json({ error: 'Passenger not found' });
      if (!passenger.address_id) return res.status(404).json({ error: 'Passenger has no address to update' });
      const updated = await addressModel.update(db, passenger.address_id, req.body);
      if (!updated) return res.status(404).json({ error: 'Address not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update address for passenger' });
    }
  }
};
