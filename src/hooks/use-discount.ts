import { useEffect, useState } from 'react'
import { GATEWAY_URL } from '@/lib/constants'

/** Discount info returned by the gateway's `/v1/discount` endpoint. */
export interface DiscountInfo {
  address: string
  balance: string
  discount_percent: number
  next_tier?: {
    min_balance: string
    discount_percent: number
  }
}

/**
 * Module-level cache keyed by address so the same address is fetched only once.
 * `info` is `undefined` while the request is in-flight, then set to the result
 * (which may be `null` if no discount is configured).
 */
const cache = new Map<string, { info: DiscountInfo | null | undefined; promise: Promise<void> }>()

/**
 * Hook that queries the gateway for the caller's token-holding discount.
 *
 * Fetches once per address globally and caches the result at module level,
 * so multiple consumers (DiscountBadge, ThreadWelcome, SidebarPromo) that
 * query the same address share a single request with no redundant fetches.
 *
 * Returns `null` while loading or if the gateway has no discount configured.
 */
export function useDiscount(walletAddress: string | null) {
  const cached = walletAddress ? cache.get(walletAddress) : undefined
  const resolved = cached?.info !== undefined
  const [info, setInfo] = useState<DiscountInfo | null>(cached?.info ?? null)
  const [loading, setLoading] = useState(walletAddress ? !resolved : false)
  const [prevAddress, setPrevAddress] = useState(walletAddress)

  // Reset state when wallet address changes during render
  // (React-recommended pattern for adjusting state based on props,
  // see: https://react.dev/learn/you-might-not-need-an-effect)
  if (walletAddress !== prevAddress) {
    setPrevAddress(walletAddress)
    const next = walletAddress ? cache.get(walletAddress) : undefined
    const nextResolved = next?.info !== undefined
    setInfo(next?.info ?? null)
    setLoading(walletAddress ? !nextResolved : false)
  }

  useEffect(() => {
    if (!walletAddress) return

    // Already resolved — state was set during render via useState initializer
    // or the render-time address change handler above
    const existing = cache.get(walletAddress)
    if (existing && existing.info !== undefined) return

    let cancelled = false

    // Deduplicate concurrent fetches for the same address
    if (!existing) {
      const promise = fetch(
        `${GATEWAY_URL}/v1/discount?address=${encodeURIComponent(walletAddress)}`,
      )
        .then((res) => {
          if (!res.ok) return null
          return res.json()
        })
        .then((data) => {
          const entry = cache.get(walletAddress)
          if (entry) entry.info = (data as DiscountInfo) ?? null
        })
        .catch(() => {
          const entry = cache.get(walletAddress)
          if (entry) entry.info = null
        })

      cache.set(walletAddress, { info: undefined, promise })
    }

    cache.get(walletAddress)!.promise.then(() => {
      if (!cancelled) {
        setInfo(cache.get(walletAddress)?.info ?? null)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [walletAddress])

  return { discount: info, loading }
}
