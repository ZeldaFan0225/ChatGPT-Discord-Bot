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
            description: `Data which can be deleted:\n- The data that you agreed to the terms\n\nData which can't be deleted:\n- Prompts which you used to generate text\n- Any further logging\n\nData which will be automatically deleted:\n- Conversations created with ${await ctx.client.getSlashCommandTag("chat thread")} (30 days)\n\nTo delete deletable data press the button below. There will not be any further confirmation and the action **can not** be undone!`
        })

        return ctx.interaction.reply({
            ephemeral: true,
            embeds: [embed],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Delete Data",
                    style: 4,
                    custom_id: "delete_data"
                }]
            }]
        })
    }
}