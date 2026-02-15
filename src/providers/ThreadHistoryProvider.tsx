import { useCallback, useMemo, type PropsWithChildren } from 'react'
import {
  RuntimeAdapterProvider,
  useAuiState,
  type ExportedMessageRepositoryItem,
} from '@assistant-ui/react'
import { loadRepo, saveRepo } from '@/lib/thread-storage'

/** Provider that injects per-thread localStorage-backed history adapter. */
export function ThreadHistoryProvider({ children }: PropsWithChildren) {
  const remoteId = useAuiState((s) => s.threadListItem.remoteId)

  const history = useLocalStorageHistoryAdapter(remoteId)
  const adapters = useMemo(() => ({ history }), [history])

  return <RuntimeAdapterProvider adapters={adapters}>{children}</RuntimeAdapterProvider>
}

/** localStorage-backed ThreadHistoryAdapter */
function useLocalStorageHistoryAdapter(remoteId: string | undefined) {
  const load = useCallback(async () => {
    if (!remoteId) return { messages: [] }
    return loadRepo(remoteId) ?? { messages: [] }
  }, [remoteId])

  const append = useCallback(
    async (item: ExportedMessageRepositoryItem) => {
      if (!remoteId) return
      const repo = loadRepo(remoteId) ?? { messages: [] }
      // Update or add the message in the repository
      const idx = repo.messages.findIndex((m) => m.message.id === item.message.id)
      if (idx >= 0) {
        repo.messages[idx] = item
      } else {
        repo.messages.push(item)
      }
      // Always update headId to the latest message
      repo.headId = item.message.id
      saveRepo(remoteId, repo)
    },
    [remoteId],
  )

  return useMemo(() => ({ load, append }), [load, append])
}
