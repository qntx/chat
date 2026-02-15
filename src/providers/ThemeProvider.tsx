import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

/** Theme preference stored by the user. 'system' follows OS preference. */
export type ThemePreference = 'light' | 'dark' | 'system'

/** Resolved theme that is actually applied (no 'system'). */
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  preference: ThemePreference
  resolved: ResolvedTheme
  setTheme: (next: ThemePreference) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'qntx-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Reads the stored preference, falling back to 'system'. */
function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* SSR or restricted storage */
  }
  return 'system'
}

/** Resolves 'system' to an actual theme using the OS media query. */
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Applies the resolved theme to the document root element. */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
}

/**
 * Provider that manages light/dark theme with system preference detection
 * and localStorage persistence. Must wrap the entire app so all consumers
 * share a single source of truth.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(preference))

  // Apply theme to DOM whenever resolved value changes
  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  // Listen for OS preference changes when mode is 'system'
  useEffect(() => {
    if (preference !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const next = e.matches ? 'dark' : 'light'
      setResolved(next)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference])

  const setTheme = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    setResolved(resolveTheme(next))
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* quota exceeded */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system')
  }, [preference, setTheme])

  const value = useMemo(
    () => ({ preference, resolved, setTheme, toggleTheme }),
    [preference, resolved, setTheme, toggleTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

/** Hook to consume the shared theme context. Must be used within ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
