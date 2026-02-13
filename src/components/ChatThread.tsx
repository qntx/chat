import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
  AuiIf,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { FC, ReactNode } from "react";
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
} from "lucide-react";

const THREAD_MAX_W = "42rem";

/** Bridge MarkdownTextPrimitive to the TextMessagePartComponent slot. */
const MarkdownText: FC<{ text: string; status: unknown }> = () => (
  <MarkdownTextPrimitive smooth />
);

// Main thread

export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-4">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages
          components={{ UserMessage, AssistantMessage }}
        />

        <ThreadPrimitive.ViewportFooter
          className="sticky bottom-0 mx-auto mt-auto flex w-full flex-col gap-4 pb-4 md:pb-6"
          style={{ maxWidth: THREAD_MAX_W }}
        >
          <ScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

// Welcome / Landing

const ThreadWelcome: FC = () => (
  <div className="mx-auto my-auto flex w-full grow flex-col items-center justify-center px-4" style={{ maxWidth: THREAD_MAX_W }}>
    <div className="flex w-full flex-col gap-8 py-12">
      {/* Hero */}
      <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
          Pay-per-message AI
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Chat with AI,<br />
          <span className="text-muted-foreground">pay only for what you use.</span>
        </h1>
      </div>

      {/* Features */}
      <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-100 duration-300">
        <div className="grid gap-3 sm:grid-cols-3">
          <FeatureCard
            title="x402 Protocol"
            description="HTTP 402 micropayments. No subscriptions, no API keys — just connect and chat."
          />
          <FeatureCard
            title="Multi-Chain"
            description="Pay with USDC on Monad, Base, and more. Your wallet, your choice."
          />
          <FeatureCard
            title="Open Source"
            description="Fully transparent. Verify every payment on-chain."
          />
        </div>
      </div>

      {/* How it works */}
      <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-200 duration-300">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
          How it works
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <Step n={1}>Connect your wallet using the button above</Step>
          <Step n={2}>Type a message — the gateway returns a payment challenge</Step>
          <Step n={3}>Sign a USDC micropayment, and your message is sent</Step>
        </ol>
      </div>

      {/* CTA */}
      <p className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-sm text-muted-foreground/60 delay-300 duration-300">
        Connect your wallet and send a message to get started.
      </p>
    </div>
  </div>
);

const FeatureCard: FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-xl border border-border/60 bg-accent/30 px-4 py-3">
    <p className="mb-1 text-sm font-medium text-foreground/90">{title}</p>
    <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
  </div>
);

const Step: FC<{ n: number; children: ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border/60 text-[10px] font-medium text-muted-foreground">
      {n}
    </span>
    <span>{children}</span>
  </li>
);

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
);

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
);

// Messages

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="group mx-auto grid w-full auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-3 [&>*]:col-start-2"
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
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="group mx-auto grid w-full auto-rows-auto grid-cols-[auto_1fr_minmax(72px,auto)] gap-y-2 px-2 py-3 [&>*]:col-start-2"
    style={{ maxWidth: THREAD_MAX_W }}
    data-role="assistant"
  >
    <div className="col-start-2 min-w-0 text-sm leading-7">
      <MessagePrimitive.Content components={{ Text: MarkdownText }} />
    </div>
    <AssistantActionBar />
    <BranchPicker className="col-span-full col-start-1 row-start-3" />
  </MessagePrimitive.Root>
);

// Action bars

const UserActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="flex flex-col items-end"
  >
    <ActionBarPrimitive.Edit asChild>
      <IconBtn tooltip="Edit"><PencilIcon /></IconBtn>
    </ActionBarPrimitive.Edit>
  </ActionBarPrimitive.Root>
);

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="col-start-2 row-start-2 -ml-1 flex gap-1 text-muted-foreground"
  >
    <ActionBarPrimitive.Copy asChild>
      <IconBtn tooltip="Copy">
        <AuiIf condition={(s) => s.message.isCopied}><CheckIcon /></AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}><CopyIcon /></AuiIf>
      </IconBtn>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <IconBtn tooltip="Retry"><RefreshCwIcon /></IconBtn>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
);

// Branch picker

const BranchPicker: FC<{ className?: string }> = ({ className }) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={`inline-flex items-center text-xs text-muted-foreground ${className ?? ""}`}
  >
    <BranchPickerPrimitive.Previous asChild>
      <IconBtn tooltip="Previous"><ChevronLeftIcon /></IconBtn>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <IconBtn tooltip="Next"><ChevronRightIcon /></IconBtn>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);

// Shared icon button

const IconBtn: FC<{ tooltip: string; children: ReactNode }> = ({
  tooltip,
  children,
}) => (
  <button
    className="flex size-7 items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-3.5"
    aria-label={tooltip}
  >
    {children}
  </button>
);
