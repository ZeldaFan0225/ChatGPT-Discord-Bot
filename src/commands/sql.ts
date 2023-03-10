import { AttachmentBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import {inspect} from "util"

const command_data = new SlashCommandBuilder()
    .setName("sql")
    .setDMPermission(false)
    .setDescription(`Query the database`)
    .addStringOption(
        new SlashCommandStringOption()
        .setName("query")
        .setDescription("The query you want to query")
        .setRequired(true)
    )


export default class extends Command {
    constructor() {
        super({
            name: "sql",
            command_data: command_data.toJSON(),
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.owner_ids?.includes(ctx.interaction.user.id)) return ctx.error({error: "You can't use this command"})
        let query = ctx.interaction.options.getString("query", true)
        let res = await ctx.database.query(query).catch(e => e)
        let text = inspect(res, {depth: 5})
        if(text.length > 1900) {
            let file = new AttachmentBuilder(Buffer.from(text), {name: "result.txt"})
            ctx.interaction.reply({files: [file], content: "Result attached"})
        } else {
            ctx.interaction.reply({content: `\`\`\`json\n${text}\n\`\`\``})
        }
    }
}