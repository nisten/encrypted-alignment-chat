/**
 * Worker handler that can be used in a WebWorker
 *
 * @example
 *
 * // setup a chat worker handler that routes
 * // requests to the chat
 * const chat = new ChatModule();
 * cont handler = new ChatWorkerHandler(chat);
 * onmessage = handler.onmessage;
 */
export class ChatWorkerHandler {
    constructor(chat) {
        this.chat = chat;
        this.chat.setInitProgressCallback((report) => {
            const msg = {
                kind: "initProgressCallback",
                uuid: "",
                content: report
            };
            postMessage(msg);
        });
    }
    async handleTask(uuid, task) {
        try {
            const res = await task();
            const msg = {
                kind: "return",
                uuid: uuid,
                content: res
            };
            postMessage(msg);
        }
        catch (err) {
            const errStr = err.toString();
            const msg = {
                kind: "throw",
                uuid: uuid,
                content: errStr
            };
            postMessage(msg);
        }
    }
    onmessage(event) {
        const msg = event.data;
        switch (msg.kind) {
            case "reload": {
                this.handleTask(msg.uuid, async () => {
                    const params = msg.content;
                    await this.chat.reload(params.localIdOrUrl, params.chatOpts, params.appConfig);
                    return null;
                });
                return;
            }
            case "generate": {
                this.handleTask(msg.uuid, async () => {
                    const params = msg.content;
                    const progressCallback = (step, currentMessage) => {
                        const cbMessage = {
                            kind: "generateProgressCallback",
                            uuid: msg.uuid,
                            content: {
                                step: step,
                                currentMessage: currentMessage
                            }
                        };
                        postMessage(cbMessage);
                    };
                    return await this.chat.generate(params.input, progressCallback, params.streamInterval);
                });
                return;
            }
            case "runtimeStatsText": {
                this.handleTask(msg.uuid, async () => {
                    return await this.chat.runtimeStatsText();
                });
                return;
            }
            case "interruptGenerate": {
                this.handleTask(msg.uuid, async () => {
                    this.chat.interruptGenerate();
                    return null;
                });
                return;
            }
            case "unload": {
                this.handleTask(msg.uuid, async () => {
                    await this.chat.unload();
                    return null;
                });
                return;
            }
            case "resetChat": {
                this.handleTask(msg.uuid, async () => {
                    await this.chat.resetChat();
                    return null;
                });
                return;
            }
            default: {
                throw Error("Invalid kind, msg=" + msg);
            }
        }
    }
}
/**
 * A client of chat worker that exposes the chat interface
 *
 * @example
 *
 * const chat = new webllm.ChatWorkerClient(new Worker(
 *   new URL('./worker.ts', import.meta.url),
 *   {type: 'module'}
 * ));
 */
export class ChatWorkerClient {
    constructor(worker) {
        this.generateCallbackRegistry = new Map();
        this.pendingPromise = new Map();
        this.worker = worker;
        worker.onmessage = (event) => {
            this.onmessage(event);
        };
    }
    setInitProgressCallback(initProgressCallback) {
        this.initProgressCallback = initProgressCallback;
    }
    getPromise(msg) {
        const uuid = msg.uuid;
        const executor = (resolve, reject) => {
            const cb = (msg) => {
                if (msg.kind == "return") {
                    resolve(msg.content);
                }
                else {
                    if (msg.kind != "throw") {
                        reject("Uknown msg kind " + msg.kind);
                    }
                    else {
                        reject(msg.content);
                    }
                }
            };
            this.pendingPromise.set(uuid, cb);
        };
        const promise = new Promise(executor);
        this.worker.postMessage(msg);
        return promise;
    }
    async reload(localIdOrUrl, chatOpts, appConfig) {
        const msg = {
            kind: "reload",
            uuid: crypto.randomUUID(),
            content: {
                localIdOrUrl: localIdOrUrl,
                chatOpts: chatOpts,
                appConfig: appConfig
            }
        };
        await this.getPromise(msg);
    }
    async generate(input, progressCallback, streamInterval) {
        const msg = {
            kind: "generate",
            uuid: crypto.randomUUID(),
            content: {
                input: input,
                streamInterval: streamInterval
            }
        };
        if (progressCallback !== undefined) {
            this.generateCallbackRegistry.set(msg.uuid, progressCallback);
        }
        return await this.getPromise(msg);
    }
    async runtimeStatsText() {
        const msg = {
            kind: "runtimeStatsText",
            uuid: crypto.randomUUID(),
            content: null
        };
        return await this.getPromise(msg);
    }
    interruptGenerate() {
        const msg = {
            kind: "interruptGenerate",
            uuid: crypto.randomUUID(),
            content: null
        };
        this.getPromise(msg);
    }
    async unload() {
        const msg = {
            kind: "unload",
            uuid: crypto.randomUUID(),
            content: null
        };
        await this.getPromise(msg);
    }
    async resetChat() {
        const msg = {
            kind: "resetChat",
            uuid: crypto.randomUUID(),
            content: null
        };
        await this.getPromise(msg);
    }
    onmessage(event) {
        const msg = event.data;
        switch (msg.kind) {
            case "initProgressCallback": {
                if (this.initProgressCallback !== undefined) {
                    this.initProgressCallback(msg.content);
                }
                return;
            }
            case "generateProgressCallback": {
                const params = msg.content;
                const cb = this.generateCallbackRegistry.get(msg.uuid);
                if (cb !== undefined) {
                    cb(params.step, params.currentMessage);
                }
                return;
            }
            case "return": {
                const cb = this.pendingPromise.get(msg.uuid);
                if (cb === undefined) {
                    throw Error("return from a unknown uuid msg=" + msg.uuid);
                }
                this.pendingPromise.delete(msg.uuid);
                cb(msg);
                return;
            }
            case "throw": {
                const cb = this.pendingPromise.get(msg.uuid);
                if (cb === undefined) {
                    throw Error("return from a unknown uuid, msg=" + msg);
                }
                this.pendingPromise.delete(msg.uuid);
                cb(msg);
                return;
            }
            default: {
                throw Error("Unknown msg kind, msg=" + msg);
            }
        }
    }
}
