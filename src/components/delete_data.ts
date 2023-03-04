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
        const res = await ctx.database.query("DELETE FROM user_data WHERE user_id=$1", [ctx.interaction.user.id]).catch(console.error)
        if(res?.rowCount) ctx.client.cooldown.delete(ctx.interaction.user.id)
        await ctx.interaction.reply({
            ephemeral: true,
            content: res?.rowCount ? "Data deleted successfully" : "Unable to find and delete data"
        })
    }
}