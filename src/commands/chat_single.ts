import { Colors, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { AutocompleteContext } from "../classes/autocompleteContext";
import { Config, OpenAIChatCompletionResponse } from "../types";
import {readFileSync} from "fs"
import Centra from "centra";

const config: Config = JSON.parse(readFileSync("config.json", "utf-8"))

const command_data = new SlashCommandBuilder()
    .setName("chat")
    .setDMPermission(false)
    .setDescription(`Start chatting with the AI`)
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("single")
        .setDescription("Get a single response without the possibility to followup")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("message")
            .setDescription("The message to send to the AI")
            .setRequired(true)
            .setMaxLength(config?.generation_parameters?.max_input_chars ?? 10000)
        )
    )


export default class extends Command {
    constructor() {
        super({
            name: "chat_single",
            command_data: command_data.toJSON(),
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const message = ctx.interaction.options.getString("message", true)

        const messages = []

        if(ctx.client.config.generation_parameters?.system_instruction?.length) messages.push({role: "system", content: ctx.client.config.generation_parameters?.system_instruction})

        messages.push({
            role: "user",
            content: message
        })

        await ctx.interaction.deferReply()

        const openai_req = Centra(`https://api.openai.com/v1/chat/completions`, "POST")
        .body({
            model: "gpt-3.5-turbo",
            messages,
            temperature: ctx.client.config.generation_parameters?.temperature,
            top_p: ctx.client.config.generation_parameters?.top_p,
            frequency_penalty: ctx.client.config.generation_parameters?.frequency_penalty,
            presence_penalty: ctx.client.config.generation_parameters?.presence_penalty,
            max_tokens: ctx.client.config.generation_parameters?.max_tokens === -1 ? undefined : ctx.client.config.generation_parameters?.max_tokens,
        }, "json")
        .header("Authorization", `Bearer ${process.env["OPENAI_TOKEN"]}`)

        const data: OpenAIChatCompletionResponse = await openai_req.send().then(res => res.json())

        console.log(data)

        const embed = new EmbedBuilder({
            author: {
                name: ctx.interaction.user.tag,
                icon_url: ctx.interaction.user.displayAvatarURL()
            },
            description: `${message}\n\nChatGPT:\n${data.choices[0]?.message.content ?? "Hi there"}`,
            color: Colors.Green
        })

        await ctx.interaction.editReply({
            embeds: [embed]
        })
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        return context.error()
    }
}