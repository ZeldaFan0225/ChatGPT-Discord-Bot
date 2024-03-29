import { ApplicationCommandType, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "../classes/client";
import { ContextContext } from "../classes/contextContext";

export async function handleContexts(interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction, client: ChatGPTBotClient, database: Pool) {
    let command = await client.contexts.getContext(interaction).catch(() => null)
    if(!command && client.config.message_context_actions?.find(a => a.name === interaction.commandName)) command = client.contexts.loaded_classes.find(c => c.name === "configurable_context_action");
    if(!command) return;

    let context
    if(interaction.commandType === ApplicationCommandType.User) context = new ContextContext<ApplicationCommandType.User>({interaction, client, database})
    else context = new ContextContext<ApplicationCommandType.Message>({interaction, client, database})

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
    if(!context.is_staff && (context.has_blacklisted_role || await context.client.checkBlacklist(interaction.user.id, database)))
        return await context.error({
            error: "You have been blacklisted"
        })

    return await command.run(context).catch(console.error)
}