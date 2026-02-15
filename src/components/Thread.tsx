import { ThreadPrimitive, AuiIf } from '@assistant-ui/react'
import { ArrowDownIcon, SparklesIcon } from 'lucide-react'
import type { FC } from 'react'
import { UserMessage } from '@/components/UserMessage'
import { AssistantMessage } from '@/components/AssistantMessage'
import { Composer } from '@/components/Composer'
import { MAX_THREAD_WIDTH, QNTX_TOKEN_URL } from '@/lib/constants'
import { useHasDiscount } from '@/hooks/use-has-discount'

export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-14">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />

        <ThreadPrimitive.ViewportFooter
          className="sticky bottom-0 mx-auto mt-auto flex w-full flex-col gap-4 bg-gradient-to-t from-background from-85% to-transparent pb-4 pt-2 md:pb-6"
          style={{ maxWidth: MAX_THREAD_WIDTH }}
        >
          <ScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}

const ThreadWelcome: FC = () => {
  const { hasDiscount, loading } = useHasDiscount()

  return (
    <div className="mx-auto flex w-full grow flex-col" style={{ maxWidth: MAX_THREAD_WIDTH }}>
      {/* Title — vertically centered in remaining space */}
      <div className="flex grow flex-col justify-center">
        <h1 className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both font-display text-2xl font-normal duration-200">
          Pay-per-message
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both mt-2 text-base text-muted-foreground delay-75 duration-200">
          No subscriptions. No API keys. Just connect and go.
        </p>
      </div>
      {/* QNTX discount promo — hidden for token holders */}
      {!hasDiscount && !loading && (
        <a
          href={QNTX_TOKEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mb-3 flex items-center gap-2.5 rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-500/5 to-purple-500/10 px-4 py-3 text-sm transition-colors delay-100 duration-200 hover:border-purple-300/60 hover:from-purple-500/10 hover:to-purple-500/15 dark:border-purple-500/15 dark:from-purple-400/5 dark:to-purple-400/10 dark:hover:border-purple-400/30"
        >
          <SparklesIcon className="size-4 shrink-0 text-purple-500 dark:text-purple-400" />
          <span className="text-muted-foreground">
            Hold <span className="font-medium text-purple-600 dark:text-purple-400">QNTX</span>{' '}
            tokens to unlock up to{' '}
            <span className="font-medium text-purple-600 dark:text-purple-400">50% off</span> every
            message
          </span>
        </a>
      )}
      {/* Suggestions — anchored to bottom, right above the composer */}
      <div className="grid grid-cols-2 gap-2">
        <ThreadPrimitive.Suggestion
          prompt="How does x402 enable pay-per-message AI without API keys or subscriptions?"
          send
          asChild
        >
          <button className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex w-full flex-col items-start gap-1 rounded-2xl border border-border/60 px-4 py-3 text-left text-sm transition-colors duration-200 hover:bg-muted">
            <span className="font-medium">How does x402 work?</span>
            <span className="text-muted-foreground">Pay-per-message AI without API keys</span>
          </button>
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion
          prompt="What makes Monad's blockchain architecture ideal for high-throughput crypto payments?"
          send
          asChild
        >
          <button className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex w-full flex-col items-start gap-1 rounded-2xl border border-border/60 px-4 py-3 text-left text-sm transition-colors delay-75 duration-200 hover:bg-muted">
            <span className="font-medium">Why Monad?</span>
            <span className="text-muted-foreground">High-throughput blockchain for payments</span>
          </button>
        </ThreadPrimitive.Suggestion>
      </div>
    </div>
  )
}

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
