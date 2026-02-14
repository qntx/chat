import {
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
  AttachmentPrimitive,
  ComposerPrimitive,
  AuiIf,
  useAuiState,
} from '@assistant-ui/react'
import {
  CopyIcon,
  RefreshCwIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  SendIcon,
  XIcon,
} from 'lucide-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { forwardRef, useMemo, type FC, type ReactNode } from 'react'
import { MarkdownText } from '@/components/Markdown'
import { WALLET_PROMPT_MARKER, MAX_THREAD_WIDTH } from '@/lib/config'

const ACTION_BTN =
  'flex size-7 items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-3.5'

const WalletAwareText: FC<{ text: string; status: unknown }> = ({ text, status }) => {
  if (text.startsWith(WALLET_PROMPT_MARKER)) {
    return (
      <div>
        <p className="whitespace-pre-line">{text.slice(WALLET_PROMPT_MARKER.length)}</p>
        <ConnectWalletButton />
      </div>
    )
  }
  return <MarkdownText text={text} status={status} />
}

const ConnectWalletButton: FC = () => {
  const { openConnectModal } = useConnectModal()
  return (
    <button
      onClick={openConnectModal}
      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-accent/50 px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent"
    >
      <WalletIcon className="size-4" />
      Connect Wallet
    </button>
  )
}

/** Renders an image attachment in a sent user message. */
const UserAttachmentImage: FC = () => {
  const file = useAuiState((s) => s.attachment?.file)
  const content = useAuiState((s) => s.attachment?.content)
  const src = useMemo(() => {
    if (file) return URL.createObjectURL(file)
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
    {/* Image attachments */}
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

export const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group relative mx-auto w-full px-2 py-3 duration-150"
    style={{ maxWidth: MAX_THREAD_WIDTH }}
    data-role="assistant"
  >
    <div className="min-w-0 text-sm leading-7">
      <MessagePrimitive.Content components={{ Text: WalletAwareText }} />
    </div>
    <div className="mt-1 ml-0.5 flex">
      <BranchPicker />
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        className="-ml-1 flex gap-1 text-muted-foreground"
      >
        <ActionBarPrimitive.Copy className={ACTION_BTN}>
          <CopyIcon />
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.Reload className={ACTION_BTN}>
          <RefreshCwIcon />
        </ActionBarPrimitive.Reload>
      </ActionBarPrimitive.Root>
    </div>
  </MessagePrimitive.Root>
)

const BranchPicker: FC<{ className?: string }> = ({ className }) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={`inline-flex items-center text-xs text-muted-foreground ${className ?? ''}`}
  >
    <BranchPickerPrimitive.Previous asChild>
      <IconBtn tooltip="Previous">
        <ChevronLeftIcon />
      </IconBtn>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <IconBtn tooltip="Next">
        <ChevronRightIcon />
      </IconBtn>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
)

const IconBtn = forwardRef<
  HTMLButtonElement,
  { tooltip: string; children: ReactNode } & React.ComponentPropsWithoutRef<'button'>
>(({ tooltip, children, className, ...props }, ref) => (
  <button ref={ref} {...props} className={`${ACTION_BTN} ${className ?? ''}`} aria-label={tooltip}>
    {children}
  </button>
))
IconBtn.displayName = 'IconBtn'
