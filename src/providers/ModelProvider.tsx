import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { GATEWAY_URL, DEFAULT_MODEL } from '@/lib/config'

export interface ModelInfo {
  id: string
  provider: string
}

interface ModelContextValue {
  models: ModelInfo[]
  isLoading: boolean
  selectedModel: string
  setSelectedModel: (id: string) => void
}

/** Patterns that identify non-chat models (embedding, tts, image gen, etc.) */
const EXCLUDE_PATTERNS = [
  'embedding',
  'tts',
  'whisper',
  'dall-e',
  'image',
  'aqa',
  'audio',
  'deep-research',
  'computer-use',
]

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
          .map((m) => ({
            id: m.id,
            provider: m.id.includes('/') ? m.id.split('/')[0]! : 'unknown',
          }))
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

  const value = useMemo<ModelContextValue>(
    () => ({ models, isLoading, selectedModel, setSelectedModel }),
    [models, isLoading, selectedModel],
  )

  return <ModelContext value={value}>{children}</ModelContext>
}
