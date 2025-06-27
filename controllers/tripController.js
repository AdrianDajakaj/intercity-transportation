// Trip controller for CRUD operations
const db = require('../config/db');
const tripModel = require('../models/tripModel');
const lineModel = require('../models/lineModel');
const busModel = require('../models/busModel');

module.exports = {
  // Create a new trip
  create: async (req, res) => {
    try {
      const id = await tripModel.create(db, req.body);
      res.status(201).json({ trip_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create trip' });
    }
  },

  // Get all trips
  getAll: async (req, res) => {
    try {
      const trips = await tripModel.getAll(db);
      // Format trip_date as YYYY-MM-DD
      const formatted = trips.map(trip => ({
        ...trip,
        trip_date: trip.trip_date instanceof Date ? trip.trip_date.toISOString().slice(0, 10) : trip.trip_date
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  },

  // Get trip by id
  getById: async (req, res) => {
    try {
      const trip = await tripModel.getById(db, req.params.id);
      if (!trip) return res.status(404).json({ error: 'Not found' });
      // Format trip_date as YYYY-MM-DD
      trip.trip_date = trip.trip_date instanceof Date ? trip.trip_date.toISOString().slice(0, 10) : trip.trip_date;
      res.json(trip);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  },

  // Update trip by id
  update: async (req, res) => {
    try {
      const updated = await tripModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update trip' });
    }
  },

  // Delete trip by id
  delete: async (req, res) => {
    try {
      const deleted = await tripModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete trip' });
    }
  },

  // Get line for a specific trip
  getLine: async (req, res) => {
    try {
      const trip = await tripModel.getById(db, req.params.id);
      if (!trip || !trip.line_id) return res.status(404).json({ error: 'Line not found for this trip' });
      const line = await lineModel.getById(db, trip.line_id);
      if (!line) return res.status(404).json({ error: 'Line not found' });
      res.json(line);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line for trip' });
    }
  },

  // Get bus for a specific trip
  getBus: async (req, res) => {
    try {
      const trip = await tripModel.getById(db, req.params.id);
      if (!trip || !trip.bus_id) return res.status(404).json({ error: 'Bus not found for this trip' });
      const bus = await busModel.getById(db, trip.bus_id);
      if (!bus) return res.status(404).json({ error: 'Bus not found' });
      res.json(bus);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch bus for trip' });
    }
  },

  // Get all stops and departure times for a specific trip (by trip_id)
  getTripStops: async (req, res) => {
    try {
      const trip = await tripModel.getById(db, req.params.id);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      const sql = `SELECT 
        ls.sequence,
        bs.stop_name,
        tt.departure_time
      FROM line_stop ls
      JOIN bus_stop bs ON bs.stop_id = ls.stop_id
      JOIN timetable tt ON tt.line_stop_id = ls.line_stop_id
      WHERE 
        ls.line_id = ?
        AND tt.run_number = ?
      ORDER BY ls.sequence`;
      const [rows] = await db.execute(sql, [trip.line_id, trip.run_number]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trip stops' });
    }
  }
};
