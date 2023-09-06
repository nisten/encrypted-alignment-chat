import { ChatModule, ChatRestModule, ChatWorkerClient } from "@mlc-ai/web-llm";
import appConfig from "./app-config";

declare global {
  interface Window {
    ChatModule: typeof ChatModule;
    ChatRestModule: typeof ChatRestModule;
    ChatWorkerClient: typeof ChatWorkerClient;
    appConfig: typeof appConfig;
  }
}

window.ChatModule = ChatModule;
window.ChatRestModule = ChatRestModule;
window.ChatWorkerClient = ChatWorkerClient;
window.appConfig = appConfig;
