import type { FC } from 'react'
import { SparklesIcon } from 'lucide-react'
import { QNTX_TOKEN_URL } from '@/lib/constants'
import { useDiscountTiers } from '@/hooks/use-discount-tiers'

/** Format large numbers with K/M suffix for readability. */
function formatBalance(raw: string): string {
  const n = Number(raw)
  if (Number.isNaN(n)) return raw
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString()}M`
  if (n >= 1_000) return `${(n / 1_000).toLocaleString()}K`
  return n.toLocaleString()
}

/**
 * Compact discount tiers table showing all token-holding levels and
 * their corresponding discount percentages.
 *
 * Optionally highlights the user's current tier when `currentPercent`
 * is provided.
 */
export const DiscountTiers: FC<{ currentPercent?: number }> = ({ currentPercent }) => {
  const { tiers, loading } = useDiscountTiers()

  if (loading || tiers.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        <SparklesIcon className="size-3" />
        QNTX Discount Tiers
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-xs">
        {tiers.map((tier) => {
          const isActive = currentPercent !== undefined && currentPercent >= tier.discount_percent
          const isCurrent = currentPercent === tier.discount_percent
          return (
            <div key={tier.min_balance} className="contents">
              <span
                className={
                  isCurrent
                    ? 'font-semibold text-purple-600 dark:text-purple-400'
                    : isActive
                      ? 'text-foreground/70'
                      : 'text-muted-foreground'
                }
              >
                ≥ {formatBalance(tier.min_balance)} QNTX
              </span>
              <span
                className={
                  isCurrent
                    ? 'font-semibold text-purple-600 dark:text-purple-400'
                    : isActive
                      ? 'text-foreground/70'
                      : 'text-muted-foreground'
                }
              >
                {tier.discount_percent}% off
                {isCurrent && ' ←'}
              </span>
            </div>
          )
        })}
      </div>

      <a
        href={QNTX_TOKEN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 underline decoration-purple-400/40 underline-offset-2 transition-colors hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
      >
        Buy QNTX on nad.fun →
      </a>
    </div>
  )
}
