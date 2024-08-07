import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("terms")
    .setDMPermission(false)
    .setDescription(`Shows terms of usage`)


export default class extends Command {
    constructor() {
        super({
            name: "terms",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const embed = new EmbedBuilder({
            title: "Terms of Service",
            color: Colors.Blue,
            description: `Below you can read our terms.\nYou can accept them by pressing the button below.\n\n1) Your requests are being saved for moderation purposes\n1.1) Chats you create with ${await ctx.client.getSlashCommandTag("chat thread")} are saved for 30 days and then deleted. This period is not influenceable in any way.\n2) This set of terms can change at any point.\n3) Generating content which is against Discords TOS or the TOS of the provider of the LLM might get you reported\n4) You agree to your Discord User ID being passed to the LLM provider\n5) You agree that you can not delete saved data after agreeing to these terms.\n6) You agree to your rough bot usage being visible in the ${await ctx.client.getSlashCommandTag("leaderboard")}\n7) You agree to analytical data to be saved (such as generated tokens)\n\nCurrent configuration:\n**Logging** ${ctx.client.config.logs?.enabled ? "Enabled" : "Disabled"}`
        })

        return ctx.interaction.reply({
            ephemeral: true,
            embeds: [embed],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Accept Terms",
                    custom_id: "consent",
                    style: 1
                }]
            }]
        })
    }
}