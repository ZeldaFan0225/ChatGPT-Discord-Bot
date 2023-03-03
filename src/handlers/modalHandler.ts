import { ModalSubmitInteraction } from "discord.js";
import { ChatGPTBotClient } from "../classes/client";
import { ModalContext } from "../classes/modalContext";

export async function handleModals(interaction: ModalSubmitInteraction, client: ChatGPTBotClient) {
    const command = await client.modals.getModal(interaction).catch(() => null)
    if(!command) return;
    let context = new ModalContext({interaction, client})

    if(command.staff_only && !(Array.isArray(interaction.member?.roles) ? interaction.member?.roles.some(r => client.config.staff_roles?.includes(r)) : interaction.member?.roles.cache.some(r => client.config.staff_roles?.includes(r.id))))
        return await context.error({
            error: "You are not staff"
        })

    return await command.run(context).catch(console.error)
}