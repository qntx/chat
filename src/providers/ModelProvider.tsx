import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { GATEWAY_URL, DEFAULT_MODEL } from '@/lib/constants'

export type ModelType = 'chat' | 'image'

export interface ModelInfo {
  id: string
  provider: string
  type: ModelType
  /** Whether this model can also generate images (via images.generate). */
  canGenerateImages: boolean
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
  /** The full ModelInfo for the currently selected model. */
  currentModel: ModelInfo | undefined
  /** Effective type: 'image' when imageMode is ON for a capable model. */
  selectedModelType: ModelType
  setSelectedModel: (id: string) => void
  /** Whether image generation mode is active (Chat+IMG models only). */
  imageMode: boolean
  toggleImageMode: () => void
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

/** Dedicated image-only models that use images.generate (cannot chat). */
const IMAGE_ONLY_PATTERNS = ['dall-e', 'gpt-image', 'flux', 'stable-diffusion', 'midjourney']

/** Models that can generate images (via images.generate) but also support chat. */
const IMAGE_CAPABLE_PATTERNS = ['image']

/** Classify model: type determines the primary API, canGenerateImages flags image capability. */
function classifyModel(m: { id: string; architecture?: { output_modalities?: string[] } }): {
  type: ModelType
  canGenerateImages: boolean
} {
  const out = m.architecture?.output_modalities
  if (out?.length) {
    const hasImage = out.includes('image')
    const hasText = out.includes('text')
    if (hasImage && !hasText) return { type: 'image', canGenerateImages: true }
    return { type: 'chat', canGenerateImages: hasImage }
  }
  // Fallback: name-based heuristic
  const id = m.id.toLowerCase()
  if (IMAGE_ONLY_PATTERNS.some((p) => id.includes(p)))
    return { type: 'image', canGenerateImages: true }
  if (IMAGE_CAPABLE_PATTERNS.some((p) => id.includes(p)))
    return { type: 'chat', canGenerateImages: true }
  return { type: 'chat', canGenerateImages: false }
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
  const [imageMode, setImageMode] = useState(false)
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
            const { type, canGenerateImages } = classifyModel(m)
            const pm = priceMap.get(m.id)
            return {
              id: m.id,
              provider: m.id.includes('/') ? m.id.split('/')[0]! : 'unknown',
              type,
              canGenerateImages,
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

  const currentModel = useMemo(
    () => models.find((m) => m.id === selectedModel),
    [models, selectedModel],
  )

  const canImage = currentModel?.canGenerateImages ?? false
  const selectedModelType: ModelType =
    currentModel?.type === 'image' ? 'image' : imageMode && canImage ? 'image' : 'chat'

  const toggleImageMode = useCallback(() => setImageMode((v) => !v), [])

  const handleSelectModel = useCallback(
    (id: string) => {
      setSelectedModel(id)
      if (!models.find((m) => m.id === id)?.canGenerateImages) setImageMode(false)
    },
    [models],
  )

  const value = useMemo<ModelContextValue>(
    () => ({
      models,
      isLoading,
      selectedModel,
      currentModel,
      selectedModelType,
      setSelectedModel: handleSelectModel,
      imageMode: imageMode && canImage,
      toggleImageMode,
      pricing,
    }),
    [
      models,
      isLoading,
      selectedModel,
      currentModel,
      selectedModelType,
      handleSelectModel,
      imageMode,
      canImage,
      toggleImageMode,
      pricing,
    ],
  )

  return <ModelContext value={value}>{children}</ModelContext>
}
