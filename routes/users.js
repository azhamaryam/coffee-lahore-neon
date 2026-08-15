const express = require('express');
const sql = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - admin only, used to manage Creator status
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, name, email, is_admin AS "isAdmin", is_creator AS "isCreator", created_at AS "createdAt"
      FROM users ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load users right now.' });
  }
});

// PATCH /api/users/:id/creator - admin only, marks/unmarks a user as a Creator
// so their reviews are featured in the Creators' Reviews section.
router.patch('/:id/creator', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT id, is_admin AS "isAdmin" FROM users WHERE id = ${req.params.id}`;
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'This user could not be found.' });
    if (user.isAdmin) return res.status(400).json({ error: 'Admin accounts do not need Creator status.' });

    const isCreator = !!req.body.isCreator;
    await sql`UPDATE users SET is_creator = ${isCreator} WHERE id = ${req.params.id}`;
    res.json({ success: true, isCreator });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update this user right now.' });
  }
});

module.exports = router;
