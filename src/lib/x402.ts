import type { ChatModelAdapter } from '@assistant-ui/react'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import OpenAI from 'openai'
import { GATEWAY_URL, DEFAULT_MODEL } from './config'

// Fetch sanitization

/**
 * Create a fetch wrapper that strips headers which break browser CORS:
 * - `x-stainless-*`: OpenAI SDK telemetry (not in server allow-list)
 * - `access-control-*`: @x402/fetch bug — sets Access-Control-Expose-Headers
 *   as a REQUEST header (it's response-only), causing preflight rejection
 */
export function createSanitizedFetch(
  baseFetch: typeof globalThis.fetch = globalThis.fetch,
): typeof globalThis.fetch {
  return (input, init) => {
    const req = new Request(input, init)
    for (const key of [...req.headers.keys()]) {
      if (key.startsWith('x-stainless') || key.startsWith('access-control')) {
        req.headers.delete(key)
      }
    }
    return baseFetch(req)
  }
}

// Message conversion

/** Extract concatenated text from assistant-ui message content parts. */
const extractText = (parts: readonly { type: string; text?: string }[]) =>
  parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')

/** Convert assistant-ui ThreadMessage[] to OpenAI ChatCompletionMessageParam[]. */
function toOpenAIMessages(
  messages: Parameters<ChatModelAdapter['run']>[0]['messages'],
): ChatCompletionMessageParam[] {
  return messages.map((msg): ChatCompletionMessageParam => {
    if (msg.role === 'user') {
      const parts = msg.content

      // Extract image parts from attachments (SimpleImageAttachmentAdapter
      // stores the data URL in attachment.content, not in the message content).
      const attachmentImages: { type: 'image'; image: string }[] = []
      if ('attachments' in msg && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.content) {
            for (const c of att.content) {
              if (c.type === 'image') attachmentImages.push(c as { type: 'image'; image: string })
            }
          }
        }
      }

      // Text-only shortcut (no images anywhere)
      if (attachmentImages.length === 0 && parts.length === 1 && parts[0]!.type === 'text') {
        return { role: 'user', content: parts[0]!.text }
      }

      const contentParts = parts.map((part) => {
        if (part.type === 'text') return { type: 'text' as const, text: part.text }
        if (part.type === 'image') {
          return { type: 'image_url' as const, image_url: { url: part.image } }
        }
        return { type: 'text' as const, text: '' }
      })

      // Append attachment images after inline content parts
      for (const img of attachmentImages) {
        contentParts.push({ type: 'image_url' as const, image_url: { url: img.image } })
      }

      return { role: 'user', content: contentParts }
    }
    if (msg.role === 'assistant') return { role: 'assistant', content: extractText(msg.content) }
    if (msg.role === 'system') return { role: 'system', content: extractText(msg.content) }
    return { role: 'user', content: '' }
  })
}

// Chat adapter

/**
 * Create a ChatModelAdapter backed by the OpenAI SDK with x402-enhanced fetch.
 *
 * The OpenAI SDK handles request formatting, auth headers, SSE parsing, and
 * streaming — while the x402-wrapped fetch transparently handles 402 payment
 * challenges. Header sanitization is applied via `createSanitizedFetch`.
 */
export function createX402ChatAdapter(
  fetchFn: typeof globalThis.fetch,
  model: string = DEFAULT_MODEL,
): ChatModelAdapter {
  const openai = new OpenAI({
    apiKey: 'x402',
    baseURL: `${GATEWAY_URL}/v1`,
    fetch: fetchFn,
    dangerouslyAllowBrowser: true,
  })

  return {
    async *run({ messages, abortSignal }) {
      const openaiMessages = toOpenAIMessages(messages)

      try {
        // Immediately signal "running" so the typing indicator appears
        // while waiting for wallet signature + server first response.
        yield { content: [{ type: 'text' as const, text: '' }] }

        const stream = await openai.chat.completions.create(
          { model, messages: openaiMessages, stream: true },
          { signal: abortSignal },
        )

        let text = ''
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            text += delta
            yield { content: [{ type: 'text' as const, text }] }
          }
        }

        yield {
          content: [{ type: 'text' as const, text: text || '(Empty response)' }],
          status: { type: 'complete' as const, reason: 'stop' as const },
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[x402] Request failed:', message)
        yield {
          content: [{ type: 'text' as const, text: `⚠️ ${message}` }],
          status: { type: 'incomplete' as const, reason: 'error' as const, error: message },
        }
      }
    },
  }
}
