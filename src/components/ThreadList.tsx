import {
  ThreadListPrimitive,
  ThreadListItemPrimitive,
  ThreadListItemMorePrimitive,
  AuiIf,
} from '@assistant-ui/react'
import { PlusIcon, MoreHorizontalIcon, ArchiveIcon, TrashIcon } from 'lucide-react'
import type { FC } from 'react'

export const ThreadList: FC = () => (
  <ThreadListPrimitive.Root className="flex h-full flex-col gap-1 p-2">
    <ThreadListNew />
    <AuiIf condition={(s) => s.threads.isLoading}>
      <ThreadListSkeleton />
    </AuiIf>
    <AuiIf condition={(s) => !s.threads.isLoading}>
      <div className="flex-1 overflow-y-auto">
        <ThreadListPrimitive.Items components={{ ThreadListItem }} />
      </div>
    </AuiIf>
  </ThreadListPrimitive.Root>
)

const ThreadListNew: FC = () => (
  <ThreadListPrimitive.New className="flex h-9 items-center gap-2 rounded-lg border border-border/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active]:bg-muted data-[active]:text-foreground">
    <PlusIcon className="size-4" />
    New Chat
  </ThreadListPrimitive.New>
)

const ThreadListSkeleton: FC = () => (
  <div className="flex flex-col gap-1">
    {Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className="flex h-9 items-center px-3"
        role="status"
        aria-label="Loading threads"
      >
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
)

const ThreadListItem: FC = () => (
  <ThreadListItemPrimitive.Root className="group flex h-9 items-center gap-1 rounded-lg transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none data-[active]:bg-muted">
    <ThreadListItemPrimitive.Trigger className="flex h-full min-w-0 flex-1 items-center truncate px-3 text-start text-sm">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </ThreadListItemPrimitive.Trigger>
    <ThreadListItemMore />
  </ThreadListItemPrimitive.Root>
)

const ThreadListItemMore: FC = () => (
  <ThreadListItemMorePrimitive.Root>
    <ThreadListItemMorePrimitive.Trigger asChild>
      <button
        className="mr-2 flex size-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 group-data-[active]:opacity-100 data-[state=open]:bg-accent data-[state=open]:opacity-100"
        aria-label="More options"
      >
        <MoreHorizontalIcon className="size-3.5" />
      </button>
    </ThreadListItemMorePrimitive.Trigger>
    <ThreadListItemMorePrimitive.Content
      side="bottom"
      align="start"
      className="z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      <ThreadListItemPrimitive.Archive asChild>
        <ThreadListItemMorePrimitive.Item className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
          <ArchiveIcon className="size-3.5" />
          Archive
        </ThreadListItemMorePrimitive.Item>
      </ThreadListItemPrimitive.Archive>
      <ThreadListItemPrimitive.Delete asChild>
        <ThreadListItemMorePrimitive.Item className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10">
          <TrashIcon className="size-3.5" />
          Delete
        </ThreadListItemMorePrimitive.Item>
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemMorePrimitive.Content>
  </ThreadListItemMorePrimitive.Root>
)
