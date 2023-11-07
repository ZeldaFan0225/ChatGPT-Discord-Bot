# ChatGPT-Discord-Bot

A basic Discord bot to generate chat completions using OpenAIs Chat Completion API.

**DISCLAIMER:**  
THIS REPOSITORY IS IN NO WAY ASSOCIATED TO OPENAI  
OFFERING THIS CODE IN FORM OF A PUBLIC DISCORD BOT WHICH CAN BE INVITED BY EVERYBODY IS NOT SUPPORTED.  
THE SCALE OF A BOT USING THIS CODE IS 1 SERVER, EVERYTHING ABOVE IS NEITHER ALLOWED NOR SUPPORTED.  
THE MAINTAINERS OF THE REPOSITORY ARE IN NO WAY RESPONSIBLE FOR WHAT USER-GENERATED REQUEST CONTENT IS SENT TO OPENAI  
  
Please make sure to follow [OpenAIs usage policies](https://platform.openai.com/docs/usage-policies)

## Features

This package includes the code for a discord bot which interacts with the openai api.
The bot has the following features:

- /chat single - Creates a single response without any possibility to give followup prompts
- /chat thread - Creates a thread as the response to a generation request. Followup prompts can be sent
- /info - shows information about the bot
- /terms - To make users agree to the terms of service before allowing them to generate responses
- /leaderboard - To see who generated the most tokens
- /view_system_instructions - To see the text for a selectable system instructions
- Translate to English - Context command to translate a users message to grammatically correct english
- control over allowed frequency of users requests
- advanced configuration
- logging to detect tos-breaking prompts
- ability to blacklist
- generating images using DallE-3 with /create_image
- creating threads with assistants using /assistants

If you want some inspiration on system instructions for the GPT model you can view [my repository](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot-System-Instructions) for it.  

## Version Requirements

- NodeJS >= 16.16  
- PostgreSQL >= 14.6  

## How to set up

1) download the code from this repository  
2) get the token of your discord bot (https://discord.com/developers/docs/reference#authentication)  
3) Install the node modules using `npm i` (make sure the dev dependencies are also installed for typescript to work)  
4) remove the `template.` from the `template.config.json` file  
5) set up a postgres database  
6) fill out the `template.env` and rename it to `.env`   
7) modify the [config.json](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/template.config.json) file (from step 4) to fit your needs (you can read about what which property does in [config.md](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/config.md))  
8) compile the code and start the process (this can be done by using `npm run deploy`)  
  
Now if everything is set up it should start and give an output in the console.  

## How to update

1) Pull the code from this repository
2) Update your config. Reading through the [changelog](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/changelog.md) might help.
3) Follow the [update instructions](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/blob/main/update_instructions.md) for the version you are updating to. Make sure to follow all steps from your current version to the version you are updating to (e.g. 1.0.0 => 1.1.0 and 1.1.0 => 1.2.0).
