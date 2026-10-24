CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS deals_updated ON deals (updated_at DESC);
