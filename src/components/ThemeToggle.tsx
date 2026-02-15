import type { FC } from 'react'
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { ICON_BTN } from '@/lib/styles'

/** Theme toggle — cycles system → light → dark with matching icon. */
export const ThemeToggle: FC = () => {
  const { preference, toggleTheme } = useTheme()
  const Icon = preference === 'system' ? MonitorIcon : preference === 'light' ? SunIcon : MoonIcon
  const label =
    preference === 'system'
      ? 'Theme: System'
      : preference === 'light'
        ? 'Theme: Light'
        : 'Theme: Dark'

  return (
    <button onClick={toggleTheme} className={ICON_BTN} aria-label={label} title={label}>
      <Icon className="size-4" />
    </button>
  )
}
