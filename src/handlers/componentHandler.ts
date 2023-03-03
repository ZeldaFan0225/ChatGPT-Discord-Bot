import { ButtonInteraction, ComponentType, AnySelectMenuInteraction } from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "../classes/client";
import { ComponentContext } from "../classes/componentContext";

export async function handleComponents(interaction: ButtonInteraction | AnySelectMenuInteraction, client: ChatGPTBotClient, database: Pool) {
    const command = await client.components.getComponent(interaction).catch(() => null)
    if(!command) return;
    let context


    if(interaction.componentType === ComponentType.Button) context = new ComponentContext<ComponentType.Button>({interaction, client, database})
    else {
        switch(interaction.componentType) {
            case ComponentType.StringSelect: context = new ComponentContext<ComponentType.StringSelect>({interaction, client, database}); break;
            case ComponentType.ChannelSelect: context = new ComponentContext<ComponentType.ChannelSelect>({interaction, client, database}); break;
            case ComponentType.MentionableSelect: context = new ComponentContext<ComponentType.MentionableSelect>({interaction, client, database}); break;
            case ComponentType.RoleSelect: context = new ComponentContext<ComponentType.RoleSelect>({interaction, client, database}); break;
            case ComponentType.UserSelect: context = new ComponentContext<ComponentType.UserSelect>({interaction, client, database}); break;
        }
    }

    if(command.staff_only && !(Array.isArray(interaction.member?.roles) ? interaction.member?.roles.some(r => client.config.staff_roles?.includes(r)) : interaction.member?.roles.cache.some(r => client.config.staff_roles?.includes(r.id))))
    return await context.error({
        error: "You are not staff"
    })

    return await command.run(context).catch(console.error)
}