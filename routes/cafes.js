const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { CATEGORIES, categoryAverages, overallFromCategories } = require('../utils/helpers');

const router = express.Router();

// Aggregate SELECT reused by both the browse list and the top-10 endpoint,
// computing each category average and rating count directly in SQL.
const STATS_SELECT = `
  SELECT c.id, c.name, c.area, c.description, c.image_url AS "imageUrl", c.created_at AS "createdAt",
    COALESCE(ROUND(AVG(r.ambiance)::numeric, 1), 0) AS "ambianceAvg",
    COALESCE(ROUND(AVG(r.service)::numeric, 1), 0) AS "serviceAvg",
    COALESCE(ROUND(AVG(r.food)::numeric, 1), 0) AS "foodAvg",
    COALESCE(ROUND(AVG(r.drinks)::numeric, 1), 0) AS "drinksAvg",
    COUNT(r.id)::int AS "ratingCount",
    (SELECT COUNT(*)::int FROM drinks d WHERE d.cafe_id = c.id) AS "drinkCount"
  FROM cafes c
  LEFT JOIN ratings r ON r.cafe_id = c.id
`;

function shapeCafeRow(row) {
  const categories = {
    ambiance: Number(row.ambianceAvg) || 0,
    service: Number(row.serviceAvg) || 0,
    food: Number(row.foodAvg) || 0,
    drinks: Number(row.drinksAvg) || 0
  };
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    description: row.description,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
    categories,
    avgRating: overallFromCategories(categories),
    ratingCount: row.ratingCount,
    drinkCount: row.drinkCount
  };
}

async function listCafesWithStats({ area, q } = {}) {
  const conditions = [];
  const params = [];
  if (area) { params.push(area); conditions.push(`LOWER(c.area) = LOWER($${params.length})`); }
  if (q) { params.push(`%${q}%`); conditions.push(`LOWER(c.name) LIKE LOWER($${params.length})`); }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const text = `${STATS_SELECT} ${whereClause} GROUP BY c.id ORDER BY c.name ASC`;
  const rows = await sql.query(text, params);
  return rows.map(shapeCafeRow);
}

// GET /api/cafes?area=Gulberg&q=coffee
router.get('/', async (req, res) => {
  try {
    const { area, q } = req.query;
    const cafes = await listCafesWithStats({ area, q });
    cafes.sort((a, b) => b.avgRating - a.avgRating);
    res.json(cafes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load cafes right now.' });
  }
});

// GET /api/cafes/top?limit=10&category=service
// Without `category`, ranks by overall rating. With a valid category, ranks
// by that category's average instead, so people can see e.g. the top cafes
// for Service specifically.
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = CATEGORIES.includes(req.query.category) ? req.query.category : null;

    let cafes = await listCafesWithStats();

    if (category) {
      cafes = cafes
        .filter(c => c.categories[category] > 0)
        .map(c => ({ ...c, avgRating: c.categories[category] }))
        .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);
    } else {
      cafes = cafes
        .filter(c => c.ratingCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);
    }

    res.json(cafes.slice(0, limit));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load top cafes right now.' });
  }
});

// GET /api/cafes/areas - distinct areas for the filter dropdown
router.get('/areas', async (req, res) => {
  try {
    const rows = await sql`SELECT DISTINCT area FROM cafes ORDER BY area ASC`;
    res.json(rows.map(r => r.area));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load areas right now.' });
  }
});

// GET /api/cafes/:id
router.get('/:id', async (req, res) => {
  try {
    const cafeRows = await sql`
      SELECT id, name, area, description, image_url AS "imageUrl", created_at AS "createdAt"
      FROM cafes WHERE id = ${req.params.id}
    `;
    const cafe = cafeRows[0];
    if (!cafe) return res.status(404).json({ error: 'This cafe could not be found.' });

    const ratingRows = await sql`
      SELECT ambiance, service, food, drinks FROM ratings WHERE cafe_id = ${req.params.id}
    `;
    const categories = categoryAverages(ratingRows);

    const drinkRows = await sql`
      SELECT dr.id, dr.name, dr.description, dr.price, dr.image_url AS "imageUrl", dr.created_at AS "createdAt",
        COALESCE(ROUND(AVG(drt.rating)::numeric, 1), 0) AS "avgRating",
        COUNT(drt.id)::int AS "ratingCount"
      FROM drinks dr
      LEFT JOIN drink_ratings drt ON drt.drink_id = dr.id
      WHERE dr.cafe_id = ${req.params.id}
      GROUP BY dr.id
      ORDER BY dr.created_at ASC
    `;
    const drinks = drinkRows.map(d => ({ ...d, avgRating: Number(d.avgRating) || 0 }));

    res.json({
      ...cafe,
      categories,
      avgRating: overallFromCategories(categories),
      ratingCount: ratingRows.length,
      drinkCount: drinks.length,
      drinks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load this cafe right now.' });
  }
});

// POST /api/cafes - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, area, description, imageUrl } = req.body;
    if (!name || !name.trim() || !area || !area.trim()) {
      return res.status(400).json({ error: 'Cafe name and area are required.' });
    }
    const [cafe] = await sql`
      INSERT INTO cafes (id, name, area, description, image_url, created_at)
      VALUES (${uuidv4()}, ${name.trim()}, ${area.trim()}, ${(description || '').trim()}, ${(imageUrl || '').trim()}, now())
      RETURNING id, name, area, description, image_url AS "imageUrl", created_at AS "createdAt"
    `;
    res.status(201).json(cafe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add this cafe right now.' });
  }
});

// DELETE /api/cafes/:id - admin only (ON DELETE CASCADE removes drinks, ratings, comments, etc.)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM cafes WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete this cafe right now.' });
  }
});

module.exports = router;
