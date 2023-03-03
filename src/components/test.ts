import { ComponentType } from "discord.js";
import { Component } from "../classes/component";
import { ComponentContext } from "../classes/componentContext";


export default class extends Component {
    constructor() {
        super({
            name: "test",
            staff_only: false,
            regex: /./
        })
    }

    override async run(ctx: ComponentContext<ComponentType.StringSelect>): Promise<any> {
        ctx.interaction.reply({
            content: "Hey There",
            ephemeral: true
        })
    }
}