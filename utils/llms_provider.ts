import { ChatOllama } from "@langchain/ollama";
import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Interface for model configurations
interface ModelConfig {
    temperature?: number;
    maxRetries?: number;
    model?: string;
    // Add other common configuration options here
}

export class ModelsProvider {
    private static instance: ModelsProvider;

    private constructor() { }

    public static getInstance(): ModelsProvider {
        if (!ModelsProvider.instance) {
            ModelsProvider.instance = new ModelsProvider();
        }
        return ModelsProvider.instance;
    }

    public getChatOllama(config: ModelConfig = {}): BaseChatModel {
        return new ChatOllama({
            model: config.model || "phi:latest",
            temperature: config.temperature ?? 0,
            maxRetries: config.maxRetries ?? 2,
            ...config
        });
    }

    public getChatDeepSeek(config: ModelConfig = {}): BaseChatModel {
        return new ChatDeepSeek({
            model: config.model || "deepseek-reasoner",
            temperature: config.temperature ?? 0,
            ...config
        });
    }

    // Method to get model by provider name
    public getModel(provider: string, config: ModelConfig = {}): BaseChatModel {
        switch (provider.toLowerCase()) {
            case 'ollama':
                return this.getChatOllama(config);
            case 'deepseek':
                return this.getChatDeepSeek(config);
            default:
                throw new Error(`Unsupported model provider: ${provider}`);
        }
    }
}

export default ModelsProvider.getInstance()