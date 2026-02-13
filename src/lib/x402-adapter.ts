import type { ChatModelAdapter } from "@assistant-ui/react";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import OpenAI from "openai";
import { GATEWAY_URL, DEFAULT_MODEL } from "./constants";

/**
 * Convert assistant-ui ThreadMessage[] to OpenAI ChatCompletionMessageParam[].
 */
function toOpenAIMessages(
  messages: Parameters<ChatModelAdapter["run"]>[0]["messages"],
): ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role === "user") {
      const parts = msg.content;
      if (parts.length === 1 && parts[0]!.type === "text") {
        return { role: "user" as const, content: parts[0]!.text };
      }
      return {
        role: "user" as const,
        content: parts.map((part) => {
          if (part.type === "text") return { type: "text" as const, text: part.text };
          if (part.type === "image") {
            return { type: "image_url" as const, image_url: { url: part.image } };
          }
          return { type: "text" as const, text: "" };
        }),
      };
    }
    if (msg.role === "assistant") {
      const text = msg.content
        .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
        .map((p) => p.text)
        .join("");
      return { role: "assistant" as const, content: text };
    }
    if (msg.role === "system") {
      const text = msg.content
        .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
        .map((p) => p.text)
        .join("");
      return { role: "system" as const, content: text };
    }
    return { role: "user" as const, content: "" };
  });
}

/**
 * Create a ChatModelAdapter that uses the OpenAI SDK with x402-enhanced fetch.
 *
 * This mirrors the approach in x402-openai-typescript: the OpenAI SDK handles
 * request formatting, Authorization header, SSE parsing, and streaming — while
 * the x402-wrapped fetch transparently handles 402 payment challenges.
 */
export function createX402ChatAdapter(
  fetchFn: typeof globalThis.fetch,
  model: string = DEFAULT_MODEL,
): ChatModelAdapter {
  // Strip OpenAI SDK telemetry headers that CORS policies typically block
  const cleanFetch: typeof globalThis.fetch = (input, init) => {
    if (init?.headers) {
      const headers = new Headers(init.headers);
      for (const key of [...headers.keys()]) {
        if (key.startsWith("x-stainless")) headers.delete(key);
      }
      return fetchFn(input, { ...init, headers });
    }
    return fetchFn(input, init);
  };

  // Create OpenAI client with x402-wrapped fetch — same pattern as X402OpenAI
  const openai = new OpenAI({
    apiKey: "x402",
    baseURL: `${GATEWAY_URL}/v1`,
    fetch: cleanFetch,
    dangerouslyAllowBrowser: true,
  });

  return {
    async *run({ messages, abortSignal }) {
      const openaiMessages = toOpenAIMessages(messages);

      console.log("[x402-adapter] Streaming request via OpenAI SDK", {
        model,
        messageCount: openaiMessages.length,
      });

      try {
        const stream = await openai.chat.completions.create(
          {
            model,
            messages: openaiMessages,
            stream: true,
          },
          { signal: abortSignal },
        );

        let text = "";
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            text += delta;
            yield { content: [{ type: "text" as const, text }] };
          }
        }

        yield {
          content: [{ type: "text" as const, text: text || "(Empty response)" }],
          status: { type: "complete" as const, reason: "stop" as const },
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[x402-adapter] Request failed:", errorMessage);
        yield {
          content: [
            {
              type: "text" as const,
              text: `⚠️ ${errorMessage}`,
            },
          ],
          status: { type: "incomplete" as const, reason: "error" as const, error: errorMessage },
        };
      }
    },
  };
}
