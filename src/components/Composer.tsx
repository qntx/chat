import { ComposerPrimitive, AttachmentPrimitive, AuiIf, useAuiState } from '@assistant-ui/react'
import { SendIcon, SquareIcon, ImagePlusIcon, ImageIcon, XIcon } from 'lucide-react'
import { useMemo, type FC } from 'react'
import { ModelPicker } from '@/components/ModelPicker'
import { useModel } from '@/providers/ModelProvider'

const SUBMIT_BTN =
  'flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80'

/** Renders a single image attachment thumbnail with a remove button. */
const ComposerAttachmentImage: FC = () => {
  const file = useAuiState((s) => s.attachment?.file)
  const src = useMemo(() => (file instanceof File ? URL.createObjectURL(file) : undefined), [file])

  return (
    <AttachmentPrimitive.Root className="group relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/60">
      {src && (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onLoad={() => URL.revokeObjectURL(src)}
        />
      )}
      <AttachmentPrimitive.Remove asChild>
        <button
          className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
          aria-label="Remove image"
        >
          <XIcon className="size-3" />
        </button>
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  )
}

export const Composer: FC = () => {
  const { imageMode, toggleImageMode, currentModel } = useModel()
  const showImageToggle = currentModel?.canGenerateImages && currentModel.type !== 'image'

  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      {/* Attachment previews */}
      <div className="flex flex-wrap gap-2 px-3 pt-1 empty:hidden">
        <ComposerPrimitive.Attachments components={{ Image: ComposerAttachmentImage }} />
      </div>
      <ComposerPrimitive.Input
        placeholder={imageMode ? 'Describe the image to generate...' : 'Send a message...'}
        className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground"
        rows={1}
        autoFocus
      />
      <div className="relative mx-2 mb-2 flex items-center justify-between gap-2">
        {/* Left: attach image + image mode toggle */}
        <div className="flex items-center gap-1">
          <ComposerPrimitive.AddAttachment asChild>
            <button
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Attach image"
            >
              <ImagePlusIcon className="size-4" />
            </button>
          </ComposerPrimitive.AddAttachment>
          {showImageToggle && (
            <button
              type="button"
              onClick={toggleImageMode}
              className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
                imageMode
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              aria-label={imageMode ? 'Switch to chat mode' : 'Switch to image generation'}
              title={imageMode ? 'Image mode ON — click to chat' : 'Generate image'}
            >
              <ImageIcon className="size-4" />
            </button>
          )}
        </div>
        {/* Right: price + model picker + send/stop */}
        <div className="flex items-center gap-2">
          <CurrentPrice />
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
      </div>
    </ComposerPrimitive.Root>
  )
}

/** Compact price tag showing the current model's cost per message */
const CurrentPrice: FC = () => {
  const { currentModel, pricing } = useModel()

  const price = currentModel?.discountedPrice ?? currentModel?.price ?? pricing.defaultPrice
  if (!price) return null

  return (
    <span
      className="text-[10px] tabular-nums text-muted-foreground/60"
      title={`~$${price} USDC per message`}
    >
      ~${price}
    </span>
  )
}
