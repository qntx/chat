import { type FC, useState, useRef, useCallback } from 'react'
import { SparklesIcon } from 'lucide-react'
import { useDiscount } from '@/hooks/use-discount'
import { useClickOutside } from '@/hooks/use-click-outside'
import { DiscountTiers } from '@/components/DiscountTiers'

/** Shows discount badge with a click-to-toggle popover listing all tiers. */
export const DiscountBadge: FC<{ address: string }> = ({ address }) => {
  const { discount, loading } = useDiscount(address)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useClickOutside(ref, close, open)

  if (loading) return null

  const percent = discount?.discount_percent ?? 0
  const hasDiscount = percent > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={hasDiscount ? `${percent}% off — click for all tiers` : 'View discount tiers'}
        className={
          hasDiscount
            ? 'flex h-7 items-center gap-1 rounded-full bg-purple-500/10 px-2.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-500/20 dark:bg-purple-400/10 dark:text-purple-400 dark:hover:bg-purple-400/20'
            : 'flex h-7 items-center gap-1 rounded-full border border-purple-300/40 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-purple-400 hover:text-purple-600 dark:border-purple-500/20 dark:hover:border-purple-400/40 dark:hover:text-purple-400'
        }
      >
        <SparklesIcon className="size-3" />
        <span className="hidden sm:inline">{hasDiscount ? `${percent}% off` : 'Discounts'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border/60 bg-background p-4 shadow-lg">
          <DiscountTiers currentPercent={percent} />
        </div>
      )}
    </div>
  )
}
