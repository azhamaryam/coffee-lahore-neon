const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - everything the logged-in user needs for their private dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const triedRows = await sql`
      SELECT t.created_at AS "triedAt",
        c.id, c.name, c.area, c.description, c.image_url AS "imageUrl", c.created_at AS "createdAt",
        r.ambiance, r.service, r.food, r.drinks
      FROM tried t
      JOIN cafes c ON c.id = t.cafe_id
      LEFT JOIN ratings r ON r.cafe_id = t.cafe_id AND r.user_id = t.user_id
      WHERE t.user_id = ${req.user.id}
      ORDER BY t.created_at DESC
    `;

    const triedCafes = triedRows.map(row => {
      const vals = [row.ambiance, row.service, row.food, row.drinks].filter(v => typeof v === 'number');
      const myRating = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
      return {
        id: row.id, name: row.name, area: row.area, description: row.description,
        imageUrl: row.imageUrl, createdAt: row.createdAt, triedAt: row.triedAt, myRating
      };
    });

    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM comments WHERE user_id = ${req.user.id}`;

    res.json({ triedCafes, myCommentsCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your dashboard right now.' });
  }
});

// POST /api/dashboard/tried/:cafeId - mark a cafe as tried
router.post('/tried/:cafeId', requireAuth, async (req, res) => {
  try {
    const cafeRows = await sql`SELECT id FROM cafes WHERE id = ${req.params.cafeId}`;
    if (!cafeRows.length) return res.status(404).json({ error: 'This cafe could not be found.' });

    const existing = await sql`SELECT id FROM tried WHERE cafe_id = ${req.params.cafeId} AND user_id = ${req.user.id}`;
    if (existing.length) return res.json({ success: true, already: true });

    await sql`
      INSERT INTO tried (id, cafe_id, user_id, created_at)
      VALUES (${uuidv4()}, ${req.params.cafeId}, ${req.user.id}, now())
    `;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update your dashboard right now.' });
  }
});

// DELETE /api/dashboard/tried/:cafeId - unmark
router.delete('/tried/:cafeId', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM tried WHERE cafe_id = ${req.params.cafeId} AND user_id = ${req.user.id}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update your dashboard right now.' });
  }
});

module.exports = router;
