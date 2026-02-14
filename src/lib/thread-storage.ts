import type {
  ThreadMessage,
  unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
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

function saveMessages(remoteId: string, messages: readonly ThreadMessage[]): void {
  localStorage.setItem(MESSAGES_KEY_PREFIX + remoteId, JSON.stringify(messages))
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
      const threads = loadThreads()
      const idx = threads.findIndex((t) => t.remoteId === remoteId)
      if (idx >= 0) {
        threads[idx] = { ...threads[idx]!, title: newTitle }
        saveThreads(threads)
      }
    },

    async archive(remoteId: string): Promise<void> {
      const threads = loadThreads()
      const idx = threads.findIndex((t) => t.remoteId === remoteId)
      if (idx >= 0) {
        threads[idx] = { ...threads[idx]!, status: 'archived' }
        saveThreads(threads)
      }
    },

    async unarchive(remoteId: string): Promise<void> {
      const threads = loadThreads()
      const idx = threads.findIndex((t) => t.remoteId === remoteId)
      if (idx >= 0) {
        threads[idx] = { ...threads[idx]!, status: 'regular' }
        saveThreads(threads)
      }
    },

    async delete(remoteId: string): Promise<void> {
      const threads = loadThreads().filter((t) => t.remoteId !== remoteId)
      saveThreads(threads)
      removeMessages(remoteId)
    },

    async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
      const title = extractTitle(messages)

      // Persist the generated title
      const threads = loadThreads()
      const idx = threads.findIndex((t) => t.remoteId === remoteId)
      if (idx >= 0) {
        threads[idx] = { ...threads[idx]!, title }
        saveThreads(threads)
      }

      // Also persist messages for this thread
      saveMessages(remoteId, messages)

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
  }
}
