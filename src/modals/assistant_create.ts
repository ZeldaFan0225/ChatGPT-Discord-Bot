import { Modal } from "../classes/modal";
import { ModalContext } from "../classes/modalContext";
import { AssistantCreateOptions } from "../types";


export default class extends Modal {
    constructor() {
        super({
            name: "assistant_create",
            staff_only: true,
            regex: /assistant_create/
        })
    }

    override async run(ctx: ModalContext): Promise<any> {
        if(!ctx.client.config.features?.assistants && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        const name = ctx.interaction.fields.getTextInputValue("name")
        const model = ctx.interaction.fields.getTextInputValue("model")
        const system_instruction = ctx.interaction.fields.getTextInputValue("system_instruction")
        const description = ctx.interaction.fields.getTextInputValue("description") || undefined
        const tools_str = ctx.interaction.fields.getTextInputValue("tools")

        await ctx.interaction.deferReply()

        const models = await ctx.client.getModels().catch(console.error)
        if(!models?.data.find(m => m.id === model)) return ctx.error({error: "Invalid model"})

        const tools = []
        if(tools_str.includes("code_interpreter")) tools.push({type: "code_interpreter" as const})
        if(tools_str.includes("retrieval")) tools.push({type: "retrieval" as const})

        const options: AssistantCreateOptions = {
            model,
            name,
            description,
            instructions: system_instruction,
            tools,
            metadata: {
                "CREATED_BY": "ChatGPTBot"
            }
        }

        const assistant = await ctx.client.createAssistant(options).catch(console.error)
		if(ctx.client.config.dev_config?.enabled && ctx.client.config.dev_config.debug_logs) console.log(assistant)
        if(!assistant || "error" in assistant) {
            console.error(assistant)
            return ctx.error({error: assistant && "error" in assistant ? assistant.error.message : "Failed to create assistant"})
        }

        ctx.client.assistants.set(assistant.id, assistant)

        return await ctx.interaction.editReply({
            content: `Successfully created assistant with ID \`${assistant.id}\`\nNow save the assistant ID in the config to make it available for use.`
        })
    }
}