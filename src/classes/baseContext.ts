import {
    Interaction,
} from "discord.js";
import {BaseContextInitOptions} from "../types";
import { ChatGPTBotClient } from "./client";

export class BaseContext{
    interaction: Interaction
    client: ChatGPTBotClient
    constructor(options: BaseContextInitOptions) {
        this.interaction = options.interaction
        this.client = options.client
    }
}