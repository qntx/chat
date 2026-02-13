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

    // Register for all supported EVM networks
    client.register("eip155:8453", scheme);      // Base mainnet
    client.register("eip155:84532", scheme);     // Base Sepolia
    client.register("eip155:1", scheme);          // Ethereum mainnet
    client.register("eip155:10", scheme);         // Optimism
    client.register("eip155:42161", scheme);      // Arbitrum
    client.register("eip155:137", scheme);        // Polygon

    return wrapFetchWithPayment(globalThis.fetch, client);
  }, [walletClient]);

  return {
    fetchWithPayment,
    isReady: !!fetchWithPayment,
  };
}
