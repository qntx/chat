import { useMemo, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { useX402Fetch } from "@/hooks/use-x402-fetch";
import { createX402ChatAdapter } from "@/lib/x402";
import { DEFAULT_MODEL } from "@/lib/config";

/** Fallback adapter shown when no wallet is connected */
const disconnectedAdapter: ChatModelAdapter = {
  async *run() {
    yield {
      content: [
        {
          type: "text" as const,
          text: "⚠️ Please connect your wallet first using the button in the top-right corner.\n\nOnce connected, each message will require a USDC micropayment via the x402 protocol.",
        },
      ],
      status: { type: "complete" as const, reason: "stop" as const },
    };
  },
};

/**
 * Provides the assistant-ui runtime backed by the x402 LLM gateway.
 * Falls back to a static prompt when no wallet is connected.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { fetchWithPayment } = useX402Fetch();

  const adapter = useMemo<ChatModelAdapter>(
    () =>
      fetchWithPayment
        ? createX402ChatAdapter(fetchWithPayment, DEFAULT_MODEL)
        : disconnectedAdapter,
    [fetchWithPayment],
  );

  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
