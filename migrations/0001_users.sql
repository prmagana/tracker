-- id is the Telegram user id (the OIDC sub). Timestamps are ISO strings.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);
