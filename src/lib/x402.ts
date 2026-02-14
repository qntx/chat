import type { ChatModelAdapter } from '@assistant-ui/react'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import OpenAI from 'openai'
import { GATEWAY_URL, DEFAULT_MODEL } from './config'
import type { ModelType } from '@/providers/ModelProvider'

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
 *
 * When modelType is 'image', the adapter calls images.generate instead of
 * chat.completions.create, and yields the result as an image content part.
 */
export function createX402ChatAdapter(
  fetchFn: typeof globalThis.fetch,
  model: string = DEFAULT_MODEL,
  modelType: ModelType = 'chat',
): ChatModelAdapter {
  const openai = new OpenAI({
    apiKey: 'x402',
    baseURL: `${GATEWAY_URL}/v1`,
    fetch: fetchFn,
    dangerouslyAllowBrowser: true,
  })

  if (modelType === 'image') {
    return createImageAdapter(openai, model)
  }
  return createChatAdapter(openai, model)
}

/** Adapter for streaming chat completions */
function createChatAdapter(openai: OpenAI, model: string): ChatModelAdapter {
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
          content: [{ type: 'text' as const, text: text || '🤷 No response received.' }],
          status: { type: 'complete' as const, reason: 'stop' as const },
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[x402] Chat request failed:', message)
        yield {
          content: [{ type: 'text' as const, text: `🙈 ${message}` }],
          status: { type: 'incomplete' as const, reason: 'error' as const, error: message },
        }
      }
    },
  }
}

/** Adapter for image generation via images.generate */
function createImageAdapter(openai: OpenAI, model: string): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      // Extract the last user message as the image prompt
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      const prompt = lastUser
        ? lastUser.content
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join(' ')
        : ''

      if (!prompt.trim()) {
        yield {
          content: [
            { type: 'text' as const, text: "✏️ Please describe the image you'd like to generate." },
          ],
          status: { type: 'complete' as const, reason: 'stop' as const },
        }
        return
      }

      try {
        // Show loading state
        yield { content: [{ type: 'text' as const, text: '🎨 Generating image…' }] }

        // Don't force response_format — DALL-E supports 'url' but most
        // other providers (Google Imagen, OpenRouter proxied models) only
        // return b64_json. Omitting lets each provider use its default.
        const response = await openai.images.generate(
          { model, prompt, n: 1 },
          { signal: abortSignal },
        )

        const item = response.data?.[0]
        // Resolve image source: prefer url, fall back to base64 data URI
        const imageUrl = item?.url
        const b64 = item?.b64_json
        const imageSrc = imageUrl ?? (b64 ? `data:image/png;base64,${b64}` : undefined)
        const revisedPrompt = item?.revised_prompt

        if (!imageSrc) {
          yield {
            content: [
              {
                type: 'text' as const,
                text: '🖼️ No image was returned — please try a different prompt.',
              },
            ],
            status: { type: 'complete' as const, reason: 'stop' as const },
          }
          return
        }

        // Yield image + optional revised prompt as content parts
        const content: ({ type: 'image'; image: string } | { type: 'text'; text: string })[] = [
          { type: 'image' as const, image: imageSrc },
        ]
        if (revisedPrompt) {
          content.push({ type: 'text' as const, text: revisedPrompt })
        }

        yield {
          content,
          status: { type: 'complete' as const, reason: 'stop' as const },
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[x402] Image generation failed:', message)
        yield {
          content: [{ type: 'text' as const, text: `🙈 ${message}` }],
          status: { type: 'incomplete' as const, reason: 'error' as const, error: message },
        }
      }
    },
  }
}
