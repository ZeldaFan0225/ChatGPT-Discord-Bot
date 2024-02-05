import { readFileSync } from "fs";
import { Config, ModelConfiguration } from "../types";

export class ConfigValidator {
    #config_path: string;
    #config: Config
    constructor(config_path = "./config.json") {
        this.#config_path = config_path;
        this.#config = {}

        this.#loadConfig()
    }

    get config() {
        return this.#config
    }

    reloadConfig() {
        this.#loadConfig()
    }

    #loadConfig() {
        const config = JSON.parse(readFileSync(this.#config_path).toString())
        this.#validateConfig(config)
        this.#config = config as Config
    }

    #validateConfig(config: Config) {
        const model_names = Object.keys(config.models ?? {})

        if(config.generation_settings?.default_model) {
            if(!model_names.includes(config.generation_settings?.default_model)) {
                throw new Error(`'${config.generation_settings?.default_model}' in 'config.default_model' does not exist in 'config.models' as an entry`)
            }
        }

        if(config.hey_gpt?.model) {
            if(!model_names.includes(config.hey_gpt.model)) {
                throw new Error(`'${config.hey_gpt.model}' in 'config.hey_gpt.model' does not exist in 'config.models' as an entry`)
            }
        }

        if(config.hey_gpt?.activation_phrases?.length) {
            for(let i = 0; i < config.hey_gpt.activation_phrases.length; i++) {
                const phrase = config.hey_gpt.activation_phrases[i]
                if(typeof phrase === "string") continue;
                if(phrase?.model && !model_names.includes(phrase?.model)) {
                    throw new Error(`'${phrase.model}' in 'config.hey_gpt.activation_phrases[${i}].model' does not exist in 'config.models' as an entry`)
                }
            }
        }

        if(config.message_context_actions?.length) {
            for(let i = 0; i < config.message_context_actions.length; i++) {
                const action = config.message_context_actions[i]
                if(!action?.model || !model_names.includes(action.model)) {
                    throw new Error(`'${action?.model}' in 'config.message_context_actions[${i}].model' does not exist in 'config.models' as an entry`)
                }
            }
        }

        if(config.models && Object.keys(config.models).length) {
            Object.entries(config.models).map(([k, v]) => this.#validateModelConfig(k, v))
        } else {
            throw new Error("At least one configuration in 'config.models' is required")
        }
    }

    #validateModelConfig(name: string, model: ModelConfiguration) {
        if(!model.model)
            throw new Error(`'config.models['${name}'].model' is required`)
        // maybe further validation in the future
    }
}