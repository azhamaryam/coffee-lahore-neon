const jwt = require('jsonwebtoken');
const sql = require('../db');

const SECRET = process.env.JWT_SECRET || 'devsecret_change_me';

async function findUserById(id) {
  const rows = await sql`
    SELECT id, name, email, password, is_admin AS "isAdmin", is_creator AS "isCreator", created_at AS "createdAt"
    FROM users WHERE id = ${id}
  `;
  return rows[0] || null;
}

// Attaches req.user if a valid token is present, but never blocks the request.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      const payload = jwt.verify(token, SECRET);
      const user = await findUserById(payload.id);
      if (user) req.user = user;
    } catch (e) {
      // invalid/expired token — proceed unauthenticated rather than blocking
    }
  }
  next();
}

// Blocks the request unless a valid token is present.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, SECRET);
    const user = await findUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

// Must be used after requireAuth.
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'This action is available to admins only.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth, SECRET };
