import { AttachmentBuilder, Colors, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { readFileSync } from "fs";
import { AutocompleteContext } from "../classes/autocompleteContext";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { AssistantRunData, Config } from "../types";

const config: Config = JSON.parse(readFileSync("config.json", "utf-8"))

const command_data = new SlashCommandBuilder()
    .setName("assistants")
    .setDMPermission(false)
    .setDescription(`Commands all around assistants`)

    if(config.features?.assistants) {
        command_data
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("apply")
            .setDescription("Apply an assistant to this thread")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("assistant")
                .setDescription("The assistant to apply")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("create")
            .setDescription("Create an assistant")
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("export")
            .setDescription("Export the conversation")
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("thread")
            .setDescription("Create a thread to use assistants in")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("name")
                .setDescription("A short title for the thread")
                .setMaxLength(95)
            )
        )
    }


export default class extends Command {
    constructor() {
        super({
            name: "assistants_apply",
            command_data: command_data.toJSON(),
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        if(!ctx.client.config.features?.assistants && !ctx.can_staff_bypass) return ctx.error({error: "This command is disabled"})
        if(!await ctx.client.checkConsent(ctx.interaction.user.id, ctx.database)) return ctx.error({error: `You need to agree to our ${await ctx.client.getSlashCommandTag("terms")} before using this command`, codeblock: false})
        if(!ctx.is_staff && ctx.client.config.global_user_cooldown && ctx.client.cooldown.has(ctx.interaction.user.id)) return ctx.error({error: "You are currently on cooldown"})
        const assistant_id = ctx.interaction.options.getString("assistant", true)

        const thread = await ctx.database.query("SELECT * FROM assistant_threads WHERE channel_id = $1", [ctx.interaction.channelId]).then(res => res.rows[0]).catch(console.error)
        if(!thread) return ctx.error({error: "Unable to find thread"})
        if(!ctx.client.config.assistants?.allow_collaboration && thread.owner_id !== ctx.interaction.user.id) return ctx.error({error: "You are not the owner of this thread"})

        const assistants = ctx.client.assistants.filter(a => a.name.toLowerCase().startsWith(assistant_id) || a.id == assistant_id)
        if(assistants.size !== 1) return ctx.error({error: "Unable to find assistant"})
        const assistant = assistants.first()!

        await ctx.interaction.deferReply()

        const run = await ctx.client.runAssistantOnThread(thread.id, assistant.id).catch(console.error)
        if(!run || "error" in run) return ctx.error({error: "Unable to run assistant"})

        let counter = 0

        const result: boolean = await new Promise((resolve) => {
            pollResults(run)

            async function pollResults(r: AssistantRunData) {
                if(counter > (ctx.client.config.assistants?.result_fetching_max_count || 20)) return resolve(false);
                const rundata = await ctx.client.getRunData(thread.id, r.id)

                ++counter
                if(rundata.status === "completed") return resolve(true)
                else setTimeout(() => pollResults(r), 1000 * 5)
            }
        })

        if(!result) return ctx.error({error: "Unable to generate response"})

        const messages = await ctx.client.getThreadMessages(thread.id).catch(console.error)
        if(!messages || "error" in messages) return ctx.error({error: "Unable to fetch messages"})

        const message = messages.data.find(m => m.run_id == run.id)

        const content = message?.content.map(m => "text" in m ? m.text.value : "").join("\n\n") || "Something went wrong"

        if(content.length > 4000) {
            const attachment = new AttachmentBuilder(Buffer.from(content), {name: "result.txt"})

            await ctx.interaction.editReply({
                files: [attachment],
                content: "Response attached below"
            })
        }

        const embed = new EmbedBuilder({
            description: content,
            author: {
                name: "ChatGPT",
            },
            color: Colors.Blue,
            footer: {text: `This response was generated by the ${assistant.name} assistant (${assistant.model} | ${assistant.id})`}
        })

        return ctx.interaction.editReply({
            embeds: [embed]
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