const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Create a free Neon project at https://neon.tech, copy its connection ' +
    'string, and add it to your .env file (see .env.example).'
  );
}

// `sql` is a tagged-template query function backed by Neon's HTTP driver.
// It works identically locally and on Vercel — no connection pooling to manage.
const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
