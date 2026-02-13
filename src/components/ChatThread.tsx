import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { FC } from "react";
import { ArrowDown, Send, Square } from "lucide-react";

/**
 * Wrapper to bridge MarkdownTextPrimitive (reads text from context)
 * with the TextMessagePartComponent slot interface.
 */
const MarkdownText: FC<{ text: string; status: unknown }> = () => (
  <MarkdownTextPrimitive smooth />
);

/**
 * Main chat thread component composed from assistant-ui primitives.
 */
export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="flex flex-1 flex-col items-center overflow-y-auto scroll-smooth">
        <ThreadPrimitive.Empty>
          <EmptyState />
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        <div className="min-h-8 flex-shrink-0" />
      </ThreadPrimitive.Viewport>

      <div className="sticky bottom-0 mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 pb-4">
        <ThreadPrimitive.ScrollToBottom asChild>
          <button
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:bg-[hsl(var(--accent))]"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </ThreadPrimitive.ScrollToBottom>

        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
}

/** Empty state shown when no messages exist */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-2xl font-bold text-[hsl(var(--primary-foreground))]">
        x4
      </div>
      <div>
        <h2 className="text-lg font-semibold">Welcome to x402 Chat</h2>
        <p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
          Pay-per-message AI chat powered by x402 stablecoin micropayments.
          Connect your wallet and start chatting.
        </p>
      </div>
    </div>
  );
}

/** Message composer with input and send/cancel buttons */
function Composer() {
  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-sm focus-within:ring-2 focus-within:ring-[hsl(var(--ring))]">
      <ComposerPrimitive.Input
        autoFocus
        placeholder="Type a message…"
        rows={1}
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
      />
      <ComposerPrimitive.Cancel asChild>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] transition-colors hover:opacity-80"
          aria-label="Cancel"
        >
          <Square className="h-4 w-4" />
        </button>
      </ComposerPrimitive.Cancel>
      <ComposerPrimitive.Send asChild>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-80 disabled:opacity-30"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

/** User message bubble */
function UserMessage() {
  return (
    <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4 px-4">
      <div className="col-start-2 row-start-1 max-w-xl rounded-2xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm text-[hsl(var(--primary-foreground))]">
        <MessagePrimitive.Content />
      </div>
      <UserActionBar />
    </MessagePrimitive.Root>
  );
}

/** Assistant message bubble with markdown rendering */
function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[auto_minmax(72px,1fr)] gap-y-2 py-4 px-4">
      <div className="col-start-1 row-start-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-xs font-bold text-[hsl(var(--secondary-foreground))]">
        AI
      </div>
      <div className="col-start-2 row-start-1 max-w-xl rounded-2xl bg-[hsl(var(--secondary))] px-4 py-2.5 text-sm">
        <MessagePrimitive.Content
          components={{
            Text: MarkdownText,
          }}
        />
      </div>
      <AssistantActionBar />
    </MessagePrimitive.Root>
  );
}

/** Action bar for user messages (edit) */
function UserActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="col-start-1 row-start-1 flex items-end gap-1 self-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <ActionButton label="Edit" />
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
}

/** Action bar for assistant messages (copy, reload, branch) */
function AssistantActionBar() {
  return (
    <ActionBarPrimitive.Root
      autohide="not-last"
      className="col-start-2 row-start-2 -mt-1 flex items-center gap-1"
    >
      <ActionBarPrimitive.Copy asChild>
        <ActionButton label="Copy" />
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <ActionButton label="Retry" />
      </ActionBarPrimitive.Reload>
      <BranchPickerPrimitive.Root
        hideWhenSingleBranch
        className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]"
      >
        <BranchPickerPrimitive.Previous asChild>
          <ActionButton label="←" />
        </BranchPickerPrimitive.Previous>
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
        <BranchPickerPrimitive.Next asChild>
          <ActionButton label="→" />
        </BranchPickerPrimitive.Next>
      </BranchPickerPrimitive.Root>
    </ActionBarPrimitive.Root>
  );
}

/** Small utility button used in action bars */
function ActionButton({ label }: { label: string }) {
  return (
    <button className="rounded px-1.5 py-0.5 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]">
      {label}
    </button>
  );
}
