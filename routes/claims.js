const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const Claim = require('../models/Claim');

// 1. POST a new claim
router.post('/', auth, async (req, res) => {
  try {
    const claim = new Claim({
      itemId: req.body.itemId,
      claimantId: req.user.id,
      message: req.body.message,
      proof: req.body.proof
    });
    await claim.save();
    res.status(201).json(claim);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. GET claims received by the owner
router.get('/received', auth, async (req, res) => {
  try {
    const myItems = await Item.find({ reportedBy: req.user.id });
    const myItemIds = myItems.map(item => item._id);
    const claims = await Claim.find({ itemId: { $in: myItemIds } })
      .populate('claimantId', 'name email')
      .populate('itemId', 'title');
    res.json(claims);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. GET ALL CLAIMS (Admin only)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }
    const claims = await Claim.find()
      .populate('claimantId', 'name email')
      .populate('itemId', 'title');
    res.json(claims);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. PATCH approve/reject claim
router.patch('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    claim.status = req.body.status;
    await claim.save();

    if (req.body.status === 'approved') {
      await Item.findByIdAndUpdate(claim.itemId, { status: 'claimed' });
    }
    res.json(claim);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// MUST BE AT THE BOTTOM
module.exports = router;