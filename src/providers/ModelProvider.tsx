import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { GATEWAY_URL, DEFAULT_MODEL } from '@/lib/config'

// Types

export interface ModelInfo {
  /** Model ID, e.g. "qntx/gpt-4o" */
  id: string
  /** Display name derived from the model ID */
  label: string
  /** Provider name, e.g. "openai", "deepseek" */
  provider: string
}

interface ModelContextValue {
  /** Available chat models fetched from the gateway */
  models: ModelInfo[]
  /** Whether models are still loading */
  isLoading: boolean
  /** Currently selected model ID */
  selectedModel: string
  /** Update the selected model */
  setSelectedModel: (id: string) => void
}

// Non-chat model patterns to exclude from the list
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

/** Extract a human-readable label from a model ID like "qntx/gpt-4o" → "GPT-4o" */
function formatLabel(id: string): string {
  const name = id.includes('/') ? id.split('/').pop()! : id
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Extract provider from model ID like "qntx/gpt-4o" → "qntx" */
function extractProvider(id: string): string {
  return id.includes('/') ? id.split('/')[0]! : 'unknown'
}

// Context

const ModelContext = createContext<ModelContextValue | null>(null)

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}

// Provider

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
        const data: { id: string; owned_by?: string }[] = json.data ?? []

        // Filter out non-chat models (embedding, tts, image gen, etc.)
        const chatModels = data
          .filter((m) => {
            const lower = m.id.toLowerCase()
            return !EXCLUDE_PATTERNS.some((p) => lower.includes(p))
          })
          .map(
            (m): ModelInfo => ({
              id: m.id,
              label: formatLabel(m.id),
              provider: extractProvider(m.id),
            }),
          )
          .sort((a, b) => a.id.localeCompare(b.id))

        if (!cancelled) {
          setModels(chatModels)
          // If current default is not in the list, pick the first available
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
