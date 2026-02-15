import { useMemo, type ReactNode } from 'react'
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  SimpleImageAttachmentAdapter,
  type ChatModelAdapter,
} from '@assistant-ui/react'
import { useX402Fetch } from '@/hooks/use-x402-fetch'
import { createX402ChatAdapter } from '@/lib/chat-adapter'
import { useModel } from '@/providers/ModelProvider'
import { WALLET_PROMPT_MARKER } from '@/lib/constants'
import { createLocalStorageThreadListAdapter } from '@/lib/thread-storage'

/** Fallback adapter shown when no wallet is connected */
const disconnectedAdapter: ChatModelAdapter = {
  async *run() {
    yield {
      content: [
        {
          type: 'text' as const,
          text: `${WALLET_PROMPT_MARKER}Please connect your wallet to start chatting. Each message requires a small USDC micropayment via the x402 protocol.`,
        },
      ],
      status: { type: 'complete' as const, reason: 'stop' as const },
    }
  },
}

/** Singleton adapters — created once, reused across renders */
const threadListAdapter = createLocalStorageThreadListAdapter()
const imageAttachmentAdapter = new SimpleImageAttachmentAdapter()

/** Inner hook that creates a LocalRuntime (used by the thread list runtime) */
function useInnerRuntime() {
  const { fetchWithPayment } = useX402Fetch()
  const { selectedModel, selectedModelType } = useModel()

  const adapter = useMemo<ChatModelAdapter>(
    () =>
      fetchWithPayment
        ? createX402ChatAdapter(fetchWithPayment, selectedModel, selectedModelType)
        : disconnectedAdapter,
    [fetchWithPayment, selectedModel, selectedModelType],
  )

  return useLocalRuntime(adapter, {
    adapters: {
      attachments: imageAttachmentAdapter,
    },
  })
}

/**
 * Provides the assistant-ui runtime backed by the x402 LLM gateway.
 * Wraps LocalRuntime with RemoteThreadListRuntime for multi-thread
 * persistence via localStorage.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useInnerRuntime,
    adapter: threadListAdapter,
  })

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
}
