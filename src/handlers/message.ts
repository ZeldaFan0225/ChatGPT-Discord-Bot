import { GuildMember, Message } from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "../classes/client";

export async function handleMessage(message: Message, client: ChatGPTBotClient, database: Pool): Promise<any> {
    if(!message.member) return;
    if(!client.config.hey_gpt?.activation_phrases?.some(p => message.content.toLowerCase().startsWith(p.toLowerCase()))) return;
    if(!client.config.hey_gpt?.enabled && !can_staff_bypass(message.member, client)) return;
    if(!await client.checkConsent(message.author.id, database)) return error(message, `You need to agree to our ${await client.getSlashCommandTag("terms")} before using this action`);
    if(!client.is_staff(message.member) && client.config.global_user_cooldown && client.cooldown.has(message.member.id)) return error(message, "You are currently on cooldown")
    if(!client.is_staff(message.member) && (message.member.roles.cache.some(r => client.config.blacklist_roles?.includes(r.id)) || await client.checkBlacklist(message.member.id, database))) return;

    if(client.config.hey_gpt.moderate_prompts) {
        const flagged = await client.checkIfPromptGetsFlagged(message.content)
        if(flagged) return;
    }
    
    await message.react(client.config.hey_gpt.processing_emoji || "⏳")

    const messages = [
        {
            role: "system",
            content: client.config.hey_gpt.system_instruction || "Hey GPT what's the time?"
        },
        {
            role: "user",
            content: `The current date and time is ${new Date().getUTCDate()}. My Discord Username is ${message.member.displayName}. Your knowledge cutoff is 2021.`
        },
        {
            role: "user",
            content: message.content
        }
    ]

    const data = await client.requestChatCompletion(messages, message.author.id, database, {
        model: client.config.hey_gpt.model
    }).catch(console.error)
    console.log(data)
    if(!data) return message.reactions.cache.get(client.config.hey_gpt.processing_emoji || "⏳")?.users.remove(client.user!).catch(console.error)

    await message.reactions.cache.get(client.config.hey_gpt.processing_emoji || "⏳")?.users.remove(client.user!).catch(console.error)

    await message.reply({
        content: data.choices[0]?.message.content,
        allowedMentions: {parse: []}
    })
}

function can_staff_bypass(member: GuildMember, client: ChatGPTBotClient) {
    return client.config.staff_can_bypass_feature_restrictions && client.is_staff(member)
}

async function error(message: Message, content: string) {
    return await message.reply({content}).then((m) => setTimeout(() => m.delete(), 1000 * 30));
}