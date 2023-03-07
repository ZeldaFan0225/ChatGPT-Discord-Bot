import { SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("set_blacklist")
    .setDMPermission(false)
    .setDescription(`Sets the blacklisted state for a user`)
    .addBooleanOption(
        new SlashCommandBooleanOption()
        .setName("blacklisted")
        .setDescription("Whether this user is blacklisted")
        .setRequired(true)
    )
    .addUserOption(
        new SlashCommandUserOption()
        .setName("user")
        .setDescription("The user to blacklist")
        .setRequired(true)
    )


export default class extends Command {
    constructor() {
        super({
            name: "set_blacklist",
            command_data: command_data.toJSON(),
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const state = ctx.interaction.options.getBoolean("blacklisted", true)
        const user = ctx.interaction.options.getUser("user", true)

        const res = await ctx.database.query("INSERT INTO user_data (user_id, consent, blacklisted) VALUES ($1, false, $2) ON CONFLICT (user_id) DO UPDATE SET blacklisted=$2 RETURNING *", [user.id, state]).catch(console.error)

        if(!res?.rowCount) return ctx.error({error: "Unable to set blacklist"})
        ctx.client.blacklisted.set(user.id, state, 1000 * 60)
        return await ctx.interaction.reply({
            content: `${state ? "Added" : "Removed"} blacklist for ${user.tag} (\`${user.id}\`)`,
            ephemeral: true
        })
    }
}