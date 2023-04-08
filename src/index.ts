import {readFileSync} from "fs"
import {ActivityType, ApplicationCommandType, InteractionType, PresenceUpdateStatus} from "discord.js";
import { ChatGPTBotClient } from "./classes/client";
import { handleCommands } from "./handlers/commandHandler";
import { handleComponents } from "./handlers/componentHandler";
import { handleModals } from "./handlers/modalHandler";
import { handleAutocomplete } from "./handlers/autocompleteHandler";
import { handleContexts } from "./handlers/contextHandler";
import {Pool} from "pg"
import { handleMessage } from "./handlers/message";

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
for (const line of readFileSync(`${process.cwd()}/.env`, 'utf8').split(/[\r\n]/)) {
    const [, key, value] = line.match(RE_INI_KEY_VAL) || []
    if (!key) continue

    process.env[key] = value?.trim()
}

const connection = new Pool({
    user: process.env["DB_USERNAME"],
    host: process.env["DB_IP"],
    database: process.env["DB_NAME"],
    password: process.env["DB_PASSWORD"],
    port: Number(process.env["DB_PORT"]),
})

const client = new ChatGPTBotClient({
    intents: ["Guilds", "MessageContent", "GuildMessages", "DirectMessages"]
})


client.login(process.env["DISCORD_TOKEN"])

if(client.config.logs?.enabled) {
    client.initLogDir()
}


client.on("ready", async () => {
    await connection.connect().then(async () => {
        //console.log(await connection.query("SELECT * FROM user_data"))

        await connection.query("CREATE TABLE IF NOT EXISTS user_data (index SERIAL, user_id VARCHAR(100) PRIMARY KEY, consent bool DEFAULT true, tokens int NOT NULL DEFAULT 0, cost double precision default 0, blacklisted bool DEFAULT false)")
        await connection.query("CREATE TABLE IF NOT EXISTS chats (index SERIAL, id VARCHAR(100) PRIMARY KEY, user_id VARCHAR(100) NOT NULL, messages JSON[] DEFAULT '{}', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")

        console.log("Tables created")
    }).catch(console.error);

    client.commands.loadClasses().catch(console.error)
    client.components.loadClasses().catch(console.error)
    client.contexts.loadClasses().catch(console.error)
    //client.modals.loadClasses().catch(console.error)
    client.user?.setPresence({activities: [{type: ActivityType.Listening, name: "to ChatGPT screaming at your requests"}], status: PresenceUpdateStatus.DoNotDisturb })
    console.log(`Ready`)
    await client.application?.commands.set([...client.commands.createPostBody(), ...client.contexts.createPostBody()]).catch(console.error)

    if(client.config.selectable_system_instructions?.length && client.config.selectable_system_instructions.some(i => !i.name || !i.system_instruction)) throw new Error("Every selectable system instruction needs a name and a system_instruction")
    if(client.config.selectable_system_instructions?.length && client.config.selectable_system_instructions.some(i => i.name === "default")) throw new Error("You can't name your system instruction 'default'")

    setInterval(async () => {
        await connection.query("DELETE FROM chats WHERE created_at <= CURRENT_TIMESTAMP - interval '1 month'").catch(console.error)
    }, 1000 * 60 * 60)
})

client.on("interactionCreate", async (interaction) => {
    switch(interaction.type) {
        case InteractionType.ApplicationCommand: {
            switch(interaction.commandType) {
                case ApplicationCommandType.ChatInput: {
                    return await handleCommands(interaction, client, connection);
                }
                case ApplicationCommandType.User:
                case ApplicationCommandType.Message: {
                    return await handleContexts(interaction, client, connection);
                }
            }
        };
        case InteractionType.MessageComponent: {
			return await handleComponents(interaction, client, connection);
        };
        case InteractionType.ApplicationCommandAutocomplete: {
			return await handleAutocomplete(interaction, client, connection);
        };
        case InteractionType.ModalSubmit: {
			return await handleModals(interaction, client, connection);
        };
    }
})

client.on("threadDelete", async (thread) => {
    await connection.query("DELETE FROM chats WHERE id=$1", [thread.id])
})

if(client.config.hey_gpt?.enabled) client.on("messageCreate", async (message) => handleMessage(message, client, connection))