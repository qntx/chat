import {
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
  AuiIf,
} from '@assistant-ui/react'
import {
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
} from 'lucide-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import type { FC, ReactNode } from 'react'
import { MarkdownText } from '@/components/Markdown'
import { WALLET_PROMPT_MARKER } from '@/lib/config'

const MAX_W = '42rem'

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

export const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group mx-auto grid w-full auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2"
    style={{ maxWidth: MAX_W }}
    data-role="user"
  >
    <div className="relative col-start-2 min-w-0">
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
    <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
  </MessagePrimitive.Root>
)

export const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group relative mx-auto w-full px-2 py-3 duration-150"
    style={{ maxWidth: MAX_W }}
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

const IconBtn: FC<{ tooltip: string; children: ReactNode }> = ({ tooltip, children }) => (
  <button
    className="flex size-7 items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-3.5"
    aria-label={tooltip}
  >
    {children}
  </button>
)
