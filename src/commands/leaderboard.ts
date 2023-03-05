import { ButtonBuilder, Colors, EmbedBuilder, InteractionEditReplyOptions, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDMPermission(false)
    .setDescription(`Shows the total tokens leaderboard`)

const delete_button = new ButtonBuilder({
    emoji: {name: "🚮"},
    custom_id: "delete",
    style: 4
})

export default class extends Command {
    constructor() {
        super({
            name: "leaderboard",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if((!ctx.client.config.features?.user_stats || !ctx.client.config.features?.user_leaderboard) && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        await ctx.interaction.deferReply()
        const leaders_query = await ctx.database.query(`SELECT * FROM user_data ORDER BY tokens DESC LIMIT ${ctx.client.config.leaderboard_amount_users || 10}`).catch(console.error)
        const own_query = await ctx.database.query("SELECT * FROM user_data WHERE user_id=$1", [ctx.interaction.user.id]).catch(console.error)
        const total = await ctx.database.query("SELECT SUM(tokens) as total FROM user_data").catch(console.error)
        
        if(!leaders_query?.rowCount || !own_query?.rowCount) return ctx.error({error: "Unable to generate leaderboard", codeblock: true})

        const leaders = leaders_query.rows
        if(!leaders.find(l => l.user_id === ctx.interaction.user.id)) leaders.push(own_query.rows[0])
        
        const lines = await Promise.all(leaders.map(async (l, i) => {
            const user = await ctx.client.users.fetch(l.user_id).catch(console.error)
            return `${i == 10 ? "...\n" : ""}${i == 0 ? "👑" : ""}**${user?.tag ?? "Unknown User#0001"}** \`${l.tokens}\` Tokens (about \`${Math.round(l.tokens/10 * 0.002)/100}$\`)`
        }))

        const embed = new EmbedBuilder({
            title: "Spent tokens leaderboard",
            description: lines.join("\n") + `\n\n**Total Tokens** \`${total?.rows?.[0].total ?? 0}\` (about \`${Math.round(Number(total?.rows?.[0].total ?? 0)/10 * 0.002)/100}$\`)\nAll prices are based on estimations, no guarantees that they are right.`,
            color: Colors.Green
        })

        const payload: InteractionEditReplyOptions = {
            embeds: [embed]
        }

        if(ctx.client.config.features?.delete_button || ctx.can_staff_bypass) payload.components = [{
            type: 1,
            components: [delete_button]
        }]

        await ctx.interaction.editReply(payload)
    }
}