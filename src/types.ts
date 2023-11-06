import {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Interaction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
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
    command_data?: RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody,
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
    model: string,
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
    owner_ids?: string[]
    staff_roles?: string[],
    staff_users?: string[],
    blacklist_roles?: string[],
    default_model?: string,
    default_dalle_model?: string,
    selectable_models?: (string | {name: string, base_url?: string, supports_images?: boolean})[],
    staff_can_bypass_feature_restrictions?: boolean,
    dev_config?: {
        enabled?: boolean,
        debug_discord_messages?: boolean,
        debug_logs?: boolean
    },
    global_user_cooldown?: number,
    max_thread_folowup_length?: number
    allow_collaboration?: boolean
    hey_gpt?: {
        enabled?: boolean,
        moderate_prompts?: boolean,
        model?: string,
        processing_emoji?: string,
        system_instruction?: string,
        activation_phrases?: string[] | {phrase: string, system_instruction: string}[],
    },
    generate_image?: {
        quality: "standard" | "hd",
        default_size?: string
    }
    generation_parameters?: {
        moderate_prompts?: boolean,
        default_system_instruction?: string,
        temperature?: number,
        top_p?: number,
        presence_penalty?: number,
        frequency_penalty?: number,
        max_completion_tokens_per_model?: Record<string, number>,
        max_input_tokens_per_model?: Record<string, number>
    },
    selectable_system_instructions?: {
        name?: string,
        system_instruction?: string
    }[]
    logs?: {
        enabled?: boolean,
        directory?: string,
        plain?: boolean,
        csv?: boolean
    },
    features?: {
        chat_single?: boolean,
        chat_thread?: boolean,
        image_in_prompt?: boolean,
        create_image?: boolean,
        regenerate_button?: boolean,
        delete_button?: boolean,
        view_system_instruction?: boolean,
        user_stats?: boolean,
        user_leaderboard?: boolean
    },
    leaderboard_amount_users?: number,
    englishify_system_instruction?: string,
    auto_create_commands?: boolean,
    message_context_actions?: {
        name?: string,
        system_instruction?: string
    }[],
    costs?: Record<string, {
        prompt?: number,
        completion?: number
    }>
}

export interface DallE3GenerationOptions {
    model: string,
    prompt: string,
    size?: "1024x1024" | "1024x1792" | "1792x1024",
    quality?: "standard" | "hd",
    style?: "vivid" | "natural"
}

export interface DallE3APIOptions extends DallE3GenerationOptions {
    response_format?: "url" | "b64_json",
    user?: string,
    n?: number
}

export interface DallE3ResponseData {
    created: number,
    data: {
        url: string,
        revised_prompt?: string
    }[]
}