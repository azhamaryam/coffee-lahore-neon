require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to your .env file first (see .env.example).');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log(`✔ Ran ${statements.length} schema statements against your Neon database. Tables are ready.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
