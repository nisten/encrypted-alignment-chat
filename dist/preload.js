import { ChatModule, ChatRestModule, ChatWorkerClient } from "@mlc-ai/web-llm";
import appConfig from "./app-config";
window.ChatModule = ChatModule;
window.ChatRestModule = ChatRestModule;
window.ChatWorkerClient = ChatWorkerClient;
window.appConfig = appConfig;
