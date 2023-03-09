import { ComponentType } from "discord.js";
import { Component } from "../classes/component";
import { ComponentContext } from "../classes/componentContext";


export default class extends Component {
    constructor() {
        super({
            name: "consent",
            staff_only: false,
            regex: /consent/
        })
    }

    override async run(ctx: ComponentContext<ComponentType.Button>): Promise<any> {
        const insert = await ctx.database.query("INSERT INTO user_data (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET consent=true RETURNING *", [ctx.interaction.user.id]).catch(console.error)
        if(!insert?.rowCount) return ctx.error({error: "Unable to accept terms"})

        ctx.client.cache.set(ctx.interaction.user.id, true, 1000 * 60)

        await ctx.interaction.reply({
            content: "Terms accepted",
            ephemeral: true
        })
    }
}