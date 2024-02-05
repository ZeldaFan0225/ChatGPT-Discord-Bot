import { ButtonBuilder, Colors, ComponentType, EmbedBuilder } from "discord.js";
import { Component } from "../classes/component";
import { ComponentContext } from "../classes/componentContext";

const regenerate_button = new ButtonBuilder({
    emoji: {name: "🔄"},
    custom_id: "regenerate",
    style: 1
})

const delete_button = new ButtonBuilder({
    emoji: {name: "🚮"},
    custom_id: "delete",
    style: 4
})

export default class extends Component {
    constructor() {
        super({
            name: "create_thread",
            staff_only: false,
            regex: /create_thread/
        })
    }

    override async run(ctx: ComponentContext<ComponentType.Button>): Promise<any> {
        if(!ctx.client.config.features?.chat_thread && !ctx.can_staff_bypass) return ctx.error({error: "This action is disabled"})
        await ctx.interaction.deferUpdate()
        if(ctx.interaction.message.interaction?.user.id !== ctx.interaction.user.id) return;
        const embed = ctx.interaction.message.embeds[0]
        if(!embed?.description) return;
        const [message, ...response] = embed?.description.split("\n\n**AI ChatBot (")
        const system_instruction_name = embed?.description.matchAll(/\*\*ChatGPT \((?<name>[A-Z a-z0-9_-]+)\)\:\*\*/g)?.next()?.value?.groups?.name ?? "default"
        const system_instruction = system_instruction_name === "default" ? ctx.client.config.generation_settings?.default_system_instruction : ctx.client.config.selectable_system_instructions?.find(i => i.name?.toLowerCase() === system_instruction_name)?.system_instruction
        
        const model_configuration_name = embed?.footer?.text.matchAll(/\((?<name>[A-Z a-z0-9_-]+)\)/g)?.next()?.value?.groups?.name
        if(!model_configuration_name) return ctx.error({error: "Unable to find model configuration"})
        const model_configuration = ctx.client.config.models?.[model_configuration_name]
        if(!model_configuration) return ctx.error({error: "Model configuration not found"})
        const messages = []
        
        if(system_instruction?.length) messages.push({role: "system", content: system_instruction})
        messages.push({
            role: "user",
            content: message
        },{
            role: "assistant",
            content: response.join("\n\n").replace(`${system_instruction_name}):**\n`, "")
        })

        const thread = await ctx.interaction.message.startThread({
            name: `AI Assitant Chat ${ctx.interaction.user.username}`,
        }).catch(console.error)
        if(!thread) return;
        await thread.members.add(ctx.interaction.user)

        const db_save = await ctx.database.query('INSERT INTO chats (id, user_id, messages, model_configuration) VALUES ($1, $2, $3, $4) RETURNING *', [
            thread.id,
            ctx.interaction.user.id,
            messages,
            model_configuration_name
        ]).catch(console.error)
        
        if(!db_save?.rowCount) await thread.setLocked(true)

        await thread.send({
            embeds: [
                new EmbedBuilder({
                    description: !!db_save?.rowCount ? `To create a response to ChatGPTs response use ${await ctx.client.getSlashCommandTag("chat thread")}` : "Unable to save chat for followup",
                    color: !!db_save?.rowCount ? Colors.Green : Colors.Red
                })
            ]
        })

        ctx.interaction.followUp({
            content: "Thread created",
            ephemeral: true
        })

        const buttons = []

        if((ctx.client.config.features?.delete_button || ctx.client.config.features?.regenerate_button) || ctx.can_staff_bypass) {

            if(ctx.client.config.features?.regenerate_button || ctx.can_staff_bypass) buttons.push(regenerate_button)
            if(ctx.client.config.features?.delete_button || ctx.can_staff_bypass) buttons.push(delete_button)
        }

        ctx.interaction.editReply({
            components: [{
                type: 1,
                components: buttons.length ? buttons : []
            }]
        })
    }
}