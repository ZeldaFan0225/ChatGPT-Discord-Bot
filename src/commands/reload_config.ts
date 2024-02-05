import { ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("reload_config")
    .setDMPermission(false)
    .setDescription(`Reloads the bots config.`)


export default class extends Command {
    constructor() {
        super({
            name: "reload_config",
            command_data: command_data.toJSON(),
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        ctx.client.reloadConfig()
        
        const configurable_msg_cmds = ctx.client.config.message_context_actions?.map((a, i) => 
            new ContextMenuCommandBuilder()
                .setType(ApplicationCommandType.Message)
                .setName(a.name ?? `Unknown Action ${i}`)
                .setDMPermission(false)
                .toJSON()
        ) || []
        await ctx.client.application?.commands.set([...ctx.client.commands.createPostBody(), ...ctx.client.contexts.createPostBody(), ...configurable_msg_cmds]).catch(console.error)

        await ctx.interaction.reply({
            content: "Config and Commands reloaded!",
            ephemeral: true
        })
    }
}