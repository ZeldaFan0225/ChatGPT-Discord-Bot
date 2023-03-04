import { ComponentType } from "discord.js";
import { Component } from "../classes/component";
import { ComponentContext } from "../classes/componentContext";


export default class extends Component {
    constructor() {
        super({
            name: "delete",
            staff_only: false,
            regex: /delete/
        })
    }

    override async run(ctx: ComponentContext<ComponentType.Button>): Promise<any> {
        await ctx.interaction.deferUpdate()
        const message = ctx.interaction.message
        if(message.interaction?.user.id !== ctx.interaction.user.id) return;
        if(message.interaction?.commandName === "chat thread") {
            await message.thread?.delete()
        }
        await message.delete()
    }
}