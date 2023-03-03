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
}