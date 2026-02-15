import type { FC } from 'react'
import { BranchPickerPrimitive } from '@assistant-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { IconBtn } from '@/components/IconBtn'

/** Branch picker for navigating message variants. */
export const BranchPicker: FC<{ className?: string }> = ({ className }) => (
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
