import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


export default class extends Command {
    constructor() {
        super({
            name: "assistants_thread",
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.assistants && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        const name = ctx.interaction.options.getString("name")

        const msg = await ctx.interaction.deferReply({fetchReply: true})

        const discordThread = await msg.startThread({
            name: name ? `[AI] ${name}` : `[AI] ${ctx.interaction.user.username}s assistant thread`
        }).catch(console.error)

        if(!discordThread) return ctx.error({error: "Failed to create thread"})

        const openAIThread = await ctx.client.createThread(discordThread.id).catch(console.error)

        if(!openAIThread || "error" in openAIThread) {
            await discordThread.delete();
            return ctx.error({error: "Unable to create OpenAI thread"})
        }

        await ctx.interaction.editReply({
            content: "Successfully created thread"
        })

        await discordThread.members.add(ctx.interaction.user)

        await ctx.database.query("INSERT INTO assistant_threads (id, channel_id, owner_id) VALUES ($1, $2, $3)", [openAIThread.id, discordThread.id, ctx.interaction.user.id]).catch(console.error)

        await discordThread.send({
            content: `# Welcome to Assistant Threads\n\n## Quickstart Guide\n- Send a message to add a message\n - ✅ means saved successfully\n - ❌ means failed to save\n - 🛑 means you can't contribute in this thread\n - no reaction means the assistants are sleeping (or unexpected errors)\n- use ${await ctx.client.getSlashCommandTag("assistants apply")} to apply an assistant\n- send messages prefixed with // to make them not get picked up\n- Images will not be shown to the assistant`
        })
    }
}