# Update Instructions

# 1.2.0 => 1.3.0

No special actions are required to perform this update.

# 1.1.0 => 1.2.0

Run following queries on your postgres database:  

- `ALTER TABLE user_data ADD COLUMN tokens int NOT NULL DEFAULT 0`
- `ALTER TABLE user_data ADD COLUMN consent bool DEFAULT true`
- `ALTER TABLE user_data ADD COLUMN blacklisted bool DEFAULT false`