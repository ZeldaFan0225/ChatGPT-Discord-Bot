import { GuildMember, Message } from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "../classes/client";

export async function handleMessage(message: Message, client: ChatGPTBotClient, database: Pool): Promise<any> {
    if(message.channel.isThread() && !message.author.bot) {
        const thread = await database.query("SELECT * FROM assistant_threads WHERE channel_id=$1", [message.channelId]).catch(console.error)
        if(thread?.rows.length) {
            if(message.content.startsWith("//")) return;
            if(thread.rows[0].owner_id !== message.author.id && !client.config.assistants?.allow_collaboration) return message.react("🛑");
            const result = await client.addMessageToThread(thread.rows[0].id, {
                content: message.content,
                role: "user",
                metadata: {
                    "DISCORD_USER": message.author.id,
                }
            })

            if(!result || "error" in result) message.react("❌")
            message.react("✅")
            return;
        }
    }

    await heyGPT(message, client, database)
}

function can_staff_bypass(member: GuildMember, client: ChatGPTBotClient) {
    return client.config.staff_can_bypass_feature_restrictions && client.is_staff(member)
}

async function error(message: Message, content: string) {
    return await message.reply({content}).then((m) => setTimeout(() => m.delete(), 1000 * 30));
}

async function heyGPT(message: Message, client: ChatGPTBotClient, database: Pool) {
    if(!message.member || !client.config.hey_gpt?.activation_phrases) return;
    const phrases = (client.config.hey_gpt?.activation_phrases || []) as (string | {phrase: string;system_instruction: string; model?: string; allow_images?: boolean})[]
    const activation_phrase = phrases.find(p => message.content.toLowerCase().startsWith((typeof p === "string" ? p : p.phrase).toLowerCase()))
    if(!activation_phrase) return;
    const activation_data = typeof activation_phrase === "string" ? undefined : activation_phrase
    if(!client.config.hey_gpt?.enabled && !can_staff_bypass(message.member, client)) return;
    if(!await client.checkConsent(message.author.id, database)) return error(message, `You need to agree to our ${await client.getSlashCommandTag("terms")} before using this action`);
    if(!client.is_staff(message.member) && client.config.global_user_cooldown && client.cooldown.has(message.member.id)) return error(message, "You are currently on cooldown")
    if(!client.is_staff(message.member) && (message.member.roles.cache.some(r => client.config.blacklist_roles?.includes(r.id)) || await client.checkBlacklist(message.member.id, database))) return;

    if(client.config.hey_gpt.moderate_prompts) {
        const flagged = await client.checkIfPromptGetsFlagged(message.content)
        if(flagged) return;
    }
    
    await message.react(client.config.hey_gpt.processing_emoji || "⏳")

    const system_instruction = activation_data?.system_instruction || client.config.hey_gpt.system_instruction


    const messages: {role: string, content: any}[] = [
        {
            role: "system",
            content: system_instruction || "Hey GPT what's the time?"
        },
        {
            role: "user",
            content: `The current date and time is ${new Date().toUTCString()}. My Discord Username is "${message.member.displayName}".`
        },
        
    ]

    if(activation_data?.allow_images) {
        const images = message.attachments.filter(a => a.contentType?.includes("image"))
        messages.push({
            role: "user",
            content: [
                {
                    type: "text" as const,
                    text: message.content
                },
                ...images.map(i => ({
                    type: "image_url" as const,
                    image_url: i.url
                }))
            ]
        })
    } else {
        messages.push({
            role: "user",
            content: message.content
        })
    }

    const data = await client.requestChatCompletion(messages, message.author.id, database, {
        model: activation_data?.model || client.config.hey_gpt.model
    }).catch(console.error)
    
    if(!data) return message.reactions.cache.get(client.config.hey_gpt.processing_emoji || "⏳")?.users.remove(client.user!).catch(console.error)

    await message.reactions.cache.get(client.config.hey_gpt.processing_emoji || "⏳")?.users.remove(client.user!).catch(console.error)

    if(!data.choices[0]?.message.content) return;

    const messageContent = data.choices[0].message.content

    for(let i = 0; i < Math.ceil(messageContent.length / 1900); ++i) {
        await message.reply({
            content: messageContent.slice((i * 1900), ((i + 1) * 1900)) + (messageContent.length > 1900 ? `\n\n**Response** \`${i+1}\` / \`${Math.ceil(messageContent.length / 1900)}\`` : ""),
            allowedMentions: {parse: []}
        })
    }
    
    if(client.config.global_user_cooldown) client.cooldown.set(message.author.id, Date.now(), client.config.global_user_cooldown)
}