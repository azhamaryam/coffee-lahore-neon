-- Coffee Lahore database schema (PostgreSQL / Neon)
-- Run with: npm run migrate

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_creator BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cafes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drinks (
  id UUID PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per user per cafe; ON CONFLICT upserts when someone re-rates.
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ambiance SMALLINT NOT NULL CHECK (ambiance BETWEEN 1 AND 5),
  service SMALLINT NOT NULL CHECK (service BETWEEN 1 AND 5),
  food SMALLINT NOT NULL CHECK (food BETWEEN 1 AND 5),
  drinks SMALLINT NOT NULL CHECK (drinks BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, user_id)
);

CREATE TABLE IF NOT EXISTS drink_ratings (
  id UUID PRIMARY KEY,
  drink_id UUID NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (drink_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  is_creator BOOLEAN NOT NULL DEFAULT FALSE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tried (
  id UUID PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_drinks_cafe ON drinks(cafe_id);
CREATE INDEX IF NOT EXISTS idx_ratings_cafe ON ratings(cafe_id);
CREATE INDEX IF NOT EXISTS idx_drink_ratings_drink ON drink_ratings(drink_id);
CREATE INDEX IF NOT EXISTS idx_comments_cafe ON comments(cafe_id);
CREATE INDEX IF NOT EXISTS idx_tried_user ON tried(user_id);
