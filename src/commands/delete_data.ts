import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("delete_data")
    .setDMPermission(false)
    .setDescription(`Information about how to delete data saved about you`)


export default class extends Command {
    constructor() {
        super({
            name: "delete_data",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const embed = new EmbedBuilder({
            title: "Delete data saved about you",
            color: Colors.Red,
            description: `Data which can't be deleted:\n- Amount of tokens generated\n- Analytic data\n- Prompts which you used to generate text\n- Any further logging\n\nData which will be automatically deleted:\n- Conversations created with ${await ctx.client.getSlashCommandTag("chat thread")} (30 days)\n\nIf you require deletion of all data contact the owner of the bot.`
        })

        return ctx.interaction.reply({
            ephemeral: true,
            embeds: [embed]
        })
    }
}