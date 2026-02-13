import type { ChatModelAdapter } from "@assistant-ui/react";
import { GATEWAY_URL, DEFAULT_MODEL } from "./constants";

/**
 * Parse an OpenAI-compatible SSE stream into an async iterable of delta objects.
 * Handles the `data: [DONE]` sentinel and ignores blank keep-alive lines.
 */
async function* parseSSEStream(
  response: Response,
  signal: AbortSignal,
): AsyncIterable<{ choices: { delta: { content?: string } }[] }> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();
        if (data === "[DONE]") return;

        try {
          yield JSON.parse(data);
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Convert assistant-ui message format to OpenAI-compatible messages.
 */
function toOpenAIMessages(
  messages: Parameters<ChatModelAdapter["run"]>[0]["messages"],
) {
  return messages.map((msg) => {
    if (msg.role === "user") {
      const parts = msg.content;
      // Simple text-only message
      if (parts.length === 1 && parts[0]!.type === "text") {
        return { role: "user" as const, content: parts[0]!.text };
      }
      // Multi-part message (text + images)
      return {
        role: "user" as const,
        content: parts.map((part) => {
          if (part.type === "text") return { type: "text" as const, text: part.text };
          if (part.type === "image") {
            return {
              type: "image_url" as const,
              image_url: { url: part.image },
            };
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

    return { role: msg.role as string, content: "" };
  });
}

/**
 * Create a ChatModelAdapter that calls the x402 LLM gateway.
 *
 * @param fetchFn - An x402-enhanced fetch function that automatically handles
 *                  402 Payment Required challenges via wallet signing.
 * @param model   - The model identifier to use (defaults to DEFAULT_MODEL).
 */
export function createX402ChatAdapter(
  fetchFn: typeof globalThis.fetch,
  model: string = DEFAULT_MODEL,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const openaiMessages = toOpenAIMessages(messages);

      const response = await fetchFn(`${GATEWAY_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: openaiMessages,
          stream: true,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gateway error ${response.status}: ${errorText.slice(0, 200)}`,
        );
      }

      let text = "";
      for await (const chunk of parseSSEStream(response, abortSignal)) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          text += delta;
          yield { content: [{ type: "text" as const, text }] };
        }
      }
    },
  };
}
