import appConfig, { ModelConfig, AppConfig } from "./app-config";
import type { ChatInterface } from "@mlc-ai/web-llm";
import { ChatModule, ChatRestModule, ChatWorkerClient } from "@mlc-ai/web-llm";

const getElementAndCheck = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Cannot find element ${id}`);
  return element;
};

class ChatUI {
  #chat: ChatInterface;
  #localChat: ChatInterface;
  #uiChatInput: HTMLInputElement;
  #uiChatInfoLabel: HTMLLabelElement;
  #config: AppConfig;
  #selectedModel: string;
  #requestInProgress: boolean;
  #chatRequestChain: Promise<void>;

  constructor(chat: ChatInterface, localChat: ChatInterface) {
    this.#chat = chat;
    this.#localChat = localChat;
    this.#uiChatInput = getElementAndCheck("chatui-input") as HTMLInputElement;
    this.#uiChatInfoLabel = getElementAndCheck("chatui-info-label") as HTMLLabelElement;
    this.#config = appConfig;
    this.#selectedModel = "";
    this.#requestInProgress = false;
    this.#chatRequestChain = Promise.resolve();
    
    getElementAndCheck("chatui-reset-btn").onclick = () => this.onReset();
    getElementAndCheck("chatui-send-btn").onclick = () => this.onGenerate();
    this.#uiChatInput.onkeypress = (event: KeyboardEvent) => {
      if (event.code === "Enter") this.onGenerate();
    };

    const modelSelector = getElementAndCheck("chatui-select") as HTMLSelectElement;
    this.populateDropdown(modelSelector, this.#config.model_list);
    this.#selectedModel = modelSelector.value;
    modelSelector.onchange = () => this.onSelectChange(modelSelector);
  }

  private populateDropdown(modelSelector: HTMLSelectElement, modelList: { local_id: string }[]) {
    modelList.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.local_id;
      opt.textContent = item.local_id;
      modelSelector.append(opt);
    });
  }

  private pushTask(task: () => Promise<void>) {
    this.#chatRequestChain = this.#chatRequestChain.then(task);
  }

  private async onGenerate() {
    if (this.#requestInProgress) return;
    this.pushTask(() => this.asyncGenerate());
  }

  private async onSelectChange(modelSelector: HTMLSelectElement) {
    this.pushTask(async () => {
      await this.#chat.resetChat();
      this.resetChatHistory();
      await this.unloadChat();
      this.#selectedModel = modelSelector.value;
      await this.asyncInitChat();
    });
  }

  private async onReset() {
    this.pushTask(async () => {
      await this.#chat.resetChat();
      this.resetChatHistory();
    });
  }

  private async asyncInitChat() {
    this.#requestInProgress = true;
    try {
      if (this.#selectedModel !== "Local Server") {
        await this.#chat.reload(this.#selectedModel, undefined, this.#config);
      }
    } catch (err) {
      this.unloadChat();
      this.#requestInProgress = false;
      return;
    }
    this.#requestInProgress = false;
  }

  private async unloadChat() {
    await this.#chat.unload();
  }

  private async asyncGenerate() {
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
      } else {
        output = await this.#chat.generate(prompt);
      }
      this.#uiChatInfoLabel.textContent = output;
    } catch (err) {
      await this.unloadChat();
    }
    this.#requestInProgress = false;
  }

  private resetChatHistory() {
    this.#uiChatInfoLabel.textContent = "";
  }
}

const useWebWorker = appConfig.use_web_worker;
const chat: ChatInterface = useWebWorker ? 
  new ChatWorkerClient(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })) :
  new ChatModule();
  
const localChat = new ChatRestModule();
new ChatUI(chat, localChat);
