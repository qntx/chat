import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useAccount } from 'wagmi'
import { GATEWAY_URL, DEFAULT_MODEL } from '@/lib/constants'

export type ModelType = 'chat' | 'image'

export interface ModelInfo {
  id: string
  provider: string
  type: ModelType
  /** Whether this model can also generate images (via images.generate). */
  canGenerateImages: boolean
  /** Whether this model accepts image inputs (vision capability). */
  canAcceptImages: boolean
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

/**
 * Classify model capabilities purely from API metadata.
 *
 * When metadata is missing (e.g. qntx/ models via Bifrost), safe defaults
 * are used: text-only chat, no image generation, no vision input.
 * Zero name-matching heuristics — all capability flags come from the
 * upstream `architecture.input_modalities` / `output_modalities` arrays.
 */
function classifyModel(m: {
  architecture?: { input_modalities?: string[]; output_modalities?: string[] }
}): { type: ModelType; canGenerateImages: boolean; canAcceptImages: boolean } {
  const inp = m.architecture?.input_modalities
  const out = m.architecture?.output_modalities

  const hasImageOut = out?.includes('image') ?? false
  const hasTextOut = out?.includes('text') ?? true // default: assume text output
  const canAcceptImages = inp?.includes('image') ?? false

  return {
    type: hasImageOut && !hasTextOut ? 'image' : 'chat',
    canGenerateImages: hasImageOut,
    canAcceptImages,
  }
}

/**
 * Whether a model should be shown in the chat UI.
 * Excludes models whose metadata explicitly shows no text/image output
 * (e.g. embedding, tts, audio-only models).
 */
function isUsableModel(m: { architecture?: { output_modalities?: string[] } }): boolean {
  const out = m.architecture?.output_modalities
  if (!out?.length) return true // No metadata → keep (most are usable chat models)
  return out.includes('text') || out.includes('image')
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

/** Model metadata without pricing (fetched once from /v1/models). */
interface RawModel {
  id: string
  provider: string
  type: ModelType
  canGenerateImages: boolean
  canAcceptImages: boolean
}

/** Per-model price entry from the /v1/pricing endpoint. */
interface PriceEntry {
  price: string
  discountedPrice?: string
}

export function ModelProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount()
  const [rawModels, setRawModels] = useState<RawModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [imageMode, setImageMode] = useState(false)
  const [pricing, setPricing] = useState<PricingData>(DEFAULT_PRICING)
  const [priceMap, setPriceMap] = useState<Map<string, PriceEntry>>(new Map())

  // Fetch model metadata once (no pricing dependency)
  useEffect(() => {
    let cancelled = false

    async function fetchModels() {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/models`)
        const json = await res.json()
        const data: {
          id: string
          architecture?: { input_modalities?: string[]; output_modalities?: string[] }
        }[] = json.data ?? []

        const parsed: RawModel[] = data
          .filter(isUsableModel)
          .map((m) => {
            const { type, canGenerateImages, canAcceptImages } = classifyModel(m)
            return {
              id: m.id,
              provider: m.id.includes('/') ? m.id.split('/')[0]! : 'unknown',
              type,
              canGenerateImages,
              canAcceptImages,
            }
          })
          .sort((a, b) => a.id.localeCompare(b.id))

        if (!cancelled) {
          setRawModels(parsed)
          if (parsed.length > 0 && !parsed.some((m) => m.id === DEFAULT_MODEL)) {
            setSelectedModel(parsed[0]!.id)
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

  // Fetch pricing — re-runs when wallet address changes
  useEffect(() => {
    let cancelled = false

    async function fetchPricing() {
      try {
        const url = address
          ? `${GATEWAY_URL}/v1/pricing?address=${encodeURIComponent(address)}`
          : `${GATEWAY_URL}/v1/pricing`

        const res = await fetch(url)
        if (!res.ok) return

        const pj = await res.json()
        const nextPricing: PricingData = {
          defaultPrice: pj.default_price ?? '0.01',
          defaultDiscountedPrice: pj.default_discounted_price ?? null,
          discountPercent: pj.discount_percent ?? null,
        }

        const nextMap = new Map<string, PriceEntry>()
        for (const m of pj.models ?? []) {
          nextMap.set(m.model, {
            price: m.price,
            discountedPrice: m.discounted_price,
          })
        }

        if (!cancelled) {
          setPricing(nextPricing)
          setPriceMap(nextMap)
        }
      } catch {
        // Pricing fetch is best-effort; keep previous state
      }
    }

    fetchPricing()
    return () => {
      cancelled = true
    }
  }, [address])

  // Merge raw model metadata with pricing data
  const models = useMemo<ModelInfo[]>(
    () =>
      rawModels.map((m) => {
        const pm = priceMap.get(m.id)
        return {
          ...m,
          price: pm?.price ?? pricing.defaultPrice,
          discountedPrice: pm?.discountedPrice ?? pricing.defaultDiscountedPrice,
        }
      }),
    [rawModels, priceMap, pricing],
  )

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
