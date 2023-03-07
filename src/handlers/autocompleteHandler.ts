import { AutocompleteInteraction } from "discord.js";
import { Pool } from "pg";
import { AutocompleteContext } from "../classes/autocompleteContext";
import { ChatGPTBotClient } from "../classes/client";

export async function handleAutocomplete(interaction: AutocompleteInteraction, client: ChatGPTBotClient, database: Pool) {
    const command = await client.commands.getCommand(interaction).catch(() => null)
    if(!command) return;
    const context = new AutocompleteContext({interaction, client, database})
    if(!interaction.inGuild())
        return await context.error()
    if(!interaction.channel)
        return await context.error()
    if(command.staff_only && !context.is_staff)
        return await context.error()
    if(!context.is_staff && (context.has_blacklisted_role || await context.client.checkBlacklist(interaction.user.id, database)))
        return await context.error()
    return await command.autocomplete(context).catch(console.error)
}