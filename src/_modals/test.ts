import { Modal } from "../classes/modal";
import { ModalContext } from "../classes/modalContext";


export default class extends Modal {
    constructor() {
        super({
            name: "test",
            staff_only: false,
            regex: /./
        })
    }

    override async run(ctx: ModalContext): Promise<any> {
        return ctx.interaction.reply({
            content: "Hey there",
            ephemeral: true
        })
    }
}