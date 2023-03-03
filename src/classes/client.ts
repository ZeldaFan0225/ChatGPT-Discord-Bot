import SuperMap from "@thunder04/supermap";
import Centra from "centra";
import { Client, ClientOptions } from "discord.js";
import { readFileSync } from "fs";
import { Store } from "../stores/store";
import { Config, OpenAIModerationResponse, StoreTypes } from "../types";

export class ChatGPTBotClient extends Client {
	commands: Store<StoreTypes.COMMANDS>;
	components: Store<StoreTypes.COMPONENTS>;
	contexts: Store<StoreTypes.CONTEXTS>;
	modals: Store<StoreTypes.MODALS>;
    config: Config
	cache: SuperMap<string, any>

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Store<StoreTypes.COMMANDS>({files_folder: "/commands", load_classes_on_init: false, storetype: StoreTypes.COMMANDS});
		this.components = new Store<StoreTypes.COMPONENTS>({files_folder: "/components", load_classes_on_init: false, storetype: StoreTypes.COMPONENTS});
		this.contexts = new Store<StoreTypes.CONTEXTS>({files_folder: "/contexts", load_classes_on_init: false, storetype: StoreTypes.CONTEXTS});
		this.modals = new Store<StoreTypes.MODALS>({files_folder: "/modals", load_classes_on_init: false, storetype: StoreTypes.MODALS});
        this.config = {}
		this.cache = new SuperMap({
			intervalTime: 1000
		})
        this.loadConfig()
	}

    loadConfig() {
        const config = JSON.parse(readFileSync("./config.json").toString())
        this.config = config as Config
    }

	async getSlashCommandTag(name: string) {
		const commands = await this.application?.commands.fetch()
		const [find_name] = name.split(" ")
		if(!commands?.size) return `/${name}`
		else if(commands?.find(c => c.name === find_name)?.id) return `</${name}:${commands?.find(c => c.name === find_name)!.id}>`
		else return `/${name}`
	}

	async checkIfPromptGetsFlagged(message: string): Promise<boolean> {
		const openai_req = Centra(`https://api.openai.com/v1/moderations`, "POST")
        .body({
            input: message
        }, "json")
        .header("Authorization", `Bearer ${process.env["OPENAI_TOKEN"]}`)

        const data: OpenAIModerationResponse = await openai_req.send().then(res => res.json())
		return !!data?.results[0]?.flagged
	}
}
