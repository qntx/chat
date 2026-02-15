import { useState, useRef, useCallback } from 'react'

/**
 * Hook that manages "copied" visual feedback state.
 *
 * Returns `copied` (true for 2s after `onCopy` is called) and an `onCopy`
 * callback. The caller is responsible for performing the actual copy
 * (e.g. via `navigator.clipboard.writeText` or an ActionBarPrimitive).
 */
export function useCopyFeedback(durationMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const onCopy = useCallback(() => {
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), durationMs)
  }, [durationMs])

  return { copied, onCopy }
}
