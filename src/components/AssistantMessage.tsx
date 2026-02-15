import {
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
  useAuiState,
} from '@assistant-ui/react'
import {
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  LoaderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { forwardRef, useRef, useState, useCallback, type FC } from 'react'
import { MarkdownText } from '@/components/Markdown'
import { OnboardingGuide } from '@/components/OnboardingGuide'
import { IconBtn } from '@/components/IconBtn'
import { WALLET_PROMPT_MARKER, MAX_THREAD_WIDTH } from '@/lib/constants'
import { ACTION_BTN } from '@/lib/styles'

/** Detects the wallet-connect marker and renders the onboarding guide instead. */
const WalletAwareText: FC<{ text: string; status: unknown }> = ({ text, status }) => {
  if (text.startsWith(WALLET_PROMPT_MARKER)) return <OnboardingGuide />
  return <MarkdownText text={text} status={status} />
}

/** Copy button with visual feedback — icon changes to checkmark for 2s after click. */
const CopyButton: FC = () => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const handleCopy = useCallback(() => {
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <ActionBarPrimitive.Copy className={ACTION_BTN} onClick={handleCopy}>
      {copied ? <CheckIcon className="text-green-600 dark:text-green-400" /> : <CopyIcon />}
    </ActionBarPrimitive.Copy>
  )
}

/** Reload button with spinner feedback while the thread is running. */
const ReloadButton = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  (props, ref) => {
    const isRunning = useAuiState((s) => s.thread.isRunning)
    return (
      <button ref={ref} {...props} className={ACTION_BTN}>
        {isRunning ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
      </button>
    )
  },
)
ReloadButton.displayName = 'ReloadButton'

/** Renders an image content part in an assistant message. */
const AssistantImage: FC<{ image: string }> = ({ image }) => (
  <div className="my-2">
    <a href={image} target="_blank" rel="noopener noreferrer">
      <img
        src={image}
        alt="Generated image"
        className="max-h-[512px] max-w-full rounded-xl object-contain shadow-md transition-opacity hover:opacity-90"
      />
    </a>
  </div>
)

/** Branch picker for navigating message variants. */
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

export const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="animate-in fade-in slide-in-from-bottom-1 group relative mx-auto w-full px-2 py-3 duration-150"
    style={{ maxWidth: MAX_THREAD_WIDTH }}
    data-role="assistant"
  >
    <div className="min-w-0 text-sm leading-7">
      <MessagePrimitive.Content components={{ Text: WalletAwareText, Image: AssistantImage }} />
    </div>
    <div className="mt-1 ml-0.5 flex">
      <BranchPicker />
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="never"
        className="-ml-1 flex gap-1 text-muted-foreground"
      >
        <CopyButton />
        <ActionBarPrimitive.Reload asChild>
          <ReloadButton />
        </ActionBarPrimitive.Reload>
      </ActionBarPrimitive.Root>
    </div>
  </MessagePrimitive.Root>
)
