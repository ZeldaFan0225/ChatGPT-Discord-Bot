import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { ChatData } from "../types";
import { EmbedBuilder, embedLength } from "@discordjs/builders";
import { AttachmentBuilder, ButtonBuilder, Colors, InteractionEditReplyOptions } from "discord.js";
import { AutocompleteContext } from "../classes/autocompleteContext";

const delete_button = new ButtonBuilder({
    emoji: {name: "🚮"},
    custom_id: "delete",
    style: 4
})

export default class extends Command {
    constructor() {
        super({
            name: "chat_thread",
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.chat_thread && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        let message = ctx.interaction.options.getString("message", true)
        const modal = ctx.interaction.options.getBoolean("form_input") ?? false
        const system_instruction_name = ctx.interaction.options.getString("system_instruction") ?? "default"
        const system_instruction = system_instruction_name === "default" ? ctx.client.config.generation_parameters?.default_system_instruction : ctx.client.config.selectable_system_instructions?.find(i => i.name?.toLowerCase() === system_instruction_name.toLowerCase())?.system_instruction
        if(system_instruction_name !== "default" && !system_instruction) return ctx.error({error: "Unable to find system instruction"})
        const model = ctx.interaction.options.getString("model") ?? ctx.client.config.default_model ?? "gpt-3.5-turbo"
        const messages = []
        
        let modalinteraction;
        if(modal) {
            await ctx.interaction.showModal({
                title: "Prompt Input",
                custom_id: "prompt_input",
                components: [{
                    type: 1,
                    components: [{
                        type: 4,
                        label: "Prompt",
                        custom_id: "prompt",
                        required: true,
                        placeholder: "Insert your prompt here",
                        value: message,
                        style: 2
                    }]
                }]
            })
            const res = await ctx.interaction.awaitModalSubmit({
                time: 1000 * 60 * 5
            }).catch(console.error)
            if(!res) return;
            modalinteraction = res
            await res.deferReply()
            message = res.fields.getTextInputValue("prompt")
        } else await ctx.interaction.deferReply()
        
        const {count} = ctx.client.tokenizeString(message)

        if(count > (ctx.client.config.generation_parameters?.max_input_tokens_per_model?.[model] ?? 4096)) return ctx.error({error: "Please shorten your prompt"})

        if(ctx.interaction.channel?.isThread()) {
            const data = await ctx.database.query<ChatData>("SELECT * FROM chats WHERE id=$1", [ctx.interaction.channelId]).catch(console.error)
            if(!data?.rowCount) return ctx.error({error: "Unable to find conversation.\nUse this command in a non-thread channel to start a new conversation."})
            if(!ctx.client.config.allow_collaboration && data.rows[0]!.user_id !== ctx.interaction.user.id) return ctx.error({error: "Only the initial user can use this command in this thread."})

            messages.push(...data.rows[0]!.messages)
            messages.push({
                role: "user",
                content: message
            })

            if(ctx.client.config.max_thread_folowup_length && messages.filter(m => m.role === "user").length > ctx.client.config.max_thread_folowup_length) return ctx.error({error: "Max length of this conversation reached"})

            if(await ctx.client.checkIfPromptGetsFlagged(message)) return ctx.error({error: "Your message has been flagged to be violating OpenAIs TOS"})
            if(ctx.client.cache.has(ctx.interaction.channelId)) return ctx.error({error: "Somebody else is currently generating an answer for this thread. Please wait until they are finished"})

            ctx.client.cache.set(ctx.interaction.channelId, true, 1000 * 60 * 15)

            const ai_data = await ctx.client.requestChatCompletion(messages, ctx.interaction.user.id, ctx.database, {model}).catch(console.error)
            if(!ai_data) {
                ctx.error({error: "Something went wrong"})
                ctx.client.cache.delete(ctx.interaction.channelId)
                return;
            }

            if(ctx.client.config.global_user_cooldown) ctx.client.cooldown.set(ctx.interaction.user.id, Date.now(), ctx.client.config.global_user_cooldown)

            const embeds: [EmbedBuilder, EmbedBuilder] = [
                new EmbedBuilder({
                    author: {
                        name: ctx.interaction.user.tag,
                        icon_url: ctx.interaction.user.displayAvatarURL()
                    },
                    color: Colors.Blue,
                    description: message
                }),
                new EmbedBuilder({
                    author: {
                        name: "ChatGPT",
                    },
                    description: ai_data.choices[0]?.message.content?.trim(),
                    color: Colors.Blue,
                    footer: {text: `This text has been generated by OpenAIs Chat Completion API (${ai_data.model})`}
                })
            ]
            
            let payload: InteractionEditReplyOptions = {}

            if((embedLength(embeds[0].toJSON()) + embedLength(embeds[1].toJSON())) <= 6000) {
                payload = {embeds}
            } else {
                const attachment = new AttachmentBuilder(Buffer.from(`${ctx.interaction.user.tag}:\n${message}\n\nChatGPT:\n${ai_data.choices[0]?.message.content?.trim() ?? "Hi there"}\n\nThis response has been generated using OpenAIs Chat Completion API`), {name: `${ai_data.id}.txt`})
                payload = {
                    content: "Result attached below",
                    files: [attachment]
                }
            }

            const reply = await (modalinteraction ?? ctx.interaction).editReply(payload)

            messages.push({
                role: "assistant",
                content: ai_data.choices[0]?.message.content?.trim()
            })
            
            await ctx.database.query("UPDATE chats SET messages=$2 WHERE id=$1 RETURNING *", [ctx.interaction.channelId, messages]).catch(console.error)
            ctx.client.cache.delete(ctx.interaction.channelId)

            if(ctx.client.config.dev_config?.enabled && ctx.client.config.dev_config.debug_discord_messages) {
                const devembed = new EmbedBuilder({
                    title: "Dev",
                    description: `**ID** \`${ai_data.id}\`
                
**Prompt Tokens** ${ai_data.usage.prompt_tokens}
**Completion Tokens** ${ai_data.usage.completion_tokens}
**Total Tokens** ${ai_data.usage.total_tokens}

**System Instruction**
${system_instruction ?? "NONE"}`,
                    color: Colors.Red
                })
                await reply.reply({
                    embeds: [devembed]
                })
            }
            return;
        }

        if(system_instruction?.length) messages.push({role: "system", content: system_instruction})

        messages.push({
            role: "user",
            content: message
        })

        const payload = {
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: ctx.interaction.user.tag,
                        icon_url: ctx.interaction.user.displayAvatarURL()
                    },
                    color: Colors.Blue,
                    description: message
                })
            ]
        }

        const reply = await (modalinteraction ?? ctx.interaction).editReply({...payload})

        if(await ctx.client.checkIfPromptGetsFlagged(message)) return ctx.error({error: "Your message has been flagged to be violating OpenAIs TOS"})

        await reply.react("⌛")

        const data = await ctx.client.requestChatCompletion(messages, ctx.interaction.user.id, ctx.database, {model}).catch(console.error)
        if(!data) return ctx.error({error: "Something went wrong"})

        if(ctx.client.config.global_user_cooldown) ctx.client.cooldown.set(ctx.interaction.user.id, Date.now(), ctx.client.config.global_user_cooldown)

        const thread = await reply.startThread({
            name: `ChatGPT Chat ${ctx.interaction.user.tag}`,
        }).catch(console.error)

        await reply.reactions.cache.get("⌛")?.remove()

        if(!thread?.id) {
            const description = `${message}\n\n**ChatGPT:**\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}\n\nUnable to start thread`
            let payload: InteractionEditReplyOptions = {}

            if(ctx.client.config.features?.delete_button || ctx.can_staff_bypass) {
                payload.components = [{
                    type: 1,
                    components: [delete_button]
                }]
            }
    
            if(description.length < 4000) {
                const embed = new EmbedBuilder({
                    author: {
                        name: ctx.interaction.user.tag,
                        icon_url: ctx.interaction.user.displayAvatarURL()
                    },
                    description,
                    color: Colors.Green,
                    footer: {text: `This text has been generated by OpenAIs Chat Completion API (${data.model})`}
                })
    
                payload = {embeds: [embed]}
            } else {
                const attachment = new AttachmentBuilder(Buffer.from(`${ctx.interaction.user.tag}:\n${message}\n\nChatGPT:\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}\n\nThis response has been generated using OpenAIs Chat Completion API`), {name: `${data.id}.txt`})
                payload = {
                    content: "Unable to start thread.\nResult attached below",
                    files: [attachment]
                }
            }
            
            await (modalinteraction ?? ctx.interaction).editReply(payload)
            return;
        }

        await thread.members.add(ctx.interaction.user)

        const db_save = await ctx.database.query('INSERT INTO chats (id, user_id, messages) VALUES ($1, $2, $3) RETURNING *', [
            thread.id,
            ctx.interaction.user.id,
            [
                ...messages,
                {
                    role: "assistant",
                    content: data.choices[0]?.message.content?.trim()
                }
            ]
        ]).catch(console.error)

        const thread_msg = await thread.send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: "ChatGPT",
                    },
                    description: data.choices[0]?.message.content?.trim(),
                    color: Colors.Blue,
                    footer: {text: `This text has been generated by OpenAIs Chat Completion API (${data.model})`}
                }),
                new EmbedBuilder({
                    description: !!db_save?.rowCount ? `To create a response to ChatGPTs response use ${await ctx.client.getSlashCommandTag("chat thread")}` : "Unable to save chat for followup",
                    color: !!db_save?.rowCount ? Colors.Green : Colors.Red
                })
            ]
        })

        if(ctx.client.config.features?.delete_button|| ctx.can_staff_bypass)
            await reply.edit({
                components: [{
                    type: 1,
                    components: [delete_button]
                }]
            })
        

        if(!db_save?.rowCount) thread.setLocked(true)

        if(ctx.client.config.dev_config?.enabled && ctx.client.config.dev_config.debug_discord_messages) {
            const devembed = new EmbedBuilder({
                title: "Dev",
                description: `**ID** \`${data.id}\`
                
**Prompt Tokens** ${data.usage.prompt_tokens}
**Completion Tokens** ${data.usage.completion_tokens}
**Total Tokens** ${data.usage.total_tokens}

**System Instruction**
${system_instruction ?? "NONE"}`,
                color: Colors.Red
            })
            await thread_msg.reply({
                embeds: [devembed]
            })
        }
    }

    override async autocomplete(ctx: AutocompleteContext): Promise<any> {
        const focused = ctx.interaction.options.getFocused(true)
        switch(focused.name) {
            case "system_instruction": {
                let instructions = [
                    {
                        name: "Default",
                        value: "default"
                    },
                    ...(ctx.client.config.selectable_system_instructions?.slice(0, 24).map(i => ({
                        name: `${i.name![0]?.toUpperCase()}${i.name!.slice(1).toLowerCase()}`,
                        value: i.name!
                    })) ?? [])
                ]

                if(focused.value) instructions = instructions.filter(o => o.value.toLowerCase().includes(focused.value.toLowerCase()))

                return ctx.interaction.respond(instructions.slice(0, 25))
            }
        }
    }
}