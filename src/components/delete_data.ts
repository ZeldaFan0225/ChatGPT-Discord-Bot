import { ComponentType } from "discord.js";
import { Component } from "../classes/component";
import { ComponentContext } from "../classes/componentContext";


export default class extends Component {
    constructor() {
        super({
            name: "delete_data",
            staff_only: false,
            regex: /^delete_data$/
        })
    }

    override async run(ctx: ComponentContext<ComponentType.Button>): Promise<any> {
        const res = await ctx.database.query("SELECT * FROM user_data WHERE user_id=$1", [ctx.interaction.user.id]).catch(console.error)
        if(!res?.rowCount) return ctx.error({error: "Unable to find data"})
        const user = res.rows[0]!
        if(user.blacklisted) {
            const updated = await ctx.database.query("UPDATE user_data SET tokens=0, consent=false WHERE user_id=$1", [ctx.interaction.user.id]).catch(console.error)
            if(!updated?.rowCount) return ctx.error({error: "Unable to delete data"})
            ctx.client.cache.delete(ctx.interaction.user.id)
            await anonymizeTokens()
            return await ctx.interaction.reply({
                ephemeral: true,
                content: `You have been blacklisted.\nYour consent has been reset and your analytic data has been anonymized.\nYour blacklisted state can't be deleted.\nTo completely remove your data (blacklisted state and logs) contact the owner of the bot.`
            })
        } else {
            const deleted = await ctx.database.query("DELETE FROM user_data WHERE user_id=$1", [ctx.interaction.user.id]).catch(console.error)
            if(!deleted?.rowCount) return ctx.error({error: "Unable to delete data"})
            ctx.client.cache.delete(ctx.interaction.user.id)
            await anonymizeTokens()
            return await ctx.interaction.reply({
                ephemeral: true,
                content: `Your data has been deleted.\nSome data may remain in logs.\nYour used tokens have been anonymized.\nIf you require deletion of logs contact the owner of the bot.`
            })
        }

        async function anonymizeTokens() {
            await ctx.database.query("INSERT INTO user_data (user_id, tokens) VALUES ('0', $1) ON CONFLICT (user_id) DO UPDATE SET tokens=user_data.tokens+$1", [user.tokens])
        }
    }
}