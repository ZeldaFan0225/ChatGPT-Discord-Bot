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
        if(!this.interaction.member) return false;
        if(this.client.config.staff_users?.includes(this.interaction.user.id)) return true;
        return Array.isArray(this.interaction.member.roles) ? this.interaction.member.roles.some(r => this.client.config.staff_roles?.includes(r)) : this.interaction.member.roles.cache.some(r => this.client.config.staff_roles?.includes(r.id))
    }
}