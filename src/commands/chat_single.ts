import { AttachmentBuilder, ButtonBuilder, Colors, EmbedBuilder, InteractionEditReplyOptions, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { ChatCompletionMessages, Config } from "../types";
import { readFileSync } from "fs";
import { AutocompleteContext } from "../classes/autocompleteContext";

const config: Config = JSON.parse(readFileSync("config.json", "utf-8"))

const command_data = new SlashCommandBuilder()
    .setName("chat")
    .setDMPermission(false)
    .setDescription(`Start chatting with the AI`)

    if(config.features?.chat_single || config.staff_can_bypass_feature_restrictions) {
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
                )
                .addStringOption(
                    new SlashCommandStringOption()
                    .setName("system_instruction")
                    .setDescription("The system instruction to choose")
                    .setRequired(false)
                    .setAutocomplete(true)
                )

                if(config.generation_settings?.selectable_models?.length) {
                    o.addStringOption(
                        new SlashCommandStringOption()
                        .setName("model")
                        .setDescription("The model to use for this request")
                        .setRequired(false)
                        .addChoices(
                            ...config.generation_settings?.selectable_models.map(m => ({value: m, name: m}))
                        )
                    )
                }

                if(Object.values(config.models ?? {}).some(m => m.images?.supported)) {
                    o
                    .addAttachmentOption(
                        new SlashCommandAttachmentOption()
                        .setName("image")
                        .setDescription("Give an image to gpt")
                        .setRequired(false)
                    )
                }

                o.addBooleanOption(
                    new SlashCommandBooleanOption()
                    .setName("form_input")
                    .setDescription("When set to true a form will open up to input the prompt")
                )

                return o;
            }
        )
    }

    if(config.features?.chat_thread || config.staff_can_bypass_feature_restrictions) {
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
                )
                .addStringOption(
                    new SlashCommandStringOption()
                    .setName("system_instruction")
                    .setDescription("The system instruction to choose")
                    .setRequired(false)
                    .setAutocomplete(true)
                )

                if(config.generation_settings?.selectable_models?.length) {
                    o.addStringOption(
                        new SlashCommandStringOption()
                        .setName("model")
                        .setDescription("The model to use for this request")
                        .setRequired(false)
                        .addChoices(
                            ...config.generation_settings?.selectable_models.map(m => ({value: m, name: m}))
                        )
                    )
                }

                if(Object.values(config.models ?? {}).some(m => m.images?.supported)) {
                    o
                    .addAttachmentOption(
                        new SlashCommandAttachmentOption()
                        .setName("image")
                        .setDescription("Give an image to gpt")
                        .setRequired(false)
                    )
                }

                o.addBooleanOption(
                    new SlashCommandBooleanOption()
                    .setName("form_input")
                    .setDescription("When set to true a form will open up to input the prompt")
                )

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

const thread_button = new ButtonBuilder({
    label: "Start Thread",
    custom_id: "create_thread",
    style: 2
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
        if(!ctx.client.config.features?.chat_single && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        
        let message = ctx.interaction.options.getString("message", true)
        const modal = ctx.interaction.options.getBoolean("form_input") ?? false

        const model_configuration_name = ctx.interaction.options.getString("model") ?? ctx.client.config.generation_settings?.default_model
        if(!model_configuration_name) return ctx.error({error: "No model found"})
        const model_configuration = ctx.client.config.models?.[model_configuration_name]
        if(!model_configuration) return ctx.error({error: "No model found"})

        const system_instruction_name = ctx.interaction.options.getString("system_instruction") ?? "default"
        const system_instruction = system_instruction_name === "default" ? 
            ctx.client.config.generation_settings?.default_system_instruction :
            ctx.client.config.selectable_system_instructions?.find(i => i.name?.toLowerCase() === system_instruction_name?.toLowerCase())?.system_instruction ?? ctx.client.config.generation_settings?.default_system_instruction
        
        if(!system_instruction && system_instruction_name !== "default") return ctx.error({error: "Unable to find system instruction"})
    
        const image = ctx.interaction.options.getAttachment("image")

        if(image && !ctx.client.config.features?.image_in_prompt) return ctx.error({error: "Images in prompts are disabled"})
        if(image && !model_configuration.images?.supported) return ctx.error({error: "This model doesn't support images"})

        const messages: ChatCompletionMessages[] = []

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

        if(count > (model_configuration.max_model_tokens ?? 4096)) return ctx.error({error: "Please shorten your prompt"})

        if(system_instruction?.length) messages.push({role: "system", content: system_instruction})

        messages.push({
            role: "user",
            content: !image ? message : [
                {
                    type: "text",
                    text: message
                },
                {
                    type: "image_url",
                    image_url: {
                        url: image.url,
                        detail: model_configuration?.images?.supported ? model_configuration.images.detail || "auto" : "auto"
                    }
                }
            ]
        })

        if(model_configuration.moderation?.enabled && await ctx.client.checkIfPromptGetsFlagged(message))
            return ctx.error({error: "Your message has been flagged to be violating OpenAIs TOS"})

        const data = await ctx.client.requestChatCompletion(messages, model_configuration, ctx.interaction.user.id, ctx.database).catch(console.error)
        if(!data) return ctx.error({error: "Something went wrong"})

        const description = `${message}\n\n**AI ChatBot (${system_instruction_name}):**\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}`
        let payload: InteractionEditReplyOptions = {}

        if((ctx.client.config.features?.delete_button || ctx.client.config.features?.regenerate_button || ctx.client.config.features?.chat_thread) || ctx.can_staff_bypass) {
            const components: {type: 1, components: ButtonBuilder[]}[] = [{
                type: 1,
                components: []
            }]

            if(ctx.client.config.features?.regenerate_button || ctx.can_staff_bypass) components[0]!.components.push(regenerate_button)
            if(ctx.client.config.features?.delete_button || ctx.can_staff_bypass) components[0]!.components.push(delete_button)
            if(ctx.client.config.features?.chat_thread || ctx.can_staff_bypass) components[0]!.components.push(thread_button)

            payload.components = components
        }

        data.object

        payload.files = []
        if(image) payload.files.push(image)

        if(description.length < 4000) {
            const embed = new EmbedBuilder({
                author: {
                    name: ctx.interaction.user.username,
                    icon_url: ctx.interaction.user.displayAvatarURL()
                },
                image: image ? {url: `attachment://${image?.name}`} : undefined,
                description,
                color: Colors.Green,
                footer: {text: `This text has been generated by AI (${model_configuration_name})`}
            })

            payload.embeds = [embed]
        } else {
            const attachment = new AttachmentBuilder(Buffer.from(`${ctx.interaction.user.username}:\n${message}\n\nAI ChatBot (${system_instruction_name}):\n${data.choices[0]?.message.content?.trim() ?? "Hi there"}\n\nThis response has been generated using OpenAIs Chat Completion API`), {name: `${data.id}.txt`})
            payload.content = "Result attached below"
            payload.files.push(attachment)
        }

        if(ctx.client.config.global_user_cooldown) ctx.client.cooldown.set(ctx.interaction.user.id, Date.now(), ctx.client.config.global_user_cooldown)
        const res = await (modalinteraction ?? ctx.interaction).editReply(payload)

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
\`\`\`

**System Instruction**
${system_instruction ?? "NONE"}`,
                color: Colors.Red
            })
            await res.reply({
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