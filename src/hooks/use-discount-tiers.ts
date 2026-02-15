import { useEffect, useState } from 'react'
import { GATEWAY_URL } from '@/lib/constants'

/** A single discount tier returned by the gateway. */
export interface DiscountTier {
  min_balance: string
  discount_percent: number
}

/**
 * Hook that fetches the configured discount tiers from the gateway.
 *
 * Fetches once on mount and caches the result for the component lifetime.
 * Returns an empty array while loading or if the gateway has no discount
 * configured.
 */
export function useDiscountTiers() {
  const [tiers, setTiers] = useState<DiscountTier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch(`${GATEWAY_URL}/v1/discount/tiers`)
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (data?.tiers && Array.isArray(data.tiers)) {
          setTiers(data.tiers as DiscountTier[])
        }
      })
      .catch(() => {
        /* discount not configured — ignore */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { tiers, loading }
}
