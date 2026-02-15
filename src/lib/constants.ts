/** Gateway endpoint for x402-protected LLM API */
export const GATEWAY_URL = 'https://llm.qntx.fun'

/** Default model to use for chat completions */
export const DEFAULT_MODEL = 'openai/gpt-5.2'

/** Max width for thread content (messages, composer, welcome) */
export const MAX_THREAD_WIDTH = '42rem'

/** GitHub repository URL */
export const GITHUB_URL = 'https://github.com/qntx'

/** nad.fun token page — users can buy QNTX here to unlock discounts */
export const QNTX_TOKEN_URL = 'https://nad.fun/tokens/0x4Daab757f758689Afbb3848A037bd4A2ae107777'

/** Marker prefix injected by the disconnected adapter, detected by WalletAwareText */
export const WALLET_PROMPT_MARKER = '@@CONNECT_WALLET@@'

/** Block explorer base URLs keyed by chain ID (for address links). */
export const BLOCK_EXPLORERS: Record<number, string> = {
  143: 'https://monadscan.com', // Monad
  8453: 'https://basescan.org', // Base
  84532: 'https://sepolia.basescan.org', // Base Sepolia
}

/** Build an address page URL for the given chain + address. */
export function explorerAddressUrl(chainId: number, address: string): string {
  const base = BLOCK_EXPLORERS[chainId] ?? BLOCK_EXPLORERS[143]!
  return `${base}/address/${address}#tokentxns`
}
