import { ApplicationCommandType, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { ChatGPTBotClient } from "../classes/client";
import { ContextContext } from "../classes/contextContext";

export async function handleContexts(interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction, client: ChatGPTBotClient) {
    const command = await client.contexts.getContext(interaction).catch(() => null)
    if(!command) return;

    let context
    if(interaction.commandType === ApplicationCommandType.User) context = new ContextContext<ApplicationCommandType.User>({interaction, client})
    else context = new ContextContext<ApplicationCommandType.Message>({interaction, client})

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
    if(command.staff_only && !(Array.isArray(interaction.member.roles) ? interaction.member.roles.some(r => client.config.staff_roles?.includes(r)) : interaction.member.roles.cache.some(r => client.config.staff_roles?.includes(r.id))))
        return await context.error({
            error: "You are not staff"
        })

    return await command.run(context).catch(console.error)
}