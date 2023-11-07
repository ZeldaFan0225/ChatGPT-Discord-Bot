import { TextInputStyle } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const modal = {
    title: "Create an assistant",
    custom_id: "assistant_create",
    components: [{
        type: 1,
        components: [{
            type: 4,
            custom_id: "name",
            style: TextInputStyle.Short,
            label: "Name",
            placeholder: "Clippy",
            max_length: 256,
            required: true
        }]
    },{
        type: 1,
        components: [{
            type: 4,
            custom_id: "model",
            style: TextInputStyle.Short,
            label: "Model",
            placeholder: "gpt-4",
            value: "gpt-4",
            required: true
        }]
    },{
        type: 1,
        components: [{
            type: 4,
            custom_id: "system_instruction",
            style: TextInputStyle.Paragraph,
            label: "System Instruction",
            placeholder: "A detailed system instruction",
            value: "You are a personal assistant, assisting with any problems the user might run into.",
            required: true
        }]
    },{
        type: 1,
        components: [{
            type: 4,
            custom_id: "description",
            style: TextInputStyle.Short,
            label: "Description",
            placeholder: "A short description",
            required: false
        }]
    },{
        type: 1,
        components: [{
            type: 4,
            custom_id: "tools",
            style: TextInputStyle.Short,
            label: "Tools",
            placeholder: "code_interpreter, retrieval",
            required: false
        }]
    }]
}


export default class extends Command {
    constructor() {
        super({
            name: "assistants_create",
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.assistants && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        await ctx.interaction.showModal(modal)
    }
}