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

/** Convert assistant-ui ThreadMessage[] to OpenAI ChatCompletionMessageParam[]. */
function toOpenAIMessages(
  messages: Parameters<ChatModelAdapter['run']>[0]['messages'],
): ChatCompletionMessageParam[] {
  return messages.map((msg): ChatCompletionMessageParam => {
    if (msg.role === 'user') {
      const parts = msg.content
      if (parts.length === 1 && parts[0]!.type === 'text') {
        return { role: 'user', content: parts[0]!.text }
      }
      return {
        role: 'user',
        content: parts.map((part) => {
          if (part.type === 'text') return { type: 'text' as const, text: part.text }
          if (part.type === 'image') {
            return { type: 'image_url' as const, image_url: { url: part.image } }
          }
          return { type: 'text' as const, text: '' }
        }),
      }
    }
    if (msg.role === 'assistant') {
      const text = msg.content
        .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
        .map((p) => p.text)
        .join('')
      return { role: 'assistant', content: text }
    }
    if (msg.role === 'system') {
      const text = msg.content
        .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
        .map((p) => p.text)
        .join('')
      return { role: 'system', content: text }
    }
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
