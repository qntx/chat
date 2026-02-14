import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { GATEWAY_URL, DEFAULT_MODEL } from '@/lib/config'

export type ModelType = 'chat' | 'image'

export interface ModelInfo {
  id: string
  provider: string
  type: ModelType
}

interface ModelContextValue {
  models: ModelInfo[]
  isLoading: boolean
  selectedModel: string
  selectedModelType: ModelType
  setSelectedModel: (id: string) => void
}

/** Patterns that identify models to completely exclude (not useful in chat UI) */
const EXCLUDE_PATTERNS = [
  'embedding',
  'tts',
  'whisper',
  'aqa',
  'audio',
  'deep-research',
  'computer-use',
]

/** Patterns that identify image generation models */
const IMAGE_PATTERNS = ['dall-e', 'image', 'flux', 'stable-diffusion', 'midjourney']

const ModelContext = createContext<ModelContextValue | null>(null)

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)

  useEffect(() => {
    let cancelled = false

    async function fetchModels() {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/models`)
        const json = await res.json()
        const data: { id: string }[] = json.data ?? []

        const chatModels: ModelInfo[] = data
          .filter((m) => !EXCLUDE_PATTERNS.some((p) => m.id.toLowerCase().includes(p)))
          .map((m) => {
            const lower = m.id.toLowerCase()
            const type: ModelType = IMAGE_PATTERNS.some((p) => lower.includes(p)) ? 'image' : 'chat'
            return {
              id: m.id,
              provider: m.id.includes('/') ? m.id.split('/')[0]! : 'unknown',
              type,
            }
          })
          .sort((a, b) => a.id.localeCompare(b.id))

        if (!cancelled) {
          setModels(chatModels)
          if (chatModels.length > 0 && !chatModels.some((m) => m.id === DEFAULT_MODEL)) {
            setSelectedModel(chatModels[0]!.id)
          }
        }
      } catch (err) {
        console.error('[ModelProvider] Failed to fetch models:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchModels()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedModelType: ModelType = models.find((m) => m.id === selectedModel)?.type ?? 'chat'

  const value = useMemo<ModelContextValue>(
    () => ({ models, isLoading, selectedModel, selectedModelType, setSelectedModel }),
    [models, isLoading, selectedModel, selectedModelType],
  )

  return <ModelContext value={value}>{children}</ModelContext>
}
