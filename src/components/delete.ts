import { ComponentType } from "discord.js";
import { Component } from "../classes/component";
import { ComponentContext } from "../classes/componentContext";


export default class extends Component {
    constructor() {
        super({
            name: "delete",
            staff_only: false,
            regex: /^delete$/
        })
    }

    override async run(ctx: ComponentContext<ComponentType.Button>): Promise<any> {
        if(!ctx.client.config.features?.delete_button && !ctx.can_staff_bypass) return ctx.error({error: "This action is disabled"})
        await ctx.interaction.deferUpdate()
        const message = ctx.interaction.message
        if(message.interaction?.user.id !== ctx.interaction.user.id && !ctx.is_staff) return;
        if(message.interaction?.commandName === "chat thread") {
            await message.thread?.delete()
        }
        await ctx.interaction.deleteReply()
    }
}