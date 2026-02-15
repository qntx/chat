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
 * Hook that queries the gateway for the caller's token-holding discount.
 *
 * Fetches once when `walletAddress` becomes non-null, then caches the
 * result until the address changes.  Returns `null` while loading or
 * if the gateway has no discount configured.
 */
export function useDiscount(walletAddress: string | null) {
  const [info, setInfo] = useState<DiscountInfo | null>(null)
  const [loading, setLoading] = useState(!!walletAddress)
  const [prevAddress, setPrevAddress] = useState(walletAddress)

  // Reset state when wallet address changes during render
  // (React-recommended pattern for adjusting state based on props,
  // see: https://react.dev/learn/you-might-not-need-an-effect)
  if (walletAddress !== prevAddress) {
    setPrevAddress(walletAddress)
    setInfo(null)
    setLoading(!!walletAddress)
  }

  useEffect(() => {
    if (!walletAddress) return

    let cancelled = false

    fetch(`${GATEWAY_URL}/v1/discount?address=${encodeURIComponent(walletAddress)}`)
      .then((res) => {
        // Non-2xx responses (404 = not configured, 502 = query failed)
        // are treated as "no discount available".
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setInfo(data as DiscountInfo | null)
      })
      .catch(() => {
        if (!cancelled) setInfo(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [walletAddress])

  return { discount: info, loading }
}
