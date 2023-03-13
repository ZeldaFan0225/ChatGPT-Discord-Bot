import { ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js"
import { CommandInitOptions } from "../types"
import { ContextContext } from "./contextContext"

export class Context {
    name: string
    commandData?: RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody
    staff_only: boolean
    constructor(options: CommandInitOptions) {
        this.name = options.name
        this.commandData = options.command_data
        this.staff_only = options.staff_only ?? false
    }

    async run(_context: ContextContext<ApplicationCommandType.User | ApplicationCommandType.Message>): Promise<any> {
        throw new Error("You need to override the base run method")
    }
}