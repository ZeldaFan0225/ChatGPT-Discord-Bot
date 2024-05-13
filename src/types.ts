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
        finish_reason: string,
        logprobs?: {
            content: {
                token: string,
                logprob: number,
                bytes: string[],
                top_logprobs: {
                    token: string,
                    logprob: number,
                    bytes: string[],
                }[]
            }[]
        }
    }[],
    usage: {
        prompt_tokens: number,
        completion_tokens: number,
        total_tokens: number
    },
    system_fingerprint: string
}

export interface ChatData {
    index: number,
    id: string,
    user_id: string,
    messages: ChatCompletionMessages[],
    model_configuration: string,
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
    default_dalle_model?: string,
    staff_can_bypass_feature_restrictions?: boolean,
    dev_config?: {
        enabled?: boolean,
        debug_discord_messages?: boolean,
        debug_logs?: boolean
    },
    global_user_cooldown?: number,
    max_thread_followup_length?: number
    allow_collaboration?: boolean
    hey_gpt?: {
        enabled?: boolean,
        context_depth?: number,
        model?: string,
        allow_images?: boolean,
        processing_emoji?: string,
        system_instruction?: string,
        activation_phrases?: string[] | {phrase: string, system_instruction?: string, model?: string, allow_images?: boolean}[],
    },
    generate_image?: {
        quality?: "standard" | "hd",
        default_size?: string
    }
    assistants?: {
        result_fetching_max_count?: number,
        allow_collaboration?: boolean,
        assistant_ids?: string[]
    }
    generation_settings?: {
        default_system_instruction?: string,
        default_model?: string,
        selectable_models?: string[],
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
        assistants?: boolean,
        image_in_prompt?: boolean,
        create_image?: boolean,
        regenerate_button?: boolean,
        delete_button?: boolean,
        view_system_instruction?: boolean,
        user_stats?: boolean,
        user_leaderboard?: boolean
    },
    leaderboard_amount_users?: number,
    auto_create_commands?: boolean,
    message_context_actions?: {
        name?: string,
        system_instruction?: string,
        model: string
    }[],
    models?: Record<string, ModelConfiguration>
}

export interface ModelConfiguration {
    model: string,
    base_url?: string,
    env_token_name?: string
    images?: {supported: false} | {supported: true, detail?: "high" | "low" | "auto"},
    max_completion_tokens?: number,
    max_model_tokens?: number,
    cost?: ModelCost,
    moderation?: {
        enabled?: boolean
    },
    defaults?: {
        frequency_penalty?: number,
        logit_bias?: Record<string, number>,
        logprobs?: boolean,
        top_logprobs?: number,
        presence_penalty?: number,
        response_format?: {type?: "text" | "json_object"},
        seed?: number,
        stop?: string | string[],
        temperature?: number,
        top_p?: number
    }
}

export interface ModelCost {
    prompt?: number,
    completion?: number
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

export interface AssistantCreateOptions {
    model: string,
    name?: string,
    description?: string,
    instructions?: string,
    tools?: (AssistantCodeInterpreterTool | AssistantRetrievalTool | AssistantFunctionTool)[],
    file_ids?: string[],
    metadata?: Record<string, string>
}

export interface AssistantData extends Required<AssistantCreateOptions> {
    id: string,
    object: "assistant",
    created_at: number,
}

export interface AssistantCodeInterpreterTool {
    type: "code_interpreter"
}

export interface AssistantRetrievalTool {
    type: "retrieval"
}

export interface AssistantFunctionTool {
    type: "function",
    function: {
        description: string,
        name: string,
        parameters: Record<string, any>
    }
}

export interface ModelData {
    id: string,
    object: "model",
    created: number,
    owned_by: string
}

export interface AssistantThreadData {
    id: string,
    object: "thread",
    created_at: number,
    metadata: Record<string, string>
}

export interface AssistantThreadMessagePayload {
    role: "user" | "assistant",
    content: string,
    file_ids?: string[],
    metadata?: Record<string, string>
}

export interface AssistantThreadMessageData extends Required<Omit<AssistantThreadMessagePayload, "content">> {
    id: string,
    object: "thread.message",
    created_at: number,
    thread_id: string,
    assistant_id?: string,
    run_id?: string,
    content: ({
        type: "text",
        text: {
            value: string,
            annotations: ({
                type: "file_citation",
                text: string,
                file_citation: {
                    file_id: string,
                    quote: string
                },
                start_index: number,
                end_index: number
            } | {
                type: "file_path",
                text: string,
                file_path: {
                    file_id: string,
                },
                start_index: number,
                end_index: number
            })[]
        }
    } | {
        type: "image_file",
        image_file: {
            file_id: string
        }
    })[]
}

export interface AssistantRunPayload {
    assistant_id: string,
    model?: string,
    instructions?: string,
    tools?: (AssistantCodeInterpreterTool | AssistantRetrievalTool | AssistantFunctionTool)[],
    metadata?: Record<string, string>
}

export interface AssistantRunData extends Required<AssistantRunPayload> {
    id: string,
    object: "assistant.run",
    created_at: number,
    thread_id: string,
    status: "queued" | "in_progress" | "requires_action" | "cancelling" | "cancelled" | "failed" | "completed" | "completed" | "expired",
    required_action?: {
        type: "submit_tool_outputs",
        submit_tool_outputs: any
    },
    expires_at?: number,
    started_at?: number,
    failed_at?: number,
    completed_at?: number,
}

export type ChatCompletionMessages = ChatCompletionSystemMessage | ChatCompletionUserMessage | ChatCompletionAssistantMessage

export interface ChatCompletionBaseMessage {
    role: "assistant" | "system" | "user",
    name?: string,
}

export interface ChatCompletionSystemMessage extends ChatCompletionBaseMessage {
    role: "system",
    content: string
}

export interface ChatCompletionUserMessage extends ChatCompletionBaseMessage {
    role: "user",
    content: string | (
        {
            type: "text",
            text: string
        } | {
            type: "image_url",
            image_url: {
                url: string,
                detail: "low" | "high" | "auto"
            }
        }
    )[]
}

export interface ChatCompletionAssistantMessage extends ChatCompletionBaseMessage {
    role: "assistant",
    content?: string,
    tool_calls?: {
        id: string,
        type: "function",
        function: {
            name: string,
            arguments: string
        }
    }[]
}