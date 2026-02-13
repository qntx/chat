import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
  AuiIf,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { FC } from "react";
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

/**
 * Bridge MarkdownTextPrimitive (reads from context) to the
 * TextMessagePartComponent slot interface.
 */
const MarkdownText: FC<{ text: string; status: unknown }> = () => (
  <MarkdownTextPrimitive smooth />
);

/** Full chat thread — minimalist layout following shadcn patterns. */
export function ChatThread() {
  return (
    <ThreadPrimitive.Root
      className="flex h-full flex-col bg-[hsl(var(--background))]"
      style={{ ["--thread-max-width" as string]: "42rem" }}
    >
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-4">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages
          components={{ UserMessage, AssistantMessage }}
        />

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 pb-4 md:pb-6">
          <ScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

/** Welcome screen — clean, centered, minimal. */
const ThreadWelcome: FC = () => (
  <div className="mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] grow flex-col">
    <div className="flex w-full grow flex-col items-center justify-center">
      <div className="flex size-full flex-col justify-center px-4">
        <h1 className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both font-semibold text-2xl duration-200">
          Hello there!
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both text-[hsl(var(--muted-foreground))] text-xl delay-75 duration-200">
          How can I help you today?
        </p>
      </div>
    </div>
  </div>
);

/** Scroll-to-bottom floating button. */
const ScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <button
      className="absolute -top-12 z-10 self-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:bg-[hsl(var(--accent))] disabled:invisible"
      aria-label="Scroll to bottom"
    >
      <ArrowDownIcon className="size-4" />
    </button>
  </ThreadPrimitive.ScrollToBottom>
);

/** Message composer — clean border, focus ring, no glow. */
const Composer: FC = () => (
  <ComposerPrimitive.Root className="relative flex w-full flex-col rounded-2xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-1 pt-2 outline-none transition-shadow focus-within:border-[hsl(var(--ring))] focus-within:ring-2 focus-within:ring-[hsl(var(--ring)/0.2)]">
    <ComposerPrimitive.Input
      placeholder="Send a message..."
      className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
      rows={1}
      autoFocus
    />
    <div className="relative mx-2 mb-2 flex items-center justify-end gap-2">
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <button
            className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] transition-opacity hover:opacity-80"
            aria-label="Stop"
          >
            <SquareIcon className="size-3.5" fill="currentColor" />
          </button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <button
            className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] transition-opacity hover:opacity-80 disabled:opacity-20"
            aria-label="Send"
          >
            <SendIcon className="size-3.5" />
          </button>
        </ComposerPrimitive.Send>
      </AuiIf>
    </div>
  </ComposerPrimitive.Root>
);

/** User message — right-aligned, muted background. */
const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="group mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-3 [&>*]:col-start-2"
    data-role="user"
  >
    <div className="relative col-start-2 min-w-0">
      <div className="wrap-break-word rounded-2xl bg-[hsl(var(--muted))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))]">
        <MessagePrimitive.Content />
      </div>
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
        <UserActionBar />
      </div>
    </div>
    <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
  </MessagePrimitive.Root>
);

/** Assistant message — left-aligned, plain text. */
const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="group mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[auto_1fr_minmax(72px,auto)] gap-y-2 px-2 py-3 [&>*]:col-start-2"
    data-role="assistant"
  >
    <div className="col-start-2 min-w-0 text-sm leading-7">
      <MessagePrimitive.Content components={{ Text: MarkdownText }} />
    </div>
    <AssistantActionBar />
    <BranchPicker className="col-span-full col-start-1 row-start-3" />
  </MessagePrimitive.Root>
);

/** User action bar — edit button on hover. */
const UserActionBar: FC = () => (
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
);

/** Assistant action bar — copy + reload on hover. */
const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="col-start-2 row-start-2 -ml-1 flex gap-1 text-[hsl(var(--muted-foreground))]"
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
);

/** Branch picker — shown only when multiple branches exist. */
const BranchPicker: FC<{ className?: string }> = ({ className }) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={`inline-flex items-center text-[hsl(var(--muted-foreground))] text-xs ${className ?? ""}`}
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

/** Minimal icon button. */
const IconBtn: FC<{ tooltip: string; children: React.ReactNode }> = ({
  tooltip,
  children,
}) => (
  <button
    className="flex size-7 items-center justify-center rounded-md p-1 transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] [&_svg]:size-3.5"
    aria-label={tooltip}
  >
    {children}
  </button>
);
