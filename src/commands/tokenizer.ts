import { Colors, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("tokenize")
    .setDMPermission(false)
    .setDescription(`Tokenizes the given string`)
    .addStringOption(
        new SlashCommandStringOption()
        .setName("text")
        .setDescription("The text to tokenize")
        .setRequired(true)
    )


export default class extends Command {
    constructor() {
        super({
            name: "tokenize",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const text = ctx.interaction.options.getString("text", true)
        const data = ctx.client.tokenizeString(text)

        const embed = new EmbedBuilder({
            title: "Tokenized string",
            description: `\`\`\`ansi\n${data.text.map((t, i) => data.count <= 82 ? `\u001b[0;${40 + (i%3)}m${t}` : `${t}|`).join("")}\`\`\`\n**Total Count** ${data.count}${text.length <= 2000 ? `\n\`\`\`\n${data.tokens.join(", ")}\`\`\`` : ""}`,
            color: Colors.Blue
        })

        if((embed.data.description?.length ?? 0) > 4096) return ctx.error({error: "Input too long"})

        return ctx.interaction.reply({embeds: [embed]})
    }
}