import { useMemo, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { useX402Fetch } from "@/hooks/use-x402-fetch";
import { createX402ChatAdapter } from "@/lib/x402-adapter";
import { DEFAULT_MODEL } from "@/lib/constants";

/** Fallback adapter used when no wallet is connected */
const disconnectedAdapter: ChatModelAdapter = {
  async *run() {
    yield {
      content: [
        {
          type: "text" as const,
          text: "Please connect your wallet to start chatting.",
        },
      ],
    };
  },
};

/**
 * Provides the assistant-ui runtime backed by the x402 LLM gateway.
 * Falls back to a static message when the wallet is not connected.
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
