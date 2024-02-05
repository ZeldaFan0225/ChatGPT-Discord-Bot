import { APIButtonComponent, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, Colors, EmbedBuilder, InteractionEditReplyOptions } from "discord.js";
import { Context } from "../classes/context";
import { ContextContext } from "../classes/contextContext";
import { ChatCompletionMessages } from "../types";


const delete_button = new ButtonBuilder({
    emoji: {name: "🚮"},
    custom_id: "delete",
    style: 4
})

export default class extends Context {
    constructor() {
        super({
            name: "configurable_context_action",
            staff_only: false,
        })
    }

    override async run(ctx: ContextContext<ApplicationCommandType.Message>): Promise<any> {
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        if(!ctx.interaction.targetMessage.content?.length) return ctx.error({error: "This message does not have any content"})
        const messages: ChatCompletionMessages[] = []

        const action = ctx.client.config.message_context_actions?.find(a => a.name === ctx.interaction.commandName)
        if(!action) return ctx.error({error: "Unable to find action"})

        const model_configuration = ctx.client.config.models?.[action.model]
        if(!model_configuration) return ctx.error({error: "Model configuration not found"})

        if(action.system_instruction) messages.push({role: "system", content: action.system_instruction})

        messages.push({
            role: "user",
            content: `${ctx.interaction.targetMessage.content}`
        })
        
        await ctx.interaction.deferReply()
        
        if(await ctx.client.checkIfPromptGetsFlagged(ctx.interaction.targetMessage.content)) return ctx.error({error: "The messages content has been flagged to be violating OpenAIs TOS."})
        
        const data = await ctx.client.requestChatCompletion(messages, model_configuration, ctx.interaction.user.id, ctx.database).catch(console.error)
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
                footer: {text: `Completion with OpenAIs Chat Completion API requested by ${ctx.interaction.user.username}`, icon_url: ctx.interaction.user.displayAvatarURL()}
            })

            payload.embeds = [embed]
        } else {
            const attachment = new AttachmentBuilder(Buffer.from(`${ctx.interaction.targetMessage.author.tag}:\n${ctx.interaction.targetMessage.content}\n\nChatGPT:\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}\n\nThis response has been generated using OpenAIs Chat Completion API.\nThe completion has been requested by ${ctx.interaction.user.username}`), {name: `${data.id}.txt`})
            payload.content = "Result attached below"
            payload.files = [attachment]
        }

        if(ctx.client.config.global_user_cooldown) ctx.client.cooldown.set(ctx.interaction.user.id, Date.now(), ctx.client.config.global_user_cooldown)
        const res = await ctx.interaction.editReply(payload)

        if(ctx.client.config.dev_config?.enabled && ctx.client.config.dev_config.debug_discord_messages) {
            const devembed = new EmbedBuilder({
                title: "Dev",
                description: `**ID** \`${data.id}\`
                
**Prompt Tokens** ${data.usage.prompt_tokens}
**Completion Tokens** ${data.usage.completion_tokens}
**Total Tokens** ${data.usage.total_tokens}

**Model Configuration**
\`\`\`json
${JSON.stringify(model_configuration, null, 2)}
\`\`\``,
                color: Colors.Red
            })
            await res.reply({
                embeds: [devembed]
            })
        }
    }
}