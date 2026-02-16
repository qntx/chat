import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { GATEWAY_URL, DEFAULT_MODEL } from '@/lib/constants'

export type ModelType = 'chat' | 'image' | 'multimodal'

export interface ModelInfo {
  id: string
  provider: string
  type: ModelType
  /** USDC price per message (e.g. "0.01") */
  price: string | null
  /** Discounted price if caller qualifies (e.g. "0.008") */
  discountedPrice: string | null
}

/** Pricing data returned by the /v1/pricing endpoint */
export interface PricingData {
  defaultPrice: string
  defaultDiscountedPrice: string | null
  discountPercent: number | null
}

interface ModelContextValue {
  models: ModelInfo[]
  isLoading: boolean
  selectedModel: string
  selectedModelType: ModelType
  setSelectedModel: (id: string) => void
  pricing: PricingData
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

/** Dedicated image-generation models that use images.generate (not chat.completions). */
const IMAGE_GEN_PATTERNS = ['dall-e', 'gpt-image', 'flux', 'stable-diffusion', 'midjourney']

/** Classify model type from API metadata or name-based fallback. */
function classifyModel(m: {
  id: string
  architecture?: { output_modalities?: string[] }
}): ModelType {
  const out = m.architecture?.output_modalities
  if (out?.length) {
    const hasImage = out.includes('image')
    return hasImage && out.includes('text') ? 'multimodal' : hasImage ? 'image' : 'chat'
  }
  // Fallback: name-based heuristic
  const id = m.id.toLowerCase()
  if (IMAGE_GEN_PATTERNS.some((p) => id.includes(p))) return 'image'
  return id.includes('image') ? 'multimodal' : 'chat'
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}

const DEFAULT_PRICING: PricingData = {
  defaultPrice: '0.01',
  defaultDiscountedPrice: null,
  discountPercent: null,
}

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [pricing, setPricing] = useState<PricingData>(DEFAULT_PRICING)

  useEffect(() => {
    let cancelled = false

    async function fetchModelsAndPricing() {
      try {
        // Fetch models and pricing in parallel
        const [modelsRes, pricingRes] = await Promise.all([
          fetch(`${GATEWAY_URL}/v1/models`),
          fetch(`${GATEWAY_URL}/v1/pricing`).catch(() => null),
        ])

        const modelsJson = await modelsRes.json()
        const data: { id: string; architecture?: { output_modalities?: string[] } }[] =
          modelsJson.data ?? []

        // Build pricing lookup map: model → { price, discountedPrice }
        const priceMap = new Map<string, { price: string; discountedPrice?: string }>()
        let pricingData = DEFAULT_PRICING

        if (pricingRes?.ok) {
          const pj = await pricingRes.json()
          pricingData = {
            defaultPrice: pj.default_price ?? '0.01',
            defaultDiscountedPrice: pj.default_discounted_price ?? null,
            discountPercent: pj.discount_percent ?? null,
          }
          for (const m of pj.models ?? []) {
            priceMap.set(m.model, {
              price: m.price,
              discountedPrice: m.discounted_price,
            })
          }
        }

        const chatModels: ModelInfo[] = data
          .filter((m) => !EXCLUDE_PATTERNS.some((p) => m.id.toLowerCase().includes(p)))
          .map((m) => {
            const type = classifyModel(m)
            const pm = priceMap.get(m.id)
            return {
              id: m.id,
              provider: m.id.includes('/') ? m.id.split('/')[0]! : 'unknown',
              type,
              price: pm?.price ?? pricingData.defaultPrice,
              discountedPrice: pm?.discountedPrice ?? pricingData.defaultDiscountedPrice,
            }
          })
          .sort((a, b) => a.id.localeCompare(b.id))

        if (!cancelled) {
          setModels(chatModels)
          setPricing(pricingData)
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

    fetchModelsAndPricing()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedModelType: ModelType = models.find((m) => m.id === selectedModel)?.type ?? 'chat'

  const value = useMemo<ModelContextValue>(
    () => ({ models, isLoading, selectedModel, selectedModelType, setSelectedModel, pricing }),
    [models, isLoading, selectedModel, selectedModelType, pricing],
  )

  return <ModelContext value={value}>{children}</ModelContext>
}
