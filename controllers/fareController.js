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
