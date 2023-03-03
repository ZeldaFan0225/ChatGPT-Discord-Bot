import { ApplicationCommandType, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "../classes/client";
import { ContextContext } from "../classes/contextContext";

export async function handleContexts(interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction, client: ChatGPTBotClient, database: Pool) {
    const command = await client.contexts.getContext(interaction).catch(() => null)
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

    return await command.run(context).catch(console.error)
}