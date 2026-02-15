import { forwardRef, type ReactNode } from 'react'
import { ACTION_BTN } from '@/lib/styles'

/** Small action button used in message toolbars and branch pickers. */
export const IconBtn = forwardRef<
  HTMLButtonElement,
  { tooltip: string; children: ReactNode } & React.ComponentPropsWithoutRef<'button'>
>(({ tooltip, children, className, ...props }, ref) => (
  <button ref={ref} {...props} className={`${ACTION_BTN} ${className ?? ''}`} aria-label={tooltip}>
    {children}
  </button>
))
IconBtn.displayName = 'IconBtn'
