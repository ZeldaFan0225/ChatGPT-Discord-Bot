import {
    AnySelectMenuInteraction,
    ApplicationCommandData, AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Interaction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction
} from "discord.js";
import { Pool } from "pg";
import { ChatGPTBotClient } from "./classes/client";

export enum StoreTypes {
    COMMANDS,
    COMPONENTS,
    CONTEXTS,
    MODALS
}

export interface StoreInitOptions {
    files_folder: string
    load_classes_on_init?: boolean,
    storetype: StoreTypes
}

export interface CommandInitOptions {
    name: string,
    command_data?: ApplicationCommandData,
    staff_only: boolean,
}


export interface CustomIDInitOptions {
    name: string,
    staff_only?: boolean,
    regex: RegExp,
}

export interface BaseContextInitOptions {
    interaction: Interaction,
    client: ChatGPTBotClient,
    database: Pool
}

export interface CommandContextInitOptions extends BaseContextInitOptions {
    interaction: ChatInputCommandInteraction
}

export interface UserContextContextInitOptions extends BaseContextInitOptions {
    interaction: UserContextMenuCommandInteraction
}

export interface MessageContextContextInitOptions extends BaseContextInitOptions {
    interaction: MessageContextMenuCommandInteraction
}

export interface ButtonContextInitOptions extends BaseContextInitOptions {
    interaction: ButtonInteraction
}

export interface SelectMenuContextInitOptions extends BaseContextInitOptions {
    interaction: AnySelectMenuInteraction
}

export interface ModalContextInitOptions extends BaseContextInitOptions {
    interaction: ModalSubmitInteraction
}

export interface AutocompleteContextInitOptions extends BaseContextInitOptions {
    interaction: AutocompleteInteraction
}

export interface OpenAIChatCompletionResponse {
    id: string,
    object: string,
    created: number,
    choices: {
        index: number,
        message: {
            role: "assistant" | "bot" | "user",
            content: string
        },
        finish_reason: string
    }[],
    usage: {
        prompt_tokens: number,
        completion_tokens: number,
        total_tokens: number
    }
}

export interface ChatData {
    index: number,
    id: string,
    user_id: string,
    messages: {
        role: string,
        content: string
    }[],
    created_at: Date
}

export interface OpenAIModerationResponse {
    id: string,
    model: string,
    results: {
        categories: Record<string, boolean>,
        category_scores: Record<string, boolean>,
        flagged: boolean
    }[]
}

export interface Config {
    staff_roles?: string[],
    dev?: boolean,
    global_user_cooldown?: number,
    moderate_prompts?: boolean,
    generation_parameters?: {
        system_instruction?: string,
        temperature?: number,
        top_p?: number,
        max_tokens?: number,
        presence_penalty?: number,
        frequency_penalty?: number,
        max_input_chars?: number
    },
    logs?: {
        enabled?: boolean,
        directory?: string,
        plain?: boolean,
        csv?: boolean
    }
}