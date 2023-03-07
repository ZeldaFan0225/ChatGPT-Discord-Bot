import { ChatInputCommandInteraction } from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "../classes/client";
import { CommandContext } from "../classes/commandContext";

export async function handleCommands(interaction: ChatInputCommandInteraction, client: ChatGPTBotClient, database: Pool) {
    const command = await client.commands.getCommand(interaction).catch(() => null)
    if(!command) return;
    const context = new CommandContext({interaction, client, database})
    if(!interaction.inGuild())
        return await context.error({
            error: "You can only use commands in guilds",
            ephemeral: true
        })
    if(!interaction.channel)
        return await context.error({
            error: "Please add me to the private thread (by mentioning me) to use commands",
            ephemeral: true
        })
    if(command.staff_only && !context.is_staff)
        return await context.error({
            error: "You are not staff"
        })
    if(!context.is_staff && await context.client.checkBlacklist(interaction.user.id, database))
        return await context.error({
            error: "You have been blacklisted"
        })
    return await command.run(context).catch(console.error)
}