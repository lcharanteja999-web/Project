const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// GET all items (Public)
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST new item (Protected)
router.post('/', auth, async (req, res) => {
  try {
    const newItem = new Item({ ...req.body, reportedBy: req.user.id });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;