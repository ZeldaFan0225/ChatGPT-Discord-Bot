import { AttachmentBuilder, ButtonBuilder, Colors, EmbedBuilder, InteractionEditReplyOptions, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { Config } from "../types";
import { readFileSync } from "fs";

const config: Config = JSON.parse(readFileSync("config.json", "utf-8"))

console.log(config.selectable_system_inctructions!.slice(0, 24).map(i => ({
    name: `${i.name![0]?.toUpperCase()}${i.name!.slice(1).toLowerCase()}`,
    value: i.name!
})))

const command_data = new SlashCommandBuilder()
    .setName("chat")
    .setDMPermission(false)
    .setDescription(`Start chatting with the AI`)

    if(config.features?.chat_single) {
        command_data
        .addSubcommand(
            o => {
                o
                .setName("single")
                .setDescription("Get a single response without the possibility to followup")
                .addStringOption(
                    new SlashCommandStringOption()
                    .setName("message")
                    .setDescription("The message to send to the AI")
                    .setRequired(true)
                    .setMaxLength(config?.generation_parameters?.max_input_chars ?? 10000)
                )
                if(config.selectable_system_inctructions?.length) {
                    o.addStringOption(
                        new SlashCommandStringOption()
                        .setName("system_instruction")
                        .setDescription("The system instruction to choose")
                        .setRequired(false)
                        .addChoices(
                            {
                                name: "Default",
                                value: "default"
                            },
                            ...config.selectable_system_inctructions!.slice(0, 24).map(i => ({
                                name: `${i.name![0]?.toUpperCase()}${i.name!.slice(1).toLowerCase()}`,
                                value: i.name!
                            }))
                        )
                    )
                }
                return o;
            }
        )
    }

    if(config.features?.chat_thread) {
        command_data
        .addSubcommand(
            o => {
                o
                .setName("thread")
                .setDescription("Start a thread for chatting with ChatGPT")
                .addStringOption(
                    new SlashCommandStringOption()
                    .setName("message")
                    .setDescription("The message to send to the AI")
                    .setRequired(true)
                    .setMaxLength(config?.generation_parameters?.max_input_chars ?? 10000)
                )
                
                if(config.selectable_system_inctructions?.length) {
                    o.addStringOption(
                        new SlashCommandStringOption()
                        .setName("system_instruction")
                        .setDescription("The system instruction to choose")
                        .setRequired(false)
                        .addChoices(
                            {
                                name: "Default",
                                value: "default"
                            },
                            ...config.selectable_system_inctructions!.slice(0, 24).map(i => ({
                                name: `${i.name![0]?.toUpperCase()}${i.name!.slice(1).toLowerCase()}`,
                                value: i.name!
                            }))
                        )
                    )
                }
                return o;
            }
        )
    }
    

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


export default class extends Command {
    constructor() {
        super({
            name: "chat_single",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.chat_single) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        const message = ctx.interaction.options.getString("message", true)
        const system_instruction_name = ctx.interaction.options.getString("system_instruction") ?? "default"
        const system_instruction = system_instruction_name === "default" ? ctx.client.config.generation_parameters?.default_system_instruction : ctx.client.config.selectable_system_inctructions?.find(i => i.name?.toLowerCase() === system_instruction_name)?.system_instruction
        const messages = []

        if(system_instruction?.length) messages.push({role: "system", content: system_instruction})

        messages.push({
            role: "user",
            content: message
        })

        await ctx.interaction.deferReply()

        if(await ctx.client.checkIfPromptGetsFlagged(message)) return ctx.error({error: "Your message has been flagged to be violating OpenAIs TOS"})

        const data = await ctx.client.requestChatCompletion(messages, ctx.interaction.user.id).catch(console.error)
        if(!data) return ctx.error({error: "Something went wrong"})

        const description = `${message}\n\n**ChatGPT (${system_instruction_name}):**\n${data.choices[0]?.message.content ?? "Hi there"}`
        let payload: InteractionEditReplyOptions = {}

        if(ctx.client.config.features.delete_button || ctx.client.config.features.regenerate_button) {
            const components: {type: 1, components: ButtonBuilder[]}[] = [{
                type: 1,
                components: []
            }]

            if(ctx.client.config.features.regenerate_button) components[0]!.components.push(regenerate_button)
            if(ctx.client.config.features.delete_button) components[0]!.components.push(delete_button)

            payload.components = components
        }

        if(description.length < 4000) {
            const embed = new EmbedBuilder({
                author: {
                    name: ctx.interaction.user.tag,
                    icon_url: ctx.interaction.user.displayAvatarURL()
                },
                description,
                color: Colors.Green,
                footer: {text: "This text has been generated by OpenAIs GPT-3.5 Model"}
            })

            payload.embeds = [embed]
        } else {
            const attachment = new AttachmentBuilder(Buffer.from(`${ctx.interaction.user.tag}:\n${message}\n\nChatGPT (${system_instruction_name}):\n${data.choices[0]?.message.content ?? "Hi there"}\n\nThis response has been generated using OpenAIs GPT-3.5 model`), {name: `${data.id}.txt`})
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