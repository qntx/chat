import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
  AuiIf,
} from '@assistant-ui/react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import type { FC, ReactNode } from 'react'
import {
  ArrowDownIcon,
  SendIcon,
  SquareIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
} from 'lucide-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { WALLET_PROMPT_MARKER } from '@/providers/ChatProvider'

const THREAD_MAX_W = '42rem'

/** Bridge MarkdownTextPrimitive to the TextMessagePartComponent slot. */
const MarkdownText: FC<{ text: string; status: unknown }> = () => <MarkdownTextPrimitive smooth />

/** Text part that detects wallet-not-connected marker and renders a connect button. */
const WalletAwareText: FC<{ text: string; status: unknown }> = ({ text, status }) => {
  if (text.startsWith(WALLET_PROMPT_MARKER)) {
    const cleanText = text.slice(WALLET_PROMPT_MARKER.length)
    return (
      <div>
        <p className="whitespace-pre-line">{cleanText}</p>
        <ConnectWalletButton />
      </div>
    )
  }
  return <MarkdownText text={text} status={status} />
}

// Main thread
export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-14">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />

        <ThreadPrimitive.ViewportFooter
          className="sticky bottom-0 mx-auto mt-auto flex w-full flex-col gap-4 pb-4 md:pb-6"
          style={{ maxWidth: THREAD_MAX_W }}
        >
          <ScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}

// Welcome
const ThreadWelcome: FC = () => (
  <div className="mx-auto my-auto flex w-full grow flex-col" style={{ maxWidth: THREAD_MAX_W }}>
    <div className="flex w-full grow flex-col items-center justify-center">
      <div className="flex size-full flex-col justify-center px-4">
        <h1 className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both text-2xl font-semibold duration-200">
          Pay-per-message chat
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both mt-3 text-xl text-muted-foreground delay-75 duration-200">
          No subscriptions. No API keys. Just connect and go.
        </p>
      </div>
    </div>
    <ThreadSuggestions />
  </div>
)

// Suggestion cards — two-column grid matching the composer width
const ThreadSuggestions: FC = () => (
  <div className="grid w-full grid-cols-2 gap-2 pb-4">
    <ThreadPrimitive.Suggestion prompt="What is x402 and how does pay-per-message work?" send asChild>
      <button className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex w-full flex-col items-start gap-1 rounded-2xl border border-border/60 px-4 py-3 text-left text-sm transition-colors duration-200 hover:bg-muted">
        <span className="font-medium">What is x402?</span>
        <span className="text-muted-foreground">and how does pay-per-message work</span>
      </button>
    </ThreadPrimitive.Suggestion>
    <ThreadPrimitive.Suggestion prompt="Explain how crypto wallets connect to AI chat" send asChild>
      <button className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex w-full flex-col items-start gap-1 rounded-2xl border border-border/60 px-4 py-3 text-left text-sm transition-colors delay-75 duration-200 hover:bg-muted">
        <span className="font-medium">Explain crypto wallets</span>
        <span className="text-muted-foreground">and how they connect to AI chat</span>
      </button>
    </ThreadPrimitive.Suggestion>
  </div>
)

// Connect wallet button rendered inside assistant messages when wallet is not connected
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

// Scroll to bottom
const ScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <button
      className="absolute -top-12 z-10 self-center rounded-full border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:bg-accent disabled:invisible"
      aria-label="Scroll to bottom"
    >
      <ArrowDownIcon className="size-4" />
    </button>
  </ThreadPrimitive.ScrollToBottom>
)

// Composer
const Composer: FC = () => (
  <ComposerPrimitive.Root className="relative flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
    <ComposerPrimitive.Input
      placeholder="Send a message..."
      className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground"
      rows={1}
      autoFocus
    />
    <div className="relative mx-2 mb-2 flex items-center justify-end gap-2">
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <button
            className="flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
            aria-label="Stop"
          >
            <SquareIcon className="size-3.5" fill="currentColor" />
          </button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <button
            className="flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-20"
            aria-label="Send"
          >
            <SendIcon className="size-3.5" />
          </button>
        </ComposerPrimitive.Send>
      </AuiIf>
    </div>
  </ComposerPrimitive.Root>
)

// Messages
const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group mx-auto grid w-full auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2"
    style={{ maxWidth: THREAD_MAX_W }}
    data-role="user"
  >
    <div className="relative col-start-2 min-w-0">
      <div className="wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
        <MessagePrimitive.Content />
      </div>
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
        <UserActionBar />
      </div>
    </div>
    <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
  </MessagePrimitive.Root>
)

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group mx-auto grid w-full auto-rows-auto grid-cols-[auto_1fr_minmax(72px,auto)] gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2"
    style={{ maxWidth: THREAD_MAX_W }}
    data-role="assistant"
  >
    <div className="col-start-2 min-w-0 text-sm leading-7">
      <MessagePrimitive.Content components={{ Text: WalletAwareText }} />
    </div>
    <AssistantActionBar />
    <BranchPicker className="col-span-full col-start-1 row-start-3" />
  </MessagePrimitive.Root>
)

// Action bars
const UserActionBar: FC = () => (
  <ActionBarPrimitive.Root hideWhenRunning autohide="not-last" className="flex flex-col items-end">
    <ActionBarPrimitive.Edit asChild>
      <IconBtn tooltip="Edit">
        <PencilIcon />
      </IconBtn>
    </ActionBarPrimitive.Edit>
  </ActionBarPrimitive.Root>
)

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="col-start-2 row-start-2 -ml-1 flex gap-1 text-muted-foreground"
  >
    <ActionBarPrimitive.Copy asChild>
      <IconBtn tooltip="Copy">
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon />
        </AuiIf>
      </IconBtn>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <IconBtn tooltip="Retry">
        <RefreshCwIcon />
      </IconBtn>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
)

// Branch picker
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

// Shared icon button
const IconBtn: FC<{ tooltip: string; children: ReactNode }> = ({ tooltip, children }) => (
  <button
    className="flex size-7 items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-3.5"
    aria-label={tooltip}
  >
    {children}
  </button>
)
