import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";

/**
 * Hook that creates an x402-enhanced fetch function bound to the
 * currently connected wallet. Returns null when no wallet is connected.
 *
 * The returned fetch automatically:
 *   1. Detects HTTP 402 responses from the gateway
 *   2. Parses the PAYMENT-REQUIRED header
 *   3. Signs an EIP-3009 transferWithAuthorization via the wallet
 *   4. Retries the request with the PAYMENT-SIGNATURE header
 */
export function useX402Fetch() {
  const { data: walletClient } = useWalletClient();

  const fetchWithPayment = useMemo(() => {
    if (!walletClient?.account) return null;

    const chainId = walletClient.chain.id;
    console.log("[x402] Registering for chain:", chainId);

    // Adapt viem WalletClient to x402 ClientEvmSigner interface
    const signer = toClientEvmSigner({
      address: walletClient.account.address,
      signTypedData: async (msg) => {
        return walletClient.signTypedData({
          account: walletClient.account!,
          domain: msg.domain as Record<string, unknown>,
          types: msg.types as Record<string, readonly { name: string; type: string }[]>,
          primaryType: msg.primaryType,
          message: msg.message,
        });
      },
    });

    const scheme = new ExactEvmScheme(signer);
    const client = new x402Client();

    // Register only for the wallet's active chain to avoid chainId mismatch
    // when MetaMask rejects signTypedData for a different chain.
    client.register(`eip155:${chainId}`, scheme);

    // Wrap globalThis.fetch to strip access-control-* request headers that
    // @x402/fetch incorrectly adds (Access-Control-Expose-Headers is a
    // response-only header but x402 sets it on the retry request, breaking CORS).
    const browserSafeFetch: typeof globalThis.fetch = (input, init) => {
      const req = new Request(input, init);
      for (const key of [...req.headers.keys()]) {
        if (key.startsWith("access-control")) req.headers.delete(key);
      }
      return globalThis.fetch(req);
    };

    return wrapFetchWithPayment(browserSafeFetch, client);
  }, [walletClient]);

  return {
    fetchWithPayment,
    isReady: !!fetchWithPayment,
  };
}
