/** Gateway endpoint for x402-protected LLM API */
export const GATEWAY_URL = "https://llm.qntx.fun";

/** Default model to use for chat completions */
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

/** WalletConnect project ID — replace with your own from https://cloud.walletconnect.com */
export const WALLETCONNECT_PROJECT_ID = "YOUR_PROJECT_ID";

/** Preferred chain IDs for x402 payment (CAIP-2 format), Monad first */
export const PREFERRED_CHAINS = [
  "eip155:143", // Monad mainnet
  "eip155:8453", // Base mainnet
] as const;
