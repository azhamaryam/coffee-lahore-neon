const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const { requireAuth, SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim() || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password should be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existing.length) {
      return res.status(400).json({ error: 'An account with this email already exists. Try logging in instead.' });
    }

    const id = uuidv4();
    const hashed = bcrypt.hashSync(password, 10);
    const [user] = await sql`
      INSERT INTO users (id, name, email, password, is_admin, is_creator, created_at)
      VALUES (${id}, ${name.trim()}, ${normalizedEmail}, ${hashed}, false, false, now())
      RETURNING id, name, email, is_admin AS "isAdmin", is_creator AS "isCreator"
    `;

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating your account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const rows = await sql`
      SELECT id, name, email, password, is_admin AS "isAdmin", is_creator AS "isCreator"
      FROM users WHERE email = ${normalizedEmail}
    `;
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password || '', user.password)) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, isCreator: !!user.isCreator }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong logging you in. Please try again.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, isAdmin, isCreator } = req.user;
  res.json({ user: { id, name, email, isAdmin, isCreator: !!isCreator } });
});

module.exports = router;
