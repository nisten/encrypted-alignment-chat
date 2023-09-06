var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ChatUI_chat, _ChatUI_localChat, _ChatUI_uiChatInput, _ChatUI_uiChatInfoLabel, _ChatUI_config, _ChatUI_selectedModel, _ChatUI_requestInProgress, _ChatUI_chatRequestChain;
import appConfig from "./app-config";
import { ChatModule, ChatRestModule, ChatWorkerClient } from "@mlc-ai/web-llm";
const getElementAndCheck = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Cannot find element ${id}`);
    return element;
};
class ChatUI {
    constructor(chat, localChat) {
        _ChatUI_chat.set(this, void 0);
        _ChatUI_localChat.set(this, void 0);
        _ChatUI_uiChatInput.set(this, void 0);
        _ChatUI_uiChatInfoLabel.set(this, void 0);
        _ChatUI_config.set(this, void 0);
        _ChatUI_selectedModel.set(this, void 0);
        _ChatUI_requestInProgress.set(this, void 0);
        _ChatUI_chatRequestChain.set(this, void 0);
        __classPrivateFieldSet(this, _ChatUI_chat, chat, "f");
        __classPrivateFieldSet(this, _ChatUI_localChat, localChat, "f");
        __classPrivateFieldSet(this, _ChatUI_uiChatInput, getElementAndCheck("chatui-input"), "f");
        __classPrivateFieldSet(this, _ChatUI_uiChatInfoLabel, getElementAndCheck("chatui-info-label"), "f");
        __classPrivateFieldSet(this, _ChatUI_config, appConfig, "f");
        __classPrivateFieldSet(this, _ChatUI_selectedModel, "", "f");
        __classPrivateFieldSet(this, _ChatUI_requestInProgress, false, "f");
        __classPrivateFieldSet(this, _ChatUI_chatRequestChain, Promise.resolve(), "f");
        getElementAndCheck("chatui-reset-btn").onclick = () => this.onReset();
        getElementAndCheck("chatui-send-btn").onclick = () => this.onGenerate();
        __classPrivateFieldGet(this, _ChatUI_uiChatInput, "f").onkeypress = (event) => {
            if (event.code === "Enter")
                this.onGenerate();
        };
        const modelSelector = getElementAndCheck("chatui-select");
        this.populateDropdown(modelSelector, __classPrivateFieldGet(this, _ChatUI_config, "f").model_list);
        __classPrivateFieldSet(this, _ChatUI_selectedModel, modelSelector.value, "f");
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
        __classPrivateFieldSet(this, _ChatUI_chatRequestChain, __classPrivateFieldGet(this, _ChatUI_chatRequestChain, "f").then(task), "f");
    }
    async onGenerate() {
        if (__classPrivateFieldGet(this, _ChatUI_requestInProgress, "f"))
            return;
        this.pushTask(() => this.asyncGenerate());
    }
    async onSelectChange(modelSelector) {
        this.pushTask(async () => {
            await __classPrivateFieldGet(this, _ChatUI_chat, "f").resetChat();
            this.resetChatHistory();
            await this.unloadChat();
            __classPrivateFieldSet(this, _ChatUI_selectedModel, modelSelector.value, "f");
            await this.asyncInitChat();
        });
    }
    async onReset() {
        this.pushTask(async () => {
            await __classPrivateFieldGet(this, _ChatUI_chat, "f").resetChat();
            this.resetChatHistory();
        });
    }
    async asyncInitChat() {
        __classPrivateFieldSet(this, _ChatUI_requestInProgress, true, "f");
        try {
            if (__classPrivateFieldGet(this, _ChatUI_selectedModel, "f") !== "Local Server") {
                await __classPrivateFieldGet(this, _ChatUI_chat, "f").reload(__classPrivateFieldGet(this, _ChatUI_selectedModel, "f"), undefined, __classPrivateFieldGet(this, _ChatUI_config, "f"));
            }
        }
        catch (err) {
            this.unloadChat();
            __classPrivateFieldSet(this, _ChatUI_requestInProgress, false, "f");
            return;
        }
        __classPrivateFieldSet(this, _ChatUI_requestInProgress, false, "f");
    }
    async unloadChat() {
        await __classPrivateFieldGet(this, _ChatUI_chat, "f").unload();
    }
    async asyncGenerate() {
        await this.asyncInitChat();
        __classPrivateFieldSet(this, _ChatUI_requestInProgress, true, "f");
        const prompt = __classPrivateFieldGet(this, _ChatUI_uiChatInput, "f").value;
        if (!prompt) {
            __classPrivateFieldSet(this, _ChatUI_requestInProgress, false, "f");
            return;
        }
        try {
            let output;
            if (__classPrivateFieldGet(this, _ChatUI_selectedModel, "f") === "Local Server") {
                output = await __classPrivateFieldGet(this, _ChatUI_localChat, "f").generate(prompt);
            }
            else {
                output = await __classPrivateFieldGet(this, _ChatUI_chat, "f").generate(prompt);
            }
            __classPrivateFieldGet(this, _ChatUI_uiChatInfoLabel, "f").textContent = output;
        }
        catch (err) {
            await this.unloadChat();
        }
        __classPrivateFieldSet(this, _ChatUI_requestInProgress, false, "f");
    }
    resetChatHistory() {
        __classPrivateFieldGet(this, _ChatUI_uiChatInfoLabel, "f").textContent = "";
    }
}
_ChatUI_chat = new WeakMap(), _ChatUI_localChat = new WeakMap(), _ChatUI_uiChatInput = new WeakMap(), _ChatUI_uiChatInfoLabel = new WeakMap(), _ChatUI_config = new WeakMap(), _ChatUI_selectedModel = new WeakMap(), _ChatUI_requestInProgress = new WeakMap(), _ChatUI_chatRequestChain = new WeakMap();
const useWebWorker = appConfig.use_web_worker;
const chat = useWebWorker ?
    new ChatWorkerClient(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })) :
    new ChatModule();
const localChat = new ChatRestModule();
new ChatUI(chat, localChat);
