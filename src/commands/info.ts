import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("info")
    .setDMPermission(false)
    .setDescription(`Information about the bot`)


export default class extends Command {
    constructor() {
        super({
            name: "info",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const embed = new EmbedBuilder({
            title: "Info",
            color: Colors.Blue,
            description: `This bot acts as an interface with the OpenAI GPT-3.5 turbo model.\nThis bot is open source and can be viewed on [GitHub](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot).\n**There is no guarantee that this instance of the bot is unmodified**\n\nCurrent configuration:\n**Logging** ${ctx.client.config.logs?.enabled ? "Enabled" : "Disabled"}`
        })

        return ctx.interaction.reply({
            ephemeral: true,
            embeds: [embed]
        })
    }
}