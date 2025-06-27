// LineStop controller for CRUD operations
const db = require('../config/db');
const lineStopModel = require('../models/lineStopModel');
const lineModel = require('../models/lineModel');
const busStopModel = require('../models/busStopModel');

module.exports = {
  // Create a new line_stop
  create: async (req, res) => {
    try {
      const id = await lineStopModel.create(db, req.body);
      res.status(201).json({ line_stop_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create line_stop' });
    }
  },

  // Get all line_stops
  getAll: async (req, res) => {
    try {
      const stops = await lineStopModel.getAll(db);
      res.json(stops);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line_stops' });
    }
  },

  // Get line_stop by id
  getById: async (req, res) => {
    try {
      const stop = await lineStopModel.getById(db, req.params.id);
      if (!stop) return res.status(404).json({ error: 'Not found' });
      res.json(stop);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line_stop' });
    }
  },

  // Update line_stop by id
  update: async (req, res) => {
    try {
      const updated = await lineStopModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update line_stop' });
    }
  },

  // Delete line_stop by id
  delete: async (req, res) => {
    try {
      const deleted = await lineStopModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete line_stop' });
    }
  },

  // Get line for a specific line stop
  getLine: async (req, res) => {
    try {
      const lineStop = await lineStopModel.getById(db, req.params.id);
      if (!lineStop || !lineStop.line_id) return res.status(404).json({ error: 'Line not found for this line stop' });
      const line = await lineModel.getById(db, lineStop.line_id);
      if (!line) return res.status(404).json({ error: 'Line not found' });
      res.json(line);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line for line stop' });
    }
  },

  // Get bus stop for a specific line stop
  getBusStop: async (req, res) => {
    try {
      const lineStop = await lineStopModel.getById(db, req.params.id);
      if (!lineStop || !lineStop.stop_id) return res.status(404).json({ error: 'Bus stop not found for this line stop' });
      const stop = await busStopModel.getById(db, lineStop.stop_id);
      if (!stop) return res.status(404).json({ error: 'Bus stop not found' });
      res.json(stop);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch bus stop for line stop' });
    }
  },

  // Get line and bus stop for a specific line stop
  getLineAndBusStop: async (req, res) => {
    try {
      const lineStop = await lineStopModel.getById(db, req.params.id);
      if (!lineStop) return res.status(404).json({ error: 'Line stop not found' });
      const line = lineStop.line_id ? await lineModel.getById(db, lineStop.line_id) : null;
      const busStop = lineStop.stop_id ? await busStopModel.getById(db, lineStop.stop_id) : null;
      if (!line || !busStop) return res.status(404).json({ error: 'Line or bus stop not found' });
      res.json({ line, busStop });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line and bus stop for line stop' });
    }
  }
};
