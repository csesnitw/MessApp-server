const express = require("express");
const MessCard = require("../models/messCard.js");
const apiKeyAuth = require("../middleware/apikeyAuth"); 

const router = express.Router();


router.use(apiKeyAuth);

router.get('/:rollNo', async (req, res) => {
  try {
    const rollNo = req.params.rollNo.trim();

    const card = await MessCard.findOne(
      { rollNo },
      'rollNo name image messName -_id' 
    ).lean();
    if (!card) {
      return res.status(404).json({ error: 'Mess card not found' });
    }

    return res.json(card); 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


//POST
router.post("/", async (req, res) => {
  try {
    const newCard = new MessCard(req.body);
    await newCard.save();
    res.status(201).json(newCard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
