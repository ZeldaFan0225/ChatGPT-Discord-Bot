import { AttachmentBuilder, ButtonBuilder, Colors, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { readFileSync } from "fs";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { Config } from "../types";

const config: Config = JSON.parse(readFileSync("config.json", "utf-8"))

const command_data = new SlashCommandBuilder()
    .setName("create_image")
    .setDMPermission(false)
    .setDescription(`Create an image using DallE-3`)

    if(config.features?.create_image) {
        command_data
        .addStringOption(
            new SlashCommandStringOption()
            .setName("prompt")
            .setDescription("The prompt for DallE-3, the more details the better")
            .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
            .setName("style")
            .setDescription("The style of the image")
            .addChoices(
                {
                    name: "Vivid",
                    value: "vivid"
                },
                {
                    name: "Natural",
                    value: "natural"
                }
            )
        )
        .addStringOption(
            new SlashCommandStringOption()
            .setName("size")
            .setDescription("The resulting images size")
            .addChoices(
                {
                    name: "1024x1024",
                    value: "1024x1024"
                },
                {
                    name: "1024x1792",
                    value: "1024x1792"
                },
                {
                    name: "1792x1024",
                    value: "1792x1024"
                }
            )
        )

    }
    
const delete_button = new ButtonBuilder({
    emoji: {name: "🚮"},
    custom_id: "delete",
    style: 4
})

const sizes = [
    "1024x1024",
    "1024x1792",
    "1792x1024"
]

export default class extends Command {
    constructor() {
        super({
            name: "create_image",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.chat_single && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})

        const prompt = ctx.interaction.options.getString("prompt", true)
        const style = ctx.interaction.options.getString("style") || undefined
        const size = ctx.interaction.options.getString("size") || ctx.client.config.generate_image?.default_size || "1024x1024"
        const quality = ctx.client.config.generate_image?.quality

        if(size && !sizes.includes(size)) return ctx.error({error: "Invalid size"})
        if(style && (style !== "natural" && style !== "vivid")) return ctx.error({error: "Invalid style"})
        

        const options = {
            model: ctx.client.config.default_dalle_model || "dall-e-3",
            prompt,
            style: style as "natural" | "vivid",
            size: size as "1024x1024",
            quality,
            user: ctx.interaction.user.id
        }

        await ctx.interaction.deferReply();
        
        if(await ctx.client.checkIfPromptGetsFlagged(prompt)) return ctx.error({error: "Your message has been flagged to be violating OpenAIs TOS"})

        const imagedata = await ctx.client.requestImageGeneration(options).catch(console.error)

        if(!imagedata || !imagedata.data[0]) return ctx.error({error: "Unable to generate image"})

        const req = await fetch(imagedata.data[0]?.url)
        const attachment = new AttachmentBuilder(Buffer.from(await req.arrayBuffer()), {name: `${imagedata.created}.png`})
        const prompts = new AttachmentBuilder(Buffer.from(`Original Prompt:\n${prompt}\n\n\nRevised Prompt:\n${imagedata.data[0]?.revised_prompt}`), {name: "prompts.txt"})

        const embed = new EmbedBuilder({
            author: {
                name: ctx.interaction.user.username,
                icon_url: ctx.interaction.user.displayAvatarURL()
            },
            description: (imagedata.data[0]?.revised_prompt || prompt).slice(0, 4000),
            image: {url: `attachment://${imagedata.created}.png`},
            color: Colors.Green,
            footer: {text: `This Image was generated using OpenAIs DallE-3 (${ctx.client.config.default_dalle_model})`}
        })

        return ctx.interaction.editReply({
            embeds: [embed],
            files: [attachment, prompts],
            components: [{type: 1, components: [delete_button]}]
        })
    }
}