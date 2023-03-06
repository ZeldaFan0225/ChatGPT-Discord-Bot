import { APIButtonComponent, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, Colors, ContextMenuCommandBuilder, EmbedBuilder, InteractionEditReplyOptions } from "discord.js";
import { Context } from "../classes/context";
import { ContextContext } from "../classes/contextContext";

const command_data = new ContextMenuCommandBuilder()
    .setType(ApplicationCommandType.Message)
    .setName("Context Action")
    .setDMPermission(false)


const delete_button = new ButtonBuilder({
    emoji: {name: "🚮"},
    custom_id: "delete",
    style: 4
})

export default class extends Context {
    constructor() {
        super({
            name: "Context Action",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: ContextContext<ApplicationCommandType.Message>): Promise<any> {
        if(!ctx.client.config.features?.context_action && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        if(!ctx.interaction.targetMessage.content?.length) return ctx.error({error: "This message does not have any content"})
        const messages = []

        if(ctx.client.config?.context_action_instruction) messages.push({role: "system", content: ctx.client.config?.context_action_instruction})

        messages.push({
            role: "user",
            content: `${ctx.interaction.targetMessage.content}`
        })
        
        await ctx.interaction.deferReply()
        
        if(await ctx.client.checkIfPromptGetsFlagged(ctx.interaction.targetMessage.content)) return ctx.error({error: "The messages content has been flagged to be violating OpenAIs TOS."})
        
        const data = await ctx.client.requestChatCompletion(messages, ctx.interaction.user.id, ctx.database, {
            temperature: 0
        }).catch(console.error)
        if(!data) return ctx.error({error: "Something went wrong"})
        
        const description = `**ChatGPT:**\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}`

        const comps: APIButtonComponent[] = [
            {
                type: 2,
                style: 5,
                url: ctx.interaction.targetMessage.url,
                label: "Jump to Message"
            }
        ]
        
        if(ctx.client.config.features?.delete_button || ctx.can_staff_bypass) 
            comps.push(delete_button.toJSON())

        let payload: InteractionEditReplyOptions = {
            components: [{
                type: 1,
                components: comps
            }]
        }
        

        if(description.length < 4000) {
            const embed = new EmbedBuilder({
                author: {
                    name: ctx.interaction.targetMessage.author.tag,
                    icon_url: ctx.interaction.targetMessage.author.displayAvatarURL()
                },
                description,
                color: Colors.Green,
                footer: {text: `Completion with OpenAIs GPT-3.5 model requested by ${ctx.interaction.user.tag}`, icon_url: ctx.interaction.user.displayAvatarURL()}
            })

            payload.embeds = [embed]
        } else {
            const attachment = new AttachmentBuilder(Buffer.from(`${ctx.interaction.targetMessage.author.tag}:\n${ctx.interaction.targetMessage.content}\n\nChatGPT:\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}\n\nThis response has been generated using OpenAIs GPT-3.5 model.\nThe completion has been requested by ${ctx.interaction.user.tag}`), {name: `${data.id}.txt`})
            payload.content = "Result attached below"
            payload.files = [attachment]
        }

        if(ctx.client.config.global_user_cooldown) ctx.client.cooldown.set(ctx.interaction.user.id, Date.now(), ctx.client.config.global_user_cooldown)
        const res = await ctx.interaction.editReply(payload)

        if(ctx.client.config.dev) {
            const devembed = new EmbedBuilder({
                title: "Dev",
                description: `**ID** \`${data.id}\`
                
**Prompt Tokens** ${data.usage.prompt_tokens}
**Completion Tokens** ${data.usage.completion_tokens}
**Total Tokens** ${data.usage.total_tokens}`,
                color: Colors.Red
            })
            await res.reply({
                embeds: [devembed]
            })
        }
    }
}