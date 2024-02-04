import SuperMap from "@thunder04/supermap";
import { Client, ClientOptions, GuildMember } from "discord.js";
import {existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync} from "fs"
import { Pool } from "pg";
import { Store } from "../stores/store";
import { AssistantCreateOptions, AssistantData, AssistantRunData, AssistantThreadData, AssistantThreadMessageData, AssistantThreadMessagePayload, Config, DallE3APIOptions, DallE3GenerationOptions, DallE3ResponseData, ModelData, OpenAIChatCompletionResponse, OpenAIModerationResponse, StoreTypes } from "../types";
import GPT3Tokenizer from 'gpt3-tokenizer';

export class ChatGPTBotClient extends Client {
	commands: Store<StoreTypes.COMMANDS>;
	components: Store<StoreTypes.COMPONENTS>;
	contexts: Store<StoreTypes.CONTEXTS>;
	modals: Store<StoreTypes.MODALS>;
    config: Config
	cooldown: SuperMap<string, any>
	cache: SuperMap<string, boolean>
	blacklisted: SuperMap<string, boolean>
	assistants: SuperMap<string, AssistantData>
	#tokenizer: GPT3Tokenizer

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Store<StoreTypes.COMMANDS>({files_folder: "/commands", load_classes_on_init: false, storetype: StoreTypes.COMMANDS});
		this.components = new Store<StoreTypes.COMPONENTS>({files_folder: "/components", load_classes_on_init: false, storetype: StoreTypes.COMPONENTS});
		this.contexts = new Store<StoreTypes.CONTEXTS>({files_folder: "/contexts", load_classes_on_init: false, storetype: StoreTypes.CONTEXTS});
		this.modals = new Store<StoreTypes.MODALS>({files_folder: "/modals", load_classes_on_init: false, storetype: StoreTypes.MODALS});
        this.config = {}
		this.cooldown = new SuperMap({
			intervalTime: 1000
		})
		this.cache = new SuperMap({
			intervalTime: 1000
		})
		this.blacklisted = new SuperMap({
			intervalTime: 1000
		})
		this.assistants = new SuperMap()
        this.loadConfig()
		this.loadAssistants()
		this.#tokenizer = new GPT3Tokenizer({type: "gpt3"})
	}

    loadConfig() {
        const config = JSON.parse(readFileSync("./config.json").toString())
        this.config = config as Config
    }

	async loadAssistants() {
		const req = await fetch(`https://api.openai.com/v1/assistants?limit=100`, {
			method: "GET",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			}
		})

		const assistants: {data: AssistantData[]} = await req.json()

		const list = assistants.data.filter(a => this.config.assistants?.assistant_ids?.includes(a.id))

		if(this.config.dev_config?.enabled && this.config.dev_config.debug_logs) console.log(`${list.length || "No"} Assistants loaded`)

		if(list) {
			for(let assistant of list) {
				this.assistants.set(assistant.id, assistant)
			}
		}
	}

	initLogDir() {
		const log_dir = this.config.logs?.directory ?? "/logs"
		if(!existsSync(`${process.cwd()}${log_dir}`)) {
			mkdirSync("./logs")
		}
		if(this.config.logs?.plain && !existsSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth()+1}-${new Date().getFullYear()}.txt`)) {
			writeFileSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth()+1}-${new Date().getFullYear()}.txt`, `Date                     | User ID              | Prompt ID                                | Prompt`, {flag: "a"})
		}
		if(this.config.logs?.csv && !existsSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth()+1}-${new Date().getFullYear()}.csv`)) {
			writeFileSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth()+1}-${new Date().getFullYear()}.csv`, `Date,User ID,Prompt ID,Prompt`, {flag: "a"})
		}
	}

	async getSlashCommandTag(name: string) {
		const commands = await this.application?.commands.fetch()
		const [find_name] = name.split(" ")
		if(!commands?.size) return `/${name}`
		else if(commands?.find(c => c.name === find_name)?.id) return `</${name}:${commands?.find(c => c.name === find_name)!.id}>`
		else return `/${name}`
	}

	async checkIfPromptGetsFlagged(message: string): Promise<boolean> {
		if(!this.config.generation_parameters?.moderate_prompts) return false;
		const openai_req = await fetch(`https://api.openai.com/v1/moderations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			},
			body: JSON.stringify({
				input: message
			})
		})

        const data: OpenAIModerationResponse = await openai_req.json()
		if(this.config.dev_config?.enabled && this.config.dev_config.debug_logs) console.log(data)
		return !!data?.results[0]?.flagged
	}

	async checkConsent(user_id: string, database: Pool) {
		if(this.cache.has(user_id)) return this.cache.get(user_id)

		const res = await database.query("SELECT * FROM user_data WHERE user_id=$1 AND consent", [user_id]).catch(console.error)
		this.cache.set(user_id, !!res?.rowCount, 1000 * 60)
		return !!res?.rowCount
	}

	async checkBlacklist(user_id: string, database: Pool) {
		if(this.blacklisted.has(user_id)) return this.blacklisted.get(user_id)

		const res = await database.query("SELECT * FROM user_data WHERE user_id=$1 AND blacklisted", [user_id]).catch(console.error)
		this.blacklisted.set(user_id, !!res?.rowCount, 1000 * 60)
		return !!res?.rowCount
	}

	tokenizeString(text: string) {
		const encoded = this.#tokenizer.encode(text)
		return {
			count: encoded.bpe.length,
			tokens: encoded.bpe,
			text: encoded.text
		}
	}

    is_staff(member: GuildMember) {
        if(!member) return false;
        if(this.config.staff_users?.includes(member.id)) return true;
        return member.roles.cache.some(r => this.config.staff_roles?.includes(r.id))
    }

	async requestChatCompletion(messages: {role: string, content: string | {type: "text" | "image_url", text?: string, image_url?: {url: string, detail?: string}}[]}[], user_id: string, database: Pool, override_options?: {
		temperature?: number,
		model?: string,
		base_url?: string,
		env_token_name?: string
	}) {
		const model = override_options?.model || this.config.default_model || "gpt-3.5-turbo"
		if(this.config.dev_config?.enabled && this.config.dev_config.debug_logs) console.log(model)

		const total_count = messages.map(m => this.tokenizeString(typeof m.content === "string" ? m.content : m.content.find(c => c.type === "text")?.text!).count + 5).reduce((a, b) => a + b) + 2

	
		const openai_req = await fetch(`${override_options?.base_url ?? "https://api.openai.com"}/v1/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env[override_options?.env_token_name || "OPENAI_TOKEN"]}`
			},
			body: JSON.stringify({
				model,
				messages,
				temperature: override_options?.temperature ?? this.config.generation_parameters?.temperature,
				top_p: this.config.generation_parameters?.top_p,
				frequency_penalty: this.config.generation_parameters?.frequency_penalty,
				presence_penalty: this.config.generation_parameters?.presence_penalty,
				max_tokens: this.config.generation_parameters?.max_completion_tokens_per_model?.[model] === -1 ? undefined : ((this.config.generation_parameters?.max_completion_tokens_per_model?.[model] ?? 4096) - total_count),
				user: user_id
			})
		})

        const data: OpenAIChatCompletionResponse = await openai_req.json()
		if(this.config.dev_config?.enabled && this.config.dev_config.debug_logs) console.log(data)

		if (this.config.logs?.enabled) {
            const logGeneration = (type: "txt" | "csv") => {
                this.initLogDir();
                const log_dir = this.config.logs?.directory ?? "/logs";
                const content = type === "csv" ? `\n${new Date().toISOString()},${user_id},${data.id},"${messages.map(m => m.content).join(" <=====> ")}"` : `\n${new Date().toISOString()} | ${user_id}${" ".repeat(20 - user_id.length)} | ${data.id}${" ".repeat(40 - (data.id?.slice(0, 40).length ?? 0))} | ${messages.map(m => m.content).join(" <=====> ")}`;
                appendFileSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth() + 1}-${new Date().getFullYear()}.${type}`, content);
            }

            if (this.config.logs.plain) logGeneration("txt");
            if (this.config.logs.csv) logGeneration("csv");
        }

		if(!data?.id) throw new Error("Unable to generate response")
		
        await this.recordSpentTokens(user_id, {prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens}, model, database)

		return data
	}

	async requestImageGeneration(generation_options: DallE3GenerationOptions, user?: string) {
		const model = generation_options.model || this.config.default_dalle_model || "dall-e-3"
		if(this.config.dev_config?.enabled && this.config.dev_config.debug_logs) console.log(model)

		const options: DallE3APIOptions = {
			...generation_options,
			n: 1,
			response_format: "url",
			user
		}

		const openai_req = await fetch(`https://api.openai.com/v1/images/generations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			},
			body: JSON.stringify(options)
		})

		
        const data: DallE3ResponseData = await openai_req.json()
		if(this.config.dev_config?.enabled && this.config.dev_config.debug_logs) console.log(data)

		if (this.config.logs?.enabled) {
            const logGeneration = (type: "txt" | "csv") => {
                this.initLogDir();
                const log_dir = this.config.logs?.directory ?? "/logs";
                const content = type === "csv" ? `\n${new Date().toISOString()},${user},${"unknown id"},"${options.prompt}"` : `\n${new Date().toISOString()} | ${user}${" ".repeat(20 - (user?.length || 9))} | ${"unknown id"}${" ".repeat(40 - ("unknown id".slice(0, 40).length ?? 0))} | ${options.prompt}`;
                appendFileSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth() + 1}-${new Date().getFullYear()}.${type}`, content);
            }

            if (this.config.logs.plain) logGeneration("txt");
            if (this.config.logs.csv) logGeneration("csv");
        }

		if(!data.created) throw new Error("Unable to generate response")

		return data
	}

	async recordSpentTokens(user_id: string, tokens: {prompt: number, completion: number}, model: string, database: Pool) {
		if(!this.config.features?.user_stats) return false;

		let cost = 0

		if(this.config.costs?.[model]) {
			cost += (this.config.costs?.[model]?.prompt || 0) * (tokens.prompt / 1000)
			cost += (this.config.costs?.[model]?.completion || 0) * (tokens.completion / 1000)
		}

		const res = await database.query("UPDATE user_data SET tokens=user_data.tokens+$2, cost=user_data.cost+$3 WHERE user_id=$1 RETURNING *", [user_id, (tokens.completion + tokens.prompt), cost]).catch(console.error)
		return !!res?.rowCount
	}

	async getModels() {
		const req = await fetch(`https://api.openai.com/v1/models`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			}
		})

		const data: {object: "list", data: ModelData[]} = await req.json()

		if(!data) throw new Error("Unable to fetch assistants")

		return data;
	}

	async createAssistant(options: AssistantCreateOptions) {
		const req = await fetch(`https://api.openai.com/v1/assistants`, {
			method: "POST",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			},
			body: JSON.stringify(options)
		})

		const data: AssistantData | {error: {message: string}} = await req.json()

		if(!data) throw new Error("Unable to create assistant")

		return data;
	}

	async createThread(channel_id: string) {
		const req = await fetch(`https://api.openai.com/v1/threads`, {
			method: "POST",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			},
			body: JSON.stringify({metadata: {"DISCORD_CHANNEL_ID": channel_id}})
		})

		const data: AssistantThreadData | {error: {message: string}} = await req.json()

		if(!data) throw new Error("Unable to create assistant")

		return data;
	}

	async addMessageToThread(thread_id: string, message: AssistantThreadMessagePayload) {
		const req = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
			method: "POST",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			},
			body: JSON.stringify(message)
		})

		const data: AssistantThreadMessageData | {error: {message: string}} = await req.json()

		if(!data) throw new Error("Unable to create assistant")

		return data;

	}

	async runAssistantOnThread(thread_id: string, assistant_id: string) {
		const req = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
			method: "POST",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			},
			body: JSON.stringify({
				assistant_id
			})
		})

		const data: AssistantRunData | {error: {message: string}} = await req.json()

		if(!data) throw new Error("Unable to create assistant")

		return data;
	}

	async getThreadMessages(thread_id: string) {
		const req = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?limit=100&order=desc`, {
			method: "GET",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			}
		})

		const data: {object: "list", data: AssistantThreadMessageData[]} = await req.json()

		if(!data) throw new Error("Unable to create assistant")

		return data;
	}

	async getRunData(thread_id: string, run_id: string) {
		const req = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`, {
			method: "GET",
			headers: {
				"OpenAI-Beta": "assistants=v1",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env["OPENAI_TOKEN"]}`
			}
		})

		const data: AssistantRunData = await req.json()

		if(!data) throw new Error("Unable to create assistant")

		return data;
	}
}
