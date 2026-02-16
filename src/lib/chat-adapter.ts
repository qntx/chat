import type { ChatModelAdapter } from '@assistant-ui/react'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import OpenAI from 'openai'
import { GATEWAY_URL, DEFAULT_MODEL } from './constants'
import { setPaymentPhase } from './payment-phase'
import type { ModelType } from '@/providers/ModelProvider'

type TextPart = { type: 'text'; text: string }
type ImagePart = { type: 'image'; image: string }
type ContentPart = TextPart | ImagePart

const text = (t: string): TextPart => ({ type: 'text', text: t })
const image = (url: string): ImagePart => ({ type: 'image', image: url })

const COMPLETE = { type: 'complete' as const, reason: 'stop' as const }
const errorStatus = (msg: string) => ({
  type: 'incomplete' as const,
  reason: 'error' as const,
  error: msg,
})

const extractText = (parts: readonly { type: string; text?: string }[]) =>
  parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')

function toOpenAIMessages(
  messages: Parameters<ChatModelAdapter['run']>[0]['messages'],
): ChatCompletionMessageParam[] {
  return messages.map((msg): ChatCompletionMessageParam => {
    if (msg.role === 'user') {
      const parts = msg.content

      // Extract image parts from attachments
      const attImages: string[] = []
      if ('attachments' in msg && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments)
          for (const c of att.content ?? [])
            if (c.type === 'image') attImages.push((c as { image: string }).image)
      }

      // Text-only shortcut
      if (attImages.length === 0 && parts.length === 1 && parts[0]!.type === 'text') {
        return { role: 'user', content: parts[0]!.text }
      }

      const content = parts.map((p) =>
        p.type === 'image'
          ? { type: 'image_url' as const, image_url: { url: p.image } }
          : { type: 'text' as const, text: p.type === 'text' ? p.text : '' },
      )
      for (const url of attImages) {
        content.push({ type: 'image_url' as const, image_url: { url } })
      }
      return { role: 'user', content }
    }
    if (msg.role === 'assistant') return { role: 'assistant', content: extractText(msg.content) }
    if (msg.role === 'system') return { role: 'system', content: extractText(msg.content) }
    return { role: 'user', content: '' }
  })
}

/**
 * Create a ChatModelAdapter backed by the OpenAI SDK with x402-enhanced fetch.
 *
 * Routing: chat → chat.completions, image → images.generate.
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

  return modelType === 'image' ? imageAdapter(openai, model) : chatAdapter(openai, model)
}

function chatAdapter(openai: OpenAI, model: string): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      try {
        setPaymentPhase('signing')
        yield { content: [text('')] }

        const stream = await openai.chat.completions.create(
          { model, messages: toOpenAIMessages(messages), stream: true },
          { signal: abortSignal },
        )

        let acc = ''

        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            if (!acc) setPaymentPhase('streaming')
            acc += chunk.choices[0].delta.content
            yield { content: [text(acc)] }
          }
        }

        setPaymentPhase('idle')
        yield {
          content: [text(acc || '🤷 No response received.')],
          status: COMPLETE,
        }
      } catch (err) {
        yield* fail('[x402] Chat request failed', err)
      }
    },
  }
}

function imageAdapter(openai: OpenAI, model: string): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      const prompt = lastUser
        ? lastUser.content
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join(' ')
        : ''

      if (!prompt.trim()) {
        yield {
          content: [text("✏️ Please describe the image you'd like to generate.")],
          status: COMPLETE,
        }
        return
      }

      try {
        setPaymentPhase('signing')
        yield { content: [text('')] }

        const res = await openai.images.generate({ model, prompt, n: 1 }, { signal: abortSignal })

        const item = res.data?.[0]
        const src =
          item?.url ?? (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined)

        if (!src) {
          setPaymentPhase('idle')
          yield {
            content: [text('🖼️ No image was returned — please try a different prompt.')],
            status: COMPLETE,
          }
          return
        }

        const content: ContentPart[] = [image(src)]
        if (item?.revised_prompt) content.push(text(item.revised_prompt))

        setPaymentPhase('idle')
        yield { content, status: COMPLETE }
      } catch (err) {
        yield* fail('[x402] Image generation failed', err)
      }
    },
  }
}

async function* fail(label: string, err: unknown) {
  setPaymentPhase('idle')
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`${label}:`, msg)
  yield {
    content: [text(`🙈 ${msg}`)] as ContentPart[],
    status: errorStatus(msg),
  }
}
