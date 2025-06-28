const Fare = require('../models/fareModel');

exports.create = async (req, res) => {
  try {
    const fare = await Fare.create(req.body);
    res.status(201).json(fare);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const fares = await Fare.getAll();
    res.json(fares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const fare = await Fare.getById(req.params.id);
    if (!fare) return res.status(404).json({ error: 'Fare not found' });
    res.json(fare);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const fare = await Fare.update(req.params.id, req.body);
    res.json(fare);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Fare.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get total price for a line between start and end stops (line_id as path param)
exports.getTotalPrice = async (req, res) => {
  let { start_line_stop_id, end_line_stop_id } = req.query;
  let { line_id } = req.params;
  if (!line_id || !start_line_stop_id || !end_line_stop_id) {
    return res.status(400).json({ error: 'Missing line_id, start_line_stop_id, or end_line_stop_id parameter' });
  }
  // Ensure all IDs are integers for DB queries
  line_id = parseInt(line_id);
  start_line_stop_id = parseInt(start_line_stop_id);
  end_line_stop_id = parseInt(end_line_stop_id);
  try {
    const result = await Fare.getTotalPrice(line_id, start_line_stop_id, end_line_stop_id);
    if (result.total_price === null) return res.status(404).json({ error: 'Fare not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get line for a specific fare
exports.getLine = async (req, res) => {
  try {
    const fare_id = req.params.id;
    const line = await Fare.getLineForFare(fare_id);
    if (!line) return res.status(404).json({ error: 'Line not found for this fare' });
    res.json(line);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get start line stop for a specific fare
exports.getStartLineStop = async (req, res) => {
  try {
    const fare_id = req.params.id;
    const stop = await Fare.getStartLineStopForFare(fare_id);
    if (!stop) return res.status(404).json({ error: 'Start line stop not found for this fare' });
    res.json(stop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get end line stop for a specific fare
exports.getEndLineStop = async (req, res) => {
  try {
    const fare_id = req.params.id;
    const stop = await Fare.getEndLineStopForFare(fare_id);
    if (!stop) return res.status(404).json({ error: 'End line stop not found for this fare' });
    res.json(stop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
