import type { FC } from 'react'
import { SparklesIcon } from 'lucide-react'
import { QNTX_TOKEN_URL } from '@/lib/constants'
import { useDiscount } from '@/hooks/use-discount'

/** Shows discount badge or a "Get discount" CTA linking to nad.fun. */
export const DiscountBadge: FC<{ address: string }> = ({ address }) => {
  const { discount, loading } = useDiscount(address)

  if (loading) return null

  // No discount — nudge user to buy QNTX tokens
  if (!discount || discount.discount_percent === 0) {
    return (
      <a
        href={QNTX_TOKEN_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Hold QNTX tokens to unlock up to 50% off"
        className="flex h-7 items-center gap-1 rounded-full border border-purple-300/40 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-purple-400 hover:text-purple-600 dark:border-purple-500/20 dark:hover:border-purple-400/40 dark:hover:text-purple-400"
      >
        <SparklesIcon className="size-3" />
        <span className="hidden sm:inline">Get discount</span>
      </a>
    )
  }

  // Has discount — show active tier, link to nad.fun for upgrade
  const label = discount.next_tier
    ? `${discount.discount_percent}% off · Hold ${discount.next_tier.min_balance} QNTX for ${discount.next_tier.discount_percent}%`
    : `${discount.discount_percent}% off (max tier)`

  return (
    <a
      href={QNTX_TOKEN_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex h-7 items-center gap-1 rounded-full bg-purple-500/10 px-2.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-500/20 dark:bg-purple-400/10 dark:text-purple-400 dark:hover:bg-purple-400/20"
    >
      <SparklesIcon className="size-3" />
      {discount.discount_percent}% off
    </a>
  )
}
