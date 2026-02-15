import { useSyncExternalStore } from 'react'

/**
 * Payment flow phases:
 * - idle:      No active payment flow
 * - signing:   Waiting for wallet signature (MetaMask popup)
 * - verifying: Payment signed, server is verifying + settling (~5-7s)
 * - streaming: Response stream started, content is flowing
 */
export type PaymentPhase = 'idle' | 'signing' | 'verifying' | 'streaming'

let currentPhase: PaymentPhase = 'idle'
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) listener()
}

/** Get the current payment phase (snapshot for useSyncExternalStore). */
export function getPaymentPhase(): PaymentPhase {
  return currentPhase
}

/** Update the payment phase and notify all subscribers. */
export function setPaymentPhase(phase: PaymentPhase) {
  if (currentPhase !== phase) {
    currentPhase = phase
    emitChange()
  }
}

/** Subscribe to payment phase changes (for useSyncExternalStore). */
export function subscribePaymentPhase(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook to read the current payment phase reactively. */
export function usePaymentPhase(): PaymentPhase {
  return useSyncExternalStore(subscribePaymentPhase, getPaymentPhase, getPaymentPhase)
}
