const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/drinks/top-month?limit=10 - highest-rated drinks by ratings given this calendar month
router.get('/top-month', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const rows = await sql`
      SELECT dr.id, dr.cafe_id AS "cafeId", dr.name, dr.description, dr.price, dr.image_url AS "imageUrl",
        c.name AS "cafeName",
        COALESCE(ROUND(AVG(drt.rating)::numeric, 1), 0) AS "avgRating",
        COUNT(drt.id)::int AS "ratingCount"
      FROM drinks dr
      JOIN cafes c ON c.id = dr.cafe_id
      LEFT JOIN drink_ratings drt
        ON drt.drink_id = dr.id
        AND drt.created_at >= date_trunc('month', now())
        AND drt.created_at < date_trunc('month', now()) + interval '1 month'
      GROUP BY dr.id, c.name
      HAVING COUNT(drt.id) > 0
      ORDER BY "avgRating" DESC, "ratingCount" DESC
      LIMIT ${limit}
    `;
    res.json(rows.map(r => ({ ...r, avgRating: Number(r.avgRating) || 0 })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load top drinks right now.' });
  }
});

// GET /api/drinks/all - used by the admin panel to list every drink
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await sql`
      SELECT dr.id, dr.cafe_id AS "cafeId", dr.name, dr.description, dr.price, dr.image_url AS "imageUrl",
        dr.created_at AS "createdAt", c.name AS "cafeName"
      FROM drinks dr
      JOIN cafes c ON c.id = dr.cafe_id
      ORDER BY dr.created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load drinks right now.' });
  }
});

// POST /api/drinks - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { cafeId, name, description, price, imageUrl } = req.body;
    if (!cafeId || !name || !name.trim()) {
      return res.status(400).json({ error: 'A cafe and a drink name are required.' });
    }
    const cafeRows = await sql`SELECT id FROM cafes WHERE id = ${cafeId}`;
    if (!cafeRows.length) return res.status(400).json({ error: 'The selected cafe does not exist.' });

    const [drink] = await sql`
      INSERT INTO drinks (id, cafe_id, name, description, price, image_url, created_at)
      VALUES (${uuidv4()}, ${cafeId}, ${name.trim()}, ${(description || '').trim()}, ${(price || '').trim()}, ${(imageUrl || '').trim()}, now())
      RETURNING id, cafe_id AS "cafeId", name, description, price, image_url AS "imageUrl", created_at AS "createdAt"
    `;
    res.status(201).json(drink);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add this drink right now.' });
  }
});

// DELETE /api/drinks/:id - admin only (ON DELETE CASCADE removes its ratings)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM drinks WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete this drink right now.' });
  }
});

module.exports = router;
