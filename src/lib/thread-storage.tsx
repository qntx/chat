import { useCallback, useMemo, type PropsWithChildren } from 'react'
import {
  RuntimeAdapterProvider,
  useAuiState,
  type ThreadMessage,
  type ExportedMessageRepository,
  type ExportedMessageRepositoryItem,
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
} from '@assistant-ui/react'
import { createAssistantStream } from 'assistant-stream'

type RemoteThreadMetadata = {
  readonly status: 'regular' | 'archived'
  readonly remoteId: string
  readonly externalId?: string | undefined
  readonly title?: string | undefined
}

type RemoteThreadListResponse = {
  threads: RemoteThreadMetadata[]
}

type RemoteThreadInitializeResponse = {
  remoteId: string
  externalId: string | undefined
}

const THREADS_KEY = 'qntx:threads'
const MESSAGES_KEY_PREFIX = 'qntx:messages:'

function loadThreads(): RemoteThreadMetadata[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveThreads(threads: RemoteThreadMetadata[]): void {
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads))
}

/** Load threads, apply an updater to the matching entry, and save back. */
function updateThread(
  remoteId: string,
  updater: (thread: RemoteThreadMetadata) => RemoteThreadMetadata,
): void {
  const threads = loadThreads()
  const idx = threads.findIndex((t) => t.remoteId === remoteId)
  if (idx >= 0) {
    threads[idx] = updater(threads[idx]!)
    saveThreads(threads)
  }
}

function loadRepo(remoteId: string): ExportedMessageRepository | null {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY_PREFIX + remoteId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Strip non-serializable File objects from attachments before persisting. */
function sanitizeForStorage(repo: ExportedMessageRepository): ExportedMessageRepository {
  return {
    ...repo,
    messages: repo.messages.map((item) => {
      const msg = item.message
      if (msg.role !== 'user' || !msg.attachments?.length) return item
      return {
        ...item,
        message: {
          ...msg,
          attachments: msg.attachments.map(({ file: _file, ...rest }) => rest),
        },
      } as unknown as typeof item
    }),
  }
}

function saveRepo(remoteId: string, repo: ExportedMessageRepository): void {
  try {
    localStorage.setItem(MESSAGES_KEY_PREFIX + remoteId, JSON.stringify(sanitizeForStorage(repo)))
  } catch (e) {
    // Quota exceeded — log but don't crash
    console.warn('[thread-storage] Failed to persist messages:', e)
  }
}

function removeMessages(remoteId: string): void {
  localStorage.removeItem(MESSAGES_KEY_PREFIX + remoteId)
}

function extractTitle(messages: readonly ThreadMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'New Chat'
  const text = first.content
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
  // Truncate to 50 chars
  return text.length > 50 ? text.slice(0, 50) + '…' : text || 'New Chat'
}

export function createLocalStorageThreadListAdapter(): RemoteThreadListAdapter {
  return {
    async list(): Promise<RemoteThreadListResponse> {
      return { threads: loadThreads() }
    },

    async initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
      const threads = loadThreads()
      const existing = threads.find((t) => t.remoteId === threadId)
      if (existing) {
        return { remoteId: existing.remoteId, externalId: existing.externalId }
      }

      const meta: RemoteThreadMetadata = {
        status: 'regular',
        remoteId: threadId,
        externalId: undefined,
        title: undefined,
      }
      threads.unshift(meta)
      saveThreads(threads)
      return { remoteId: threadId, externalId: undefined }
    },

    async rename(remoteId: string, newTitle: string): Promise<void> {
      updateThread(remoteId, (t) => ({ ...t, title: newTitle }))
    },

    async archive(remoteId: string): Promise<void> {
      updateThread(remoteId, (t) => ({ ...t, status: 'archived' }))
    },

    async unarchive(remoteId: string): Promise<void> {
      updateThread(remoteId, (t) => ({ ...t, status: 'regular' }))
    },

    async delete(remoteId: string): Promise<void> {
      const threads = loadThreads().filter((t) => t.remoteId !== remoteId)
      saveThreads(threads)
      removeMessages(remoteId)
    },

    async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
      const title = extractTitle(messages)
      updateThread(remoteId, (t) => ({ ...t, title }))

      // Note: messages are persisted incrementally via ThreadHistoryAdapter.append()

      // Return an AssistantStream that emits the title as text
      return createAssistantStream((controller) => {
        controller.appendText(title)
        controller.close()
      })
    },

    async fetch(threadId: string): Promise<RemoteThreadMetadata> {
      const threads = loadThreads()
      const found = threads.find((t) => t.remoteId === threadId)
      return (
        found ?? { status: 'regular', remoteId: threadId, title: undefined, externalId: undefined }
      )
    },

    // Inject ThreadHistoryAdapter into each thread's LocalRuntime
    unstable_Provider: ThreadHistoryProvider,
  }
}

// Provider that injects per-thread history adapter
function ThreadHistoryProvider({ children }: PropsWithChildren) {
  const remoteId = useAuiState((s) => s.threadListItem.remoteId)

  const history = useLocalStorageHistoryAdapter(remoteId)
  const adapters = useMemo(() => ({ history }), [history])

  return <RuntimeAdapterProvider adapters={adapters}>{children}</RuntimeAdapterProvider>
}

// localStorage-backed ThreadHistoryAdapter
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
