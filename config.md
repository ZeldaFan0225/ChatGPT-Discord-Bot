# Configuration

Here you can see an explanation of what which option does.  
To see an example look at our [template.config.json](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/template.config.json).

For your model configurations in `models` you can take the [example_model_configurations.json](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/example_model_configurations.json) as an example. The example model configurations also include up to date pricing (as of 7th February 2024), the correct context sizes and other settings.

```
{
    "owner_ids": The ids of the owners discord account(s),
    "staff_roles": The roles which your staff have. This will bypass filters and cooldowns (ARRAY OF ROLE IDS),
    "staff_users": The staff users who don't have any of the staff roles. This will bypass filters and cooldowns (ARRAY OF USER IDS),
    "blacklist_roles": Blacklist users based on their roles. Staff have full bypass (ARRAY OF ROLE IDS),
    "default_dalle_model": The default dalle model to use in /create_image *1 *2,
    "staff_can_bypass_feature_restrictions": When set to true staff won't be restricted by features turned off (BOOLEAN) *4,
    "dev_config": {
        "enabled": Whether this is a development instance or not (BOOLEAN) *3,
        "debug_discord_messages": Show debug messages in discord,
        "debug_logs": Show debug messages in the terminal,
    },
    "global_user_cooldown": The time until a user can send a new request in milliseconds (NUMBER),
    "max_thread_folowup_length": The amount of followup prompts a user can send in a thread (NUMBER),
    "allow_collaboration": When set to true anybody can use /chat thread in each others threads (BOOLEAN),
    "hey_gpt": {
        "enabled": Whether this is enabled or not (BOOLEAN),
        "model": The model to use for this action (STRING),
        "processing_emoji": The emoji to use for showing the bot is working (unicode or emoji ID),
        "system_instruction": The system instruction for this action (STRING),
        "activation_phrases": Phrases which the message has to start with to be activated (ARRAY OF STRINGS) *13
    },
    "generate_image": {
        "quality": "hd" or "standard" *1,
        "default_size": "1024x1024" or "1024x1792" or "1792x1024" *1,
    },
    "assistants": {
        "result_fetching_max_count": The number of times to fetch the response results from OpenAI before displaying an error (INTEGER),
        "allow_collaboration": When enabled all users who have access to the thread can interact with the assistant (BOOLEAN),
        "assistant_ids": Array of assistant IDs that can be used in the bot *1 (ARRAY OF STRINGS)
    },
    "generation_settings": {
        "default_model": The default model to use. Model must support chat completion (STRING) *8,
        "default_system_instruction": The system instruction for the chatbot (STRING) *2,
        "selectable_models": A list of models the users can select from (ARRAY OF CHAT COMPLETION MODEL NAMES) *1 *4 *12 *14
    },
    "selectable_system_instructions": An array of selectable system instructions (ARRAY WITH OBJECTS WITH THE PROPERTIES name AND system_instruction) *4,
    "logs": {
        "enabled": Whether logging is enabled or not (BOOLEAN),
        "directory": The directory where the logging files are saved to (STRING),
        "plain": Whether to log in a plain text file (BOOLEAN),
        "csv": Whether to log in csv format (BOOLEAN)
    },
    "features": {
        "chat_single": Whether this feature is enabled or not (BOOLEAN) *4,
        "chat_thread": Whether this feature is enabled or not (BOOLEAN) *4,
        "assistants": Whether this feature is enabled or not (BOOLEAN) *4,
        "image_in_prompt": Whether this feature is enabled or not (BOOLEAN) *4,
        "create_image": Whether this feature is enabled or not (BOOLEAN) *4,
        "regenerate_button": Whether this feature is enabled or not (BOOLEAN),
        "delete_button": Whether this feature is enabled or not (BOOLEAN),
        "view_system_instruction": Whether this feature is enabled or not (BOOLEAN) *4,
        "user_stats": Whether to record user stats or not,
        "user_leaderboard": Whether this feature is enabled or not (BOOLEAN) *4
    },
    "leaderboard_amount_users": How many users to display on the leaderboard (NUMBER),
    "auto_create_commands": When set to true the commands will be automatically created (BOOLEAN) *11,
    "message_context_actions": An Array of message contexts with system instructions (ARRAY WITH OBJECTS WITH THE PROPERTIES name, model (*15) AND system_instruction) *4,
    "models": {
        "MODEL NAME": {
            "model": The configurations model name (STRING, REQUIRED),
            "base_url": The base url of the API *1.
            "images": {
                "supported": Whether images are supported for this model *1,
                "detail": "low", "high" or "auto" - The *1,
            },
            "moderation": {
                "enabled": Whether to use OpenAI Moderation on the prompts,
            },
            "env_token_name": The key of the token in the .env file,
            "max_completions_token": The max amount of tokens to generate *10,
            "max_tokens": The max tokens for this model *1,
            "cost": {
                "prompt": The cost for prompts *8,
                "completion": The cost for completions *8
            },
            "defaults": {
                "frequency_penalty": The default value for this property *1,
                "logit_bias": The default value for this property *1,
                "logprobs": The default value for this property *1,
                "top_logprobs": The default value for this property *1,
                "presence_penalty": The default value for this property *1,
                "response_format": The default value for this property *1,
                "seed": The default value for this property *1,
                "stop": The default value for this property *1,
                "temperature": The default value for this property *1,
                "top_p": The default value for this property *1
            }
        } *16
    }
}
```

`*1` See API Documentation for reference (https://platform.openai.com/docs/api-reference/chat) 
`*2` See Instructing chat models for reference (https://platform.openai.com/docs/guides/chat/instructing-chat-models)
`*3` Developer mode will enable logging and will also show the generations ID in the embed in Discord  
`*4` This option changes how the command is created.  
`*5` It is not recommended to change this option.  
`*6` Configuration of `context_action_instruction` is advised.  
`*7` Prices for models to save money spent by users. [Read more about pricing](https://openai.com/pricing)
`*8` See API Documentation for compatibility. [Read more](https://platform.openai.com/docs/models/model-endpoint-compatibility)
`*9` The value can not exceed 6000
`*10` It is recommended to set this value to `-1` to avoid errors.  
`*11` When set to false changes in the config file will not be applied to commands on startup, only when using /reload_config THE DEFAULT IS TRUE  
`*12` For better configuration instead of the name the following can be given: `{name: string, base_url?: string, supports_images?: boolean, env_token_name?: string}`  
`*13` For better configuration instead of the activation phrase the following can be given: `{phrase: string, system_instruction: string, model: string *15, allow_images?: boolean}`
`*14` When providing `env_token_name` you have to add a auth key to the .env with the exact name of the `env_token_name` similar to the `OPENAI_TOKEN` key
`*15` This name has to be a key in `models`,
`*16` Here you can set up external models as well by providing the model name, base url and token. The API is required to be compatible with OpenAI API
