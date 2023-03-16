# Update Instructions

# 1.4.0 => 1.4.1

No special actions are required to perform this update.

# 1.3.0 => 1.4.0

Run following queries on your postgres database **in the correct order**:

- `ALTER TABLE user_data ADD COLUMN cost double precision default 0`
- `UPDATE user_data SET cost=user_data.tokens/1000*0.002`

# 1.2.0 => 1.3.0

No special actions are required to perform this update.

# 1.1.0 => 1.2.0

Run following queries on your postgres database:  

- `ALTER TABLE user_data ADD COLUMN tokens int NOT NULL DEFAULT 0`
- `ALTER TABLE user_data ADD COLUMN consent bool DEFAULT true`
- `ALTER TABLE user_data ADD COLUMN blacklisted bool DEFAULT false`