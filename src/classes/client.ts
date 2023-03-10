import SuperMap from "@thunder04/supermap";
import Centra from "centra";
import { Client, ClientOptions } from "discord.js";
import {existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync} from "fs"
import { Pool } from "pg";
import { Store } from "../stores/store";
import { Config, OpenAIChatCompletionResponse, OpenAIModerationResponse, StoreTypes } from "../types";

export class ChatGPTBotClient extends Client {
	commands: Store<StoreTypes.COMMANDS>;
	components: Store<StoreTypes.COMPONENTS>;
	contexts: Store<StoreTypes.CONTEXTS>;
	modals: Store<StoreTypes.MODALS>;
    config: Config
	cooldown: SuperMap<string, any>
	cache: SuperMap<string, boolean>
	blacklisted: SuperMap<string, boolean>

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
        this.loadConfig()
	}

    loadConfig() {
        const config = JSON.parse(readFileSync("./config.json").toString())
        this.config = config as Config
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
		const openai_req = Centra(`https://api.openai.com/v1/moderations`, "POST")
        .body({
            input: message
        }, "json")
        .header("Authorization", `Bearer ${process.env["OPENAI_TOKEN"]}`)

        const data: OpenAIModerationResponse = await openai_req.send().then(res => res.json())
		if(this.config.dev) console.log(data)
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

	async requestChatCompletion(messages: {role: string, content: string}[], user_id: string, database: Pool, override_options?: {
		temperature?: number
	}) {
		const openai_req = Centra(`https://api.openai.com/v1/chat/completions`, "POST")
        .body({
            model: "gpt-3.5-turbo",
            messages,
            temperature: override_options?.temperature ?? this.config.generation_parameters?.temperature,
            top_p: this.config.generation_parameters?.top_p,
            frequency_penalty: this.config.generation_parameters?.frequency_penalty,
            presence_penalty: this.config.generation_parameters?.presence_penalty,
            max_tokens: this.config.generation_parameters?.max_tokens === -1 ? undefined : this.config.generation_parameters?.max_tokens,
            user: user_id
        }, "json")
        .header("Authorization", `Bearer ${process.env["OPENAI_TOKEN"]}`)

        const data: OpenAIChatCompletionResponse = await openai_req.send().then(res => res.json())
		if(this.config.dev) console.log(data)

		if (this.config.logs?.enabled) {
            const logGeneration = (type: "txt" | "csv") => {
                this.initLogDir();
                const log_dir = this.config.logs?.directory ?? "/logs";
                const content = type === "csv" ? `\n${new Date().toISOString()},${user_id},${data.id},"${messages.at(-1)?.content}"` : `\n${new Date().toISOString()} | ${user_id}${" ".repeat(20 - user_id.length)} | ${data.id}${" ".repeat(40 - (data.id?.length ?? 0))} | ${messages.at(-1)?.content}`;
                appendFileSync(`${process.cwd()}${log_dir}/logs_${new Date().getMonth() + 1}-${new Date().getFullYear()}.${type}`, content);
            }

            if (this.config.logs.plain) logGeneration("txt");
            if (this.config.logs.csv) logGeneration("csv");
        }

		if(!data?.id) throw new Error("Unable to generate response")
		
        await this.recordSpentTokens(user_id, data.usage.total_tokens ?? 0, database)

		return data
	}

	async recordSpentTokens(user_id: string, tokens: number, database: Pool) {
		if(!this.config.features?.user_stats) return false;

		const res = await database.query("UPDATE user_data SET tokens = user_data.tokens + $2 WHERE user_id=$1 RETURNING *", [user_id, tokens]).catch(console.error)
		return !!res?.rowCount
	}
}
