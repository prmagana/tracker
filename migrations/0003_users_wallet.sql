-- User-friendly TON address from the last TON Connect pairing. Null when disconnected.
ALTER TABLE users ADD COLUMN wallet_address TEXT;
