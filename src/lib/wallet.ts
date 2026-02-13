import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";
import { WALLETCONNECT_PROJECT_ID } from "./constants";

export const wagmiConfig = getDefaultConfig({
  appName: "x402 Chat",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [base, baseSepolia],
});
