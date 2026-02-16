import { useEffect, useState } from 'react'
import { GATEWAY_URL } from '@/lib/constants'

/** A single discount tier returned by the gateway. */
export interface DiscountTier {
  min_balance: string
  discount_percent: number
}

/** Module-level cache so tiers are fetched only once across all consumers. */
let cachedTiers: DiscountTier[] | null = null
let fetchPromise: Promise<void> | null = null

/**
 * Hook that fetches the configured discount tiers from the gateway.
 *
 * Fetches once globally and caches the result at module level, so
 * subsequent mounts (e.g. popover re-open) return instantly without
 * a loading flash.
 */
export function useDiscountTiers() {
  const [tiers, setTiers] = useState<DiscountTier[]>(cachedTiers ?? [])
  const [loading, setLoading] = useState(cachedTiers === null)

  useEffect(() => {
    // Already cached — nothing to do
    if (cachedTiers !== null) return

    let cancelled = false

    // Deduplicate concurrent fetches from multiple consumers
    if (!fetchPromise) {
      fetchPromise = fetch(`${GATEWAY_URL}/v1/discount/tiers`)
        .then((res) => {
          if (!res.ok) return null
          return res.json()
        })
        .then((data) => {
          if (data?.tiers && Array.isArray(data.tiers)) {
            cachedTiers = data.tiers as DiscountTier[]
          } else {
            cachedTiers = []
          }
        })
        .catch(() => {
          cachedTiers = []
        })
    }

    fetchPromise.then(() => {
      if (!cancelled) {
        setTiers(cachedTiers!)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { tiers, loading }
}
