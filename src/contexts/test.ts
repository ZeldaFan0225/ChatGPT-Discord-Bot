import { ApplicationCommandType, ContextMenuCommandBuilder } from "discord.js";
import { Context } from "../classes/context";
import { ContextContext } from "../classes/contextContext";

const command_data = new ContextMenuCommandBuilder()
    .setType(ApplicationCommandType.User)
    .setName("Test")
    .setDMPermission(false)

export default class extends Context {
    constructor() {
        super({
            name: "Test",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: ContextContext<ApplicationCommandType.User>): Promise<any> {
        ctx.interaction.reply({
            content: "Hey There",
            ephemeral: true
        })
    }
}