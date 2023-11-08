# Update Instructions

# 1.7.0 => 1.8.0

- Add the following keys to your `config.json` file:
 - `assistants` (child of `features`)
 - `assistants`
 - `allow_collaboration` (child of `assistants`)
 - `result_fetching_max_count` (child of `assistants`)
 - `assistant_ids` (child of `assistants`)
 - `image_detail` (child of `generation_parameters`)

Look at [config.md](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/config.md) for information on what the key does

# 1.6.1 => 1.7.0

- Add the following keys to your `config.json` file:
 - `default_dalle_model`
 - `generate_image`
 - `quality` (child of `generate_image`)
 - `image_in_prompt` (child of `features`)
 - `create_image` (child of `features`)

Look at [config.md](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/config.md) for information on what the key does

# 1.6.0 => 1.6.1

- Add the key `auto_create_commands` to your `config.json` file and set it to true for it to work like before the update look at [config.md](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/config.md) for information on what the key does

# 1.5.1 => 1.6.0

- Change the key `context_action_instruction` from your `config.json` file to the new property `message_context_actions`, make sure to follow the scheme described in [config.md](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/config.md)

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