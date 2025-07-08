const db = require('../config/db');
const timetableModel = require('../models/timetableModel');
const lineStopModel = require('../models/lineStopModel');
const lineModel = require('../models/lineModel');
const busStopModel = require('../models/busStopModel');

module.exports = {
  create: async (req, res) => {
    try {
      const id = await timetableModel.create(db, req.body);
      res.status(201).json({ schedule_id: id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create timetable entry' });
    }
  },

  getAll: async (req, res) => {
    try {
      const entries = await timetableModel.getAll(db);
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch timetable entries' });
    }
  },

  getById: async (req, res) => {
    try {
      const entry = await timetableModel.getById(db, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found' });
      res.json(entry);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch timetable entry' });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await timetableModel.update(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update timetable entry' });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await timetableModel.delete(db, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete timetable entry' });
    }
  },

  getLineAndBusStop: async (req, res) => {
    try {
      const timetable = await timetableModel.getById(db, req.params.id);
      if (!timetable || !timetable.line_stop_id) return res.status(404).json({ error: 'Line stop not found for this timetable entry' });
      const lineStop = await lineStopModel.getById(db, timetable.line_stop_id);
      if (!lineStop) return res.status(404).json({ error: 'Line stop not found' });
      const line = lineStop.line_id ? await lineModel.getById(db, lineStop.line_id) : null;
      const busStop = lineStop.stop_id ? await busStopModel.getById(db, lineStop.stop_id) : null;
      if (!line || !busStop) return res.status(404).json({ error: 'Line or bus stop not found' });
      res.json({ line, busStop });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch line and bus stop for timetable entry' });
    }
  }
};
