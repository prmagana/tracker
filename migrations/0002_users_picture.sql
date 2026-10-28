-- Telegram profile photo URL from the OIDC picture claim. Null when the user has none.
ALTER TABLE users ADD COLUMN picture TEXT;
