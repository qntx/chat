import { useMemo } from 'react'
import { useWalletClient } from 'wagmi'
import { wrapFetchWithPayment, x402Client } from '@x402/fetch'
import { ExactEvmScheme, toClientEvmSigner } from '@x402/evm'
import { createSanitizedFetch } from '@/lib/fetch'
import { setPaymentPhase } from '@/lib/payment-phase'

/**
 * Hook that creates an x402-enhanced fetch bound to the connected wallet.
 * Returns `null` when no wallet is available.
 *
 * The returned fetch automatically handles HTTP 402 payment challenges:
 * detect → parse PAYMENT-REQUIRED → sign EIP-3009 → retry with signature.
 */
export function useX402Fetch() {
  const { data: walletClient } = useWalletClient()

  const fetchWithPayment = useMemo(() => {
    if (!walletClient?.account) return null

    const signer = toClientEvmSigner({
      address: walletClient.account.address,
      signTypedData: (msg) =>
        walletClient.signTypedData({
          account: walletClient.account!,
          domain: msg.domain as Record<string, unknown>,
          types: msg.types as Record<string, readonly { name: string; type: string }[]>,
          primaryType: msg.primaryType,
          message: msg.message,
        }),
    })

    const client = new x402Client()
    // Register only for the active chain — MetaMask rejects signTypedData
    // if the domain chainId doesn't match the wallet's active chain.
    client.register(`eip155:${walletClient.chain.id}`, new ExactEvmScheme(signer))

    const baseFetch = createSanitizedFetch()
    const walletAddress = walletClient.account.address

    // Wrap the base fetch to inject the X-Wallet-Address header on every
    // request so the gateway can apply token-holding discounts.
    //
    // IMPORTANT: When wrapFetchWithPayment retries after a 402, it passes
    // a Request object with PAYMENT-SIGNATURE already set and no `init`.
    // We must preserve those headers — otherwise the retry loses the
    // payment signature and gets another 402.
    //
    // Phase detection: when x402 retries with a payment header, the wallet
    // has already signed — transition from 'signing' → 'verifying'.
    const fetchWithWalletHeader: typeof fetch = (input, init) => {
      const base = init?.headers ?? (input instanceof Request ? input.headers : undefined)
      const headers = new Headers(base)
      if (!headers.has('x-wallet-address')) {
        headers.set('x-wallet-address', walletAddress)
      }

      // Detect payment retry: presence of payment header means signing
      // is done and the server is now verifying + settling the payment.
      const hasPayment =
        headers.has('x-payment') ||
        headers.has('payment') ||
        [...headers.keys()].some((k) => k.toLowerCase().includes('payment-'))
      if (hasPayment) {
        setPaymentPhase('verifying')
      }

      return baseFetch(input, { ...init, headers })
    }

    return wrapFetchWithPayment(fetchWithWalletHeader, client)
  }, [walletClient])

  return {
    fetchWithPayment,
    walletAddress: walletClient?.account?.address ?? null,
    isReady: !!fetchWithPayment,
  }
}
