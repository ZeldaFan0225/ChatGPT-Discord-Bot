# Update Instructions

# 1.5.0 => 1.5.1

No special actions are required to perform this update.

# 1.4.1 => 1.5.0

Some keys in the config file have been changed.  
Please update them accordingly:

- `max_input_chars_per_model` => `max_input_tokens_per_model`  
- `max_tokens` => replaced with `max_completion_tokens_per_model` (different value type, refer to config.md)

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