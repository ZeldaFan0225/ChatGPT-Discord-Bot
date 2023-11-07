import { AttachmentBuilder } from "discord.js";
import { AutocompleteContext } from "../classes/autocompleteContext";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


export default class extends Command {
    constructor() {
        super({
            name: "assistants_export",
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.assistants && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})

        const thread = await ctx.database.query("SELECT * FROM assistant_threads WHERE channel_id = $1", [ctx.interaction.channelId]).then(res => res.rows[0]).catch(console.error)
        if(!thread) return ctx.error({error: "Unable to find thread"})
        if(!ctx.client.config.assistants?.allow_collaboration && thread.owner_id !== ctx.interaction.user.id) return ctx.error({error: "You are not the owner of this thread"})

        await ctx.interaction.deferReply()

        const messages = await ctx.client.getThreadMessages(thread.id).catch(console.error)
        if(!messages || "error" in messages) return ctx.error({error: "Unable to get messages"})

        const messages_prepared = messages.data.reverse().map(m => `${m.role === "user" ? `User (${m.metadata["DISCORD_USER"] || "unknown"})` : `Assistant (${m.assistant_id})`}\n------------------\n${m.content.map(m => "text" in m ? m.text.value : "").join("\n\n") || "Something went wrong"}`)

        const attachment = new AttachmentBuilder(Buffer.from(messages_prepared.join("\n\n\n")), {name: "messages.txt"})

        ctx.interaction.editReply({
            files: [attachment],
            content: "Here are all messages from this thread"
        })
    }
    
    override async autocomplete(context: AutocompleteContext): Promise<any> {
        const focused = context.interaction.options.getFocused(true)
        switch(focused.name) {
            case "assistant": {
                const assistants = context.client.assistants.filter(a => a.name.toLowerCase().startsWith(focused.value.toLowerCase()) || a.id == focused.value)
                return context.interaction.respond(
                    assistants.map(a => ({
                        name: `${a.name} | ${a.model} | ${[...new Set(a.tools.map(t => t.type))].join(", ")}`,
                        value: a.id
                    }))
                )
            }
        }
    }
}