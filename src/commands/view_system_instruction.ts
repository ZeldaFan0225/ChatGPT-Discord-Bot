import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { Config } from "../types";
import {readFileSync} from "fs"
import { AutocompleteContext } from "../classes/autocompleteContext";

const config: Config = JSON.parse(readFileSync("config.json", "utf-8"))

const command_data = new SlashCommandBuilder()
    .setName("view_system_instruction")
    .setDMPermission(false)
    .setDescription(`View a system instruction`)

    if(config.selectable_system_instructions?.length || config.staff_can_bypass_feature_restrictions) {
        command_data.addStringOption(
            new SlashCommandStringOption()
            .setName("system_instruction")
            .setDescription("The system instruction to choose")
            .setRequired(true)
            .setAutocomplete(true)
        )
    }


export default class extends Command {
    constructor() {
        super({
            name: "view_system_instruction",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.view_system_instruction && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        const system_instruction_name = ctx.interaction.options.getString("system_instruction") ?? "default"
        const system_instruction = system_instruction_name === "default" ? ctx.client.config.generation_parameters?.default_system_instruction : ctx.client.config.selectable_system_instructions?.find(i => i.name?.toLowerCase() === system_instruction_name)?.system_instruction
        if(system_instruction_name !== "default" && !system_instruction) return ctx.error({error: "Unable to find system instruction"})

        await ctx.interaction.reply({
            content: `System instruction \`${system_instruction_name}\`:\n\n${system_instruction ?? "NONE"}`,
            ephemeral: true
        })
    }

    override async autocomplete(ctx: AutocompleteContext): Promise<any> {
        const focused = ctx.interaction.options.getFocused(true)
        switch(focused.name) {
            case "system_instruction": {
                let instructions = [
                    {
                        name: "Default",
                        value: "default"
                    },
                    ...(ctx.client.config.selectable_system_instructions?.slice(0, 24).map(i => ({
                        name: `${i.name![0]?.toUpperCase()}${i.name!.slice(1).toLowerCase()}`,
                        value: i.name!
                    })) ?? [])
                ]

                if(focused.value) instructions = instructions.filter(o => o.value.toLowerCase().includes(focused.value.toLowerCase()))

                return ctx.interaction.respond(instructions.slice(0, 25))
            }
        }
    }
}