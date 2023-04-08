import {
    Interaction,
} from "discord.js";
import { Pool } from "pg";
import {BaseContextInitOptions} from "../types";
import { ChatGPTBotClient } from "./client";

export class BaseContext{
    interaction: Interaction
    client: ChatGPTBotClient
    database: Pool
    constructor(options: BaseContextInitOptions) {
        this.interaction = options.interaction
        this.client = options.client
        this.database = options.database
    }

    get is_staff() {
        if(!this.interaction.inCachedGuild()) return false;
        return this.client.is_staff(this.interaction.member)
    }

    get has_blacklisted_role() {
        if(!this.interaction.member) return false;
        return Array.isArray(this.interaction.member.roles) ? this.interaction.member.roles.some(r => this.client.config.blacklist_roles?.includes(r)) : this.interaction.member.roles.cache.some(r => this.client.config.blacklist_roles?.includes(r.id))
    }

    get can_staff_bypass() {
        return this.client.config.staff_can_bypass_feature_restrictions && this.is_staff
    }
}