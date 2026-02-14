/** Shared Tailwind class constants used across multiple components. */

/** Icon button — size-9 rounded-lg with muted foreground, hover accent surface. */
export const ICON_BTN =
  'flex size-9 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground'

/** Action button — compact size-7 for inline message actions (copy, reload, edit). */
export const ACTION_BTN =
  'flex size-7 items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-3.5'

/** Connect wallet button — bordered, accent surface. */
export const WALLET_BTN =
  'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-accent/50 px-4 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent'
