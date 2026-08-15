const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const { requireAuth } = require('../middleware/auth');
const { wordCount } = require('../utils/helpers');

const router = express.Router();

// GET /api/cafes/:id/comments - public
router.get('/cafes/:id/comments', async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, cafe_id AS "cafeId", user_id AS "userId", user_name AS "userName",
        is_creator AS "isCreator", text, created_at AS "createdAt"
      FROM comments WHERE cafe_id = ${req.params.id} ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load reviews right now.' });
  }
});

// POST /api/cafes/:id/comments - requires login
router.post('/cafes/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Your comment cannot be empty.' });
    if (wordCount(text) > 200) return res.status(400).json({ error: 'Comments cannot be more than 200 words.' });

    const cafeRows = await sql`SELECT id FROM cafes WHERE id = ${req.params.id}`;
    if (!cafeRows.length) return res.status(404).json({ error: 'This cafe could not be found.' });

    const [comment] = await sql`
      INSERT INTO comments (id, cafe_id, user_id, user_name, is_creator, text, created_at)
      VALUES (${uuidv4()}, ${req.params.id}, ${req.user.id}, ${req.user.name}, ${!!req.user.isCreator}, ${text.trim()}, now())
      RETURNING id, cafe_id AS "cafeId", user_id AS "userId", user_name AS "userName",
        is_creator AS "isCreator", text, created_at AS "createdAt"
    `;
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not post your review right now.' });
  }
});

module.exports = router;
