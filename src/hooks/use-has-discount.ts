import { useAccount } from 'wagmi'
import { useDiscount, type DiscountInfo } from '@/hooks/use-discount'

/**
 * Convenience hook that combines wallet connection + discount query.
 *
 * Eliminates the repeated `useAccount()` + `useDiscount(address)` pattern
 * used across Thread, ThreadList, and Header components.
 */
export function useHasDiscount(): {
  hasDiscount: boolean
  discount: DiscountInfo | null
  address: string | undefined
  loading: boolean
} {
  const { address } = useAccount()
  const { discount, loading } = useDiscount(address ?? null)

  return {
    hasDiscount: !!discount && discount.discount_percent > 0,
    discount,
    address,
    loading,
  }
}
