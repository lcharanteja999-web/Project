const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// POST a claim (Protected)
router.post('/', auth, async (req, res) => {
  try {
    const claim = new Claim({
      itemId: req.body.itemId,
      claimantId: req.user.id,
      message: req.body.message
    });
    await claim.save();
    res.status(201).json(claim);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my claims (Protected)
router.get('/my', auth, async (req, res) => {
  try {
    const claims = await Claim.find({ claimantId: req.user.id }).populate('itemId');
    res.json(claims);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH approve/reject claim (Protected - Admin/Owner)
router.patch('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    claim.status = req.body.status; // 'approved' or 'rejected'
    await claim.save();

    // If approved, update item status
    if (req.body.status === 'approved') {
      await Item.findByIdAndUpdate(claim.itemId, { status: 'claimed' });
    }

    res.json(claim);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;