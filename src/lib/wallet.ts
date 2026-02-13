import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";
import { base } from "wagmi/chains";
import { WALLETCONNECT_PROJECT_ID } from "./constants";

/** Monad mainnet chain definition */
export const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: "x402 Chat",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [monad, base],
  wallets: [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, coinbaseWallet, rainbowWallet, walletConnectWallet],
    },
  ],
});
