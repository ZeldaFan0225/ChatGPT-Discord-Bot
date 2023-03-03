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
            description: `This bot acts as an interface with the OpenAI GPT-3.5 turbo model.\nThe bot saves inputs and outputs of ${await ctx.client.getSlashCommandTag("chat thread")} for 30 days to provide an optimized experience.`
        })

        return ctx.interaction.reply({
            embeds: [embed]
        })
    }
}