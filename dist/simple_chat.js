import appConfig from "./app-config";
import { ChatModule, ChatRestModule, ChatWorkerClient } from "@mlc-ai/web-llm";
const getElementAndCheck = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Cannot find element ${id}`);
    return element;
};
class ChatUI {
    #chat;
    #localChat;
    #uiChatInput;
    #uiChatInfoLabel;
    #config;
    #selectedModel;
    #requestInProgress;
    #chatRequestChain;
    constructor(chat, localChat) {
        this.#chat = chat;
        this.#localChat = localChat;
        this.#uiChatInput = getElementAndCheck("chatui-input");
        this.#uiChatInfoLabel = getElementAndCheck("chatui-info-label");
        this.#config = appConfig;
        this.#selectedModel = "";
        this.#requestInProgress = false;
        this.#chatRequestChain = Promise.resolve();
        getElementAndCheck("chatui-reset-btn").onclick = () => this.onReset();
        getElementAndCheck("chatui-send-btn").onclick = () => this.onGenerate();
        this.#uiChatInput.onkeypress = (event) => {
            if (event.code === "Enter")
                this.onGenerate();
        };
        const modelSelector = getElementAndCheck("chatui-select");
        this.populateDropdown(modelSelector, this.#config.model_list);
        this.#selectedModel = modelSelector.value;
        modelSelector.onchange = () => this.onSelectChange(modelSelector);
    }
    populateDropdown(modelSelector, modelList) {
        modelList.forEach((item) => {
            const opt = document.createElement("option");
            opt.value = item.local_id;
            opt.textContent = item.local_id;
            modelSelector.append(opt);
        });
    }
    pushTask(task) {
        this.#chatRequestChain = this.#chatRequestChain.then(task);
    }
    async onGenerate() {
        if (this.#requestInProgress)
            return;
        this.pushTask(() => this.asyncGenerate());
    }
    async onSelectChange(modelSelector) {
        this.pushTask(async () => {
            await this.#chat.resetChat();
            this.resetChatHistory();
            await this.unloadChat();
            this.#selectedModel = modelSelector.value;
            await this.asyncInitChat();
        });
    }
    async onReset() {
        this.pushTask(async () => {
            await this.#chat.resetChat();
            this.resetChatHistory();
        });
    }
    async asyncInitChat() {
        this.#requestInProgress = true;
        try {
            if (this.#selectedModel !== "Local Server") {
                await this.#chat.reload(this.#selectedModel, undefined, this.#config);
            }
        }
        catch (err) {
            this.unloadChat();
            this.#requestInProgress = false;
            return;
        }
        this.#requestInProgress = false;
    }
    async unloadChat() {
        await this.#chat.unload();
    }
    async asyncGenerate() {
        await this.asyncInitChat();
        this.#requestInProgress = true;
        const prompt = this.#uiChatInput.value;
        if (!prompt) {
            this.#requestInProgress = false;
            return;
        }
        try {
            let output;
            if (this.#selectedModel === "Local Server") {
                output = await this.#localChat.generate(prompt);
            }
            else {
                output = await this.#chat.generate(prompt);
            }
            this.#uiChatInfoLabel.textContent = output;
        }
        catch (err) {
            await this.unloadChat();
        }
        this.#requestInProgress = false;
    }
    resetChatHistory() {
        this.#uiChatInfoLabel.textContent = "";
    }
}
document.addEventListener("DOMContentLoaded", (event) => {
    const useWebWorker = appConfig.use_web_worker;
    const chat = useWebWorker ?
        new ChatWorkerClient(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })) :
        new ChatModule();
    const localChat = new ChatRestModule();
    new ChatUI(chat, localChat);
});
