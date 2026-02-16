import type { ChatModelAdapter } from '@assistant-ui/react'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import OpenAI from 'openai'
import { GATEWAY_URL, DEFAULT_MODEL } from './constants'
import { setPaymentPhase } from './payment-phase'
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
 * Routing by model type:
 * - 'chat'       → chat.completions.create (text only)
 * - 'multimodal' → chat.completions.create (text + native image generation)
 * - 'image'      → images.generate (dedicated image generators like DALL-E)
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
  return createChatAdapter(openai, model, modelType === 'multimodal')
}

/**
 * Adapter for streaming chat completions.
 *
 * When `multimodal` is true, passes `modalities: ['text', 'image']` so the
 * model can return native image content alongside text (e.g. Gemini Image).
 * Images arrive in `delta.images` per the OpenRouter streaming format and
 * are rendered inline in the chat.
 */
function createChatAdapter(
  openai: OpenAI,
  model: string,
  multimodal = false,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const openaiMessages = toOpenAIMessages(messages)

      try {
        // Signal payment flow start — stepper will appear in the message bubble.
        setPaymentPhase('signing')
        yield { content: [{ type: 'text' as const, text: '' }] }

        // For multimodal models, request both text and image output.
        // `modalities` with 'image' is a provider extension (OpenRouter / Gemini)
        // not in the base OpenAI SDK types, so we cast through the streaming type.
        const stream = await openai.chat.completions.create(
          {
            model,
            messages: openaiMessages,
            stream: true,
            ...(multimodal ? { modalities: ['text', 'image'] } : {}),
          } as OpenAI.Chat.ChatCompletionCreateParamsStreaming,
          { signal: abortSignal },
        )

        let text = ''
        const images: string[] = []

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta

          // Standard text content
          if (delta?.content) {
            if (!text && images.length === 0) setPaymentPhase('streaming')
            text += delta.content
            yield { content: buildContent(text, images) }
          }

          // Native image content (OpenRouter multimodal format).
          // `delta.images` is a provider extension not in the OpenAI SDK types.
          const deltaImages = (delta as unknown as Record<string, unknown> | undefined)
            ?.images as { image_url?: { url?: string } }[] | undefined
          if (deltaImages) {
            if (!text && images.length === 0) setPaymentPhase('streaming')
            for (const img of deltaImages) {
              const url = img.image_url?.url
              if (url) images.push(url)
            }
            yield { content: buildContent(text, images) }
          }
        }

        setPaymentPhase('idle')
        const finalContent = buildContent(text, images)
        if (finalContent.length === 0) {
          finalContent.push({ type: 'text' as const, text: '🤷 No response received.' })
        }
        yield {
          content: finalContent,
          status: { type: 'complete' as const, reason: 'stop' as const },
        }
      } catch (err) {
        setPaymentPhase('idle')
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

/** Build mixed content array from accumulated text and images. */
function buildContent(
  text: string,
  images: string[],
): ({ type: 'text'; text: string } | { type: 'image'; image: string })[] {
  const parts: ({ type: 'text'; text: string } | { type: 'image'; image: string })[] = []
  for (const url of images) {
    parts.push({ type: 'image' as const, image: url })
  }
  if (text) {
    parts.push({ type: 'text' as const, text })
  }
  return parts
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
        // Signal payment flow start — stepper will appear in the message bubble.
        setPaymentPhase('signing')
        yield { content: [{ type: 'text' as const, text: '' }] }

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
          setPaymentPhase('idle')
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

        setPaymentPhase('idle')
        yield {
          content,
          status: { type: 'complete' as const, reason: 'stop' as const },
        }
      } catch (err) {
        setPaymentPhase('idle')
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
