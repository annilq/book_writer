import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { BaseMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import {
  ChatOpenAI,
  ChatOpenAICallOptions,
  ChatOpenAIFields,
  ChatOpenAIStructuredOutputMethodOptions,
  OpenAIClient,
} from "@langchain/openai";
import { z } from "zod";

export interface ChatAlibabaCallOptions extends ChatOpenAICallOptions {
  headers?: Record<string, string>;
}

export interface ChatAlibabaInput extends ChatOpenAIFields {
  /**
   * The Alibaba API key to use for requests.
   * @default process.env.DASHSCOPE_API_KEY
   */
  apiKey?: string;
  /**
   * The name of the model to use.
   */
  model?: string;
  /**
   * Up to 4 sequences where the API will stop generating further tokens. The
   * returned text will not contain the stop sequence.
   * Alias for `stopSequences`
   */
  stop?: Array<string>;
  /**
   * Up to 4 sequences where the API will stop generating further tokens. The
   * returned text will not contain the stop sequence.
   */
  stopSequences?: Array<string>;
  /**
   * Whether or not to stream responses.
   */
  streaming?: boolean;
  /**
   * The temperature to use for sampling.
   */
  temperature?: number;
  /**
   * The maximum number of tokens that the model can process in a single response.
   * This limits ensures computational efficiency and resource management.
   */
  maxTokens?: number;
}

export class ChatAlibaba extends ChatOpenAI<ChatAlibabaCallOptions> {
  static lc_name() {
    return "ChatAlibaba";
  }

  _llmType() {
    return "alibaba";
  }

  get lc_secrets(): { [key: string]: string } | undefined {
    return {
      apiKey: "DASHSCOPE_API_KEY",
    };
  }

  lc_serializable = true;

  lc_namespace = ["langchain", "chat_models", "alibaba"];

  constructor(fields?: Partial<ChatAlibabaInput>) {
    const apiKey = fields?.apiKey || getEnvironmentVariable("DASHSCOPE_API_KEY");
    if (!apiKey) {
      throw new Error(
        `Alibaba API key not found. Please set the DASHSCOPE_API_KEY environment variable or pass the key into "apiKey" field.`
      );
    }

    super({
      ...fields,
      apiKey,
      configuration: {
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        ...fields?.configuration,
      },
    });
  }

  protected override _convertOpenAIDeltaToBaseMessageChunk(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delta: Record<string, any>,
    rawResponse: OpenAIClient.ChatCompletionChunk,
    defaultRole?:
      | "function"
      | "user"
      | "system"
      | "developer"
      | "assistant"
      | "tool"
  ) {
    const messageChunk = super._convertOpenAIDeltaToBaseMessageChunk(
      delta,
      rawResponse,
      defaultRole
    );
    messageChunk.additional_kwargs.reasoning_content = delta.reasoning_content;
    return messageChunk;
  }

  protected override _convertOpenAIChatCompletionMessageToBaseMessage(
    message: OpenAIClient.ChatCompletionMessage,
    rawResponse: OpenAIClient.ChatCompletion
  ) {
    const langChainMessage =
      super._convertOpenAIChatCompletionMessageToBaseMessage(
        message,
        rawResponse
      );
    langChainMessage.additional_kwargs.reasoning_content =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (message as any).reasoning_content;
    return langChainMessage;
  }

  withStructuredOutput<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RunOutput extends Record<string, any> = Record<string, any>
  >(
    outputSchema:
      | z.ZodType<RunOutput>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | Record<string, any>,
    config?: ChatOpenAIStructuredOutputMethodOptions<false>
  ): Runnable<BaseLanguageModelInput, RunOutput>;

  withStructuredOutput<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RunOutput extends Record<string, any> = Record<string, any>
  >(
    outputSchema:
      | z.ZodType<RunOutput>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | Record<string, any>,
    config?: ChatOpenAIStructuredOutputMethodOptions<true>
  ): Runnable<BaseLanguageModelInput, { raw: BaseMessage; parsed: RunOutput }>;

  withStructuredOutput<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RunOutput extends Record<string, any> = Record<string, any>
  >(
    outputSchema:
      | z.ZodType<RunOutput>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | Record<string, any>,
    config?: ChatOpenAIStructuredOutputMethodOptions<boolean>
  ):
    | Runnable<BaseLanguageModelInput, RunOutput>
    | Runnable<BaseLanguageModelInput, { raw: BaseMessage; parsed: RunOutput }>;

  withStructuredOutput<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RunOutput extends Record<string, any> = Record<string, any>
  >(
    outputSchema:
      | z.ZodType<RunOutput>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | Record<string, any>,
    config?: ChatOpenAIStructuredOutputMethodOptions<boolean>
  ):
    | Runnable<BaseLanguageModelInput, RunOutput>
    | Runnable<
        BaseLanguageModelInput,
        { raw: BaseMessage; parsed: RunOutput }
      > {
    const ensuredConfig = { ...config };
    // Alibaba does not support json schema yet
    if (ensuredConfig?.method === undefined) {
      ensuredConfig.method = "functionCalling";
    }
    return super.withStructuredOutput<RunOutput>(outputSchema, ensuredConfig);
  }
}