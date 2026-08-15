const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const { requireAuth } = require('../middleware/auth');
const { CATEGORIES, CATEGORY_LABELS } = require('../utils/helpers');

const router = express.Router();

// POST /api/cafes/:id/rate - rates a cafe across all categories at once
// body: { ambiance, service, food, drinks } each 1-5
router.post('/cafes/:id/rate', requireAuth, async (req, res) => {
  try {
    const values = {};
    for (const cat of CATEGORIES) {
      const v = Number(req.body[cat]);
      if (!v || v < 1 || v > 5) {
        return res.status(400).json({ error: `Please give a rating from 1 to 5 for ${CATEGORY_LABELS[cat]}.` });
      }
      values[cat] = v;
    }

    const cafeRows = await sql`SELECT id FROM cafes WHERE id = ${req.params.id}`;
    if (!cafeRows.length) return res.status(404).json({ error: 'This cafe could not be found.' });

    await sql`
      INSERT INTO ratings (id, cafe_id, user_id, ambiance, service, food, drinks, created_at)
      VALUES (${uuidv4()}, ${req.params.id}, ${req.user.id}, ${values.ambiance}, ${values.service}, ${values.food}, ${values.drinks}, now())
      ON CONFLICT (cafe_id, user_id)
      DO UPDATE SET ambiance = EXCLUDED.ambiance, service = EXCLUDED.service, food = EXCLUDED.food,
        drinks = EXCLUDED.drinks, created_at = now()
    `;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save your rating right now.' });
  }
});

// POST /api/drinks/:id/rate - a simple single-value rating for an individual drink
router.post('/drinks/:id/rate', requireAuth, async (req, res) => {
  try {
    const r = Number(req.body.rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

    const drinkRows = await sql`SELECT id FROM drinks WHERE id = ${req.params.id}`;
    if (!drinkRows.length) return res.status(404).json({ error: 'This drink could not be found.' });

    await sql`
      INSERT INTO drink_ratings (id, drink_id, user_id, rating, created_at)
      VALUES (${uuidv4()}, ${req.params.id}, ${req.user.id}, ${r}, now())
      ON CONFLICT (drink_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating, created_at = now()
    `;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save your rating right now.' });
  }
});

module.exports = router;
