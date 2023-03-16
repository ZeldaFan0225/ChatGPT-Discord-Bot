# Configuration

Here you can see an explanation of what which option does.  
To see an example look at our [template.config.json](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/template.config.json).

```
{
    "owner_ids": The ids of the owners discord account(s),
    "staff_roles": The roles which your staff have. This will bypass filters and cooldowns (ARRAY OF ROLE IDS),
    "staff_users": The staff users who don't have any of the staff roles. This will bypass filters and cooldowns (ARRAY OF USER IDS),
    "blacklist_roles": Blacklist users based on their roles. Staff have full bypass (ARRAY OF ROLE IDS),
    "default_model": The default model to use. Model must support chat completion (STRING) *8,
    "selectable_models": A list of models the users can select from (ARRAY OF ChAT COMPLETION MODEL NAMES) *1 *4
    "staff_can_bypass_feature_restrictions": When set to true staff won't be restricted by features turned off (BOOLEAN) *4,
    "dev": Whether this is a development instance or not (BOOLEAN) *3,
    "global_user_cooldown": The time until a user can send a new request in milliseconds (NUMBER),
    "max_thread_folowup_length": The amount of followup prompts a user can send in a thread (NUMBER),
    "generation_parameters": {
        "moderate_prompts": Whether to use openais moderation endpoint before sending the generation request (BOOLEAN),
        "default_system_instruction": The system instruction for the chatbot (STRING) *2,
        "temperature": The temperature for the request (NUMBER) *1,
        "top_p": The top_t for the request (NUMBER) *1,
        "max_tokens": The max tokens for the request (-1 for infinite) (NUMBER) *1,
        "presence_penalty": The presence_penalty for the request (NUMBER) *1,
        "frequency_penalty": The frequency_penalty for the request (NUMBER) *1,
        "max_input_chars":  The max characters for the request (NUMBER) *4
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
        "regenerate_button": Whether this feature is enabled or not (BOOLEAN),
        "delete_button": Whether this feature is enabled or not (BOOLEAN),
        "view_system_instruction": Whether this feature is enabled or not (BOOLEAN) *4,
        "englishify": Whether this feature is enabled or not (BOOLEAN),
        "context_action": Whether this feature is enabled or not (BOOLEAN) *6,
        "user_stats": Whether to record user stats or not,
        "user_leaderboard": Whether this feature is enabled or not (BOOLEAN) *4
    },
    "leaderboard_amount_users": How many users to display on the leaderboard (NUMBER),
    "englishify_system_instruction": The system instruction to translate a message (STRING) *5,
    "context_action_instruction": The system instruction for the context action (STRING),
    "costs": {
        "MODEL NAME": {
            "prompt": The cost for prompt tokens,
            "completion": The cost for completion tokens
        }
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