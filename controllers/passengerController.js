const db = require('../config/db');
const passengerModel = require('../models/passengerModel');
const addressModel = require('../models/addressModel');
const bcrypt = require('bcrypt');

module.exports = {
  create: async (req, res) => {
    try {
      let data = req.body;
      if (data.password) {
        data.password_hash = await bcrypt.hash(data.password, 10);
        delete data.password;
      }
      const id = await passengerModel.create(db, data);
      res.status(201).json({ passenger_id: id });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Email already registered' });
      } else {
        res.status(500).json({ error: 'Failed to create passenger' });
      }
    }
  },

  getAll: async (req, res) => {
    try {
      const passengers = await passengerModel.getAll(db);
      res.json(passengers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch passengers' });
    }
  },

  getById: async (req, res) => {
    try {
      const passenger = await passengerModel.getById(db, req.params.id);
      if (!passenger) return res.status(404).json({ error: 'Not found' });
      res.json(passenger);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch passenger' });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await passengerModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update passenger' });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await passengerModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete passenger' });
    }
  },

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
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const passenger = await passengerModel.getByEmail(db, email);
      if (!passenger) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const match = await bcrypt.compare(password, passenger.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      req.session.passenger = {
        passenger_id: passenger.passenger_id,
        name: passenger.passenger_name,
        surname: passenger.passenger_surname,
        email: passenger.email
      };
      res.json({ success: true, passenger_id: passenger.passenger_id, name: passenger.passenger_name, surname: passenger.passenger_surname, email: passenger.email });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  logout: (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  }
};
