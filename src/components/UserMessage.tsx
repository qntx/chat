import {
  MessagePrimitive,
  ActionBarPrimitive,
  AttachmentPrimitive,
  ComposerPrimitive,
  AuiIf,
  useAuiState,
} from '@assistant-ui/react'
import { PencilIcon, SendIcon, XIcon } from 'lucide-react'
import { useMemo, type FC } from 'react'
import { BranchPicker } from '@/components/BranchPicker'
import { IconBtn } from '@/components/IconBtn'
import { MAX_THREAD_WIDTH } from '@/lib/constants'

/** Renders an image attachment in a sent user message. */
const UserAttachmentImage: FC = () => {
  const file = useAuiState((s) => s.attachment?.file)
  const content = useAuiState((s) => s.attachment?.content)
  const src = useMemo(() => {
    if (file instanceof File) return URL.createObjectURL(file)
    const imgPart = content?.find((p: { type: string }) => p.type === 'image') as
      | { type: 'image'; image: string }
      | undefined
    return imgPart?.image
  }, [file, content])

  if (!src) return null
  return (
    <AttachmentPrimitive.Root className="overflow-hidden rounded-lg">
      <img
        src={src}
        alt=""
        className="max-h-64 max-w-full rounded-lg object-contain"
        onLoad={() => {
          if (file) URL.revokeObjectURL(src)
        }}
      />
    </AttachmentPrimitive.Root>
  )
}

/** Inline edit composer shown when the user clicks the pencil icon. */
const UserMessageEdit: FC = () => (
  <div className="col-start-2 flex flex-col gap-2">
    <ComposerPrimitive.Input className="max-h-40 w-full resize-none rounded-2xl border border-input bg-muted px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
    <div className="flex justify-end gap-2">
      <ComposerPrimitive.Cancel asChild>
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent">
          <XIcon className="size-3" />
          Cancel
        </button>
      </ComposerPrimitive.Cancel>
      <ComposerPrimitive.Send asChild>
        <button className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs text-background transition-opacity hover:opacity-80 disabled:opacity-30">
          <SendIcon className="size-3" />
          Send
        </button>
      </ComposerPrimitive.Send>
    </div>
  </div>
)

/** Normal read-only user message bubble with edit action. */
const UserMessageDisplay: FC = () => (
  <div className="relative col-start-2 min-w-0">
    <div className="mb-2 flex flex-wrap justify-end gap-2 empty:hidden">
      <MessagePrimitive.Attachments components={{ Image: UserAttachmentImage }} />
    </div>
    <div className="wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
      <MessagePrimitive.Content />
    </div>
    <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        className="flex flex-col items-end"
      >
        <ActionBarPrimitive.Edit asChild>
          <IconBtn tooltip="Edit">
            <PencilIcon />
          </IconBtn>
        </ActionBarPrimitive.Edit>
      </ActionBarPrimitive.Root>
    </div>
  </div>
)

export const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group mx-auto grid w-full auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2"
    style={{ maxWidth: MAX_THREAD_WIDTH }}
    data-role="user"
  >
    <AuiIf condition={(s) => s.composer.isEditing}>
      <UserMessageEdit />
    </AuiIf>
    <AuiIf condition={(s) => !s.composer.isEditing}>
      <UserMessageDisplay />
    </AuiIf>
    <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
  </MessagePrimitive.Root>
)
