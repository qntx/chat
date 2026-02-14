import { ThreadPrimitive, AuiIf } from '@assistant-ui/react'
import { ArrowDownIcon } from 'lucide-react'
import type { FC } from 'react'
import { UserMessage, AssistantMessage } from '@/components/Messages'
import { Composer } from '@/components/Composer'
import { MAX_THREAD_WIDTH } from '@/lib/config'

export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-14">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />

        <ThreadPrimitive.ViewportFooter
          className="sticky bottom-0 mx-auto mt-auto flex w-full flex-col gap-4 bg-gradient-to-t from-background from-85% to-transparent pb-4 pt-8 md:pb-6"
          style={{ maxWidth: MAX_THREAD_WIDTH }}
        >
          <ScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}

const ThreadWelcome: FC = () => (
  <div className="mx-auto my-auto flex w-full grow flex-col" style={{ maxWidth: MAX_THREAD_WIDTH }}>
    <div className="flex w-full grow flex-col items-center justify-center">
      <div className="flex size-full flex-col justify-center px-4">
        <h1 className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both text-2xl font-semibold duration-200">
          Pay-per-message
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both mt-3 text-xl text-muted-foreground delay-75 duration-200">
          No subscriptions. No API keys. Just connect and go.
        </p>
      </div>
    </div>
    <div className="grid w-full grid-cols-2 gap-2 pb-4">
      <ThreadPrimitive.Suggestion
        prompt="What is x402 and how does pay-per-message work?"
        send
        asChild
      >
        <button className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex w-full flex-col items-start gap-1 rounded-2xl border border-border/60 px-4 py-3 text-left text-sm transition-colors duration-200 hover:bg-muted">
          <span className="font-medium">What is x402?</span>
          <span className="text-muted-foreground">and how does pay-per-message work</span>
        </button>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        prompt="Explain how crypto wallets connect to AI chat"
        send
        asChild
      >
        <button className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex w-full flex-col items-start gap-1 rounded-2xl border border-border/60 px-4 py-3 text-left text-sm transition-colors delay-75 duration-200 hover:bg-muted">
          <span className="font-medium">Explain crypto wallets</span>
          <span className="text-muted-foreground">and how they connect to AI chat</span>
        </button>
      </ThreadPrimitive.Suggestion>
    </div>
  </div>
)

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
