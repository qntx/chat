import { ComposerPrimitive, AuiIf } from '@assistant-ui/react'
import { SendIcon, SquareIcon } from 'lucide-react'
import type { FC } from 'react'
import { ModelPicker } from '@/components/ModelPicker'

const SUBMIT_BTN =
  'flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80'

export const Composer: FC = () => (
  <ComposerPrimitive.Root className="relative flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
    <ComposerPrimitive.Input
      placeholder="Send a message..."
      className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground"
      rows={1}
      autoFocus
    />
    <div className="relative mx-2 mb-2 flex items-center justify-between gap-2">
      <ModelPicker />
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <button className={SUBMIT_BTN} aria-label="Stop">
            <SquareIcon className="size-3.5" fill="currentColor" />
          </button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <button className={`${SUBMIT_BTN} disabled:opacity-20`} aria-label="Send">
            <SendIcon className="size-3.5" />
          </button>
        </ComposerPrimitive.Send>
      </AuiIf>
    </div>
  </ComposerPrimitive.Root>
)
