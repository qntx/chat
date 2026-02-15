import { type FC } from 'react'
import { CheckIcon, PenToolIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react'
import { usePaymentPhase, type PaymentPhase } from '@/lib/payment-phase'

/** Step definition for the payment flow stepper. */
interface Step {
  key: PaymentPhase
  label: string
  description: string
  estimate?: string
  icon: FC<{ className?: string }>
}

const STEPS: Step[] = [
  {
    key: 'signing',
    label: 'Sign',
    description: 'Confirm in your wallet',
    icon: PenToolIcon,
  },
  {
    key: 'verifying',
    label: 'Verify',
    description: 'Settling payment',
    estimate: '~5s',
    icon: ShieldCheckIcon,
  },
  {
    key: 'streaming',
    label: 'Generate',
    description: 'Streaming response',
    icon: SparklesIcon,
  },
]

/** Map phase to a 0-based step index. */
function phaseToIndex(phase: PaymentPhase): number {
  if (phase === 'signing') return 0
  if (phase === 'verifying') return 1
  if (phase === 'streaming') return 2
  return -1
}

/**
 * Inline payment flow stepper shown inside the assistant message bubble
 * while the x402 payment + LLM pipeline is in progress.
 *
 * Displays three phases: Sign → Verify → Generate
 * - Active step: pulse animation + accent color
 * - Completed steps: checkmark icon
 * - Upcoming steps: muted/dimmed
 */
export const PaymentStepper: FC = () => {
  const phase = usePaymentPhase()
  const activeIdx = phaseToIndex(phase)

  // Don't render when idle (nothing to show)
  if (activeIdx < 0) return null

  return (
    <div className="payment-stepper animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeIdx
          const isActive = i === activeIdx
          const isPending = i > activeIdx

          return (
            <div key={step.key} className="flex items-center">
              {/* Connector line (before step, except first) */}
              {i > 0 && (
                <div
                  className={`h-px w-6 transition-colors duration-500 ${
                    isCompleted ? 'bg-foreground/30' : 'bg-border'
                  }`}
                />
              )}

              {/* Step node */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-7 items-center justify-center rounded-full border transition-all duration-500 ${
                    isCompleted
                      ? 'border-foreground/20 bg-foreground/10 text-foreground/70'
                      : isActive
                        ? 'payment-stepper-pulse border-foreground/30 bg-foreground/5 text-foreground'
                        : 'border-border bg-transparent text-muted-foreground/40'
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <step.icon
                      className={`size-3.5 ${isActive ? 'animate-in zoom-in duration-300' : ''}`}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                    isPending ? 'text-muted-foreground/40' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active step description */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="payment-stepper-dot size-1.5 rounded-full bg-foreground/40" />
        <span>
          {STEPS[activeIdx]!.description}
          {STEPS[activeIdx]!.estimate && (
            <span className="ml-1 text-muted-foreground/60">{STEPS[activeIdx]!.estimate}</span>
          )}
        </span>
      </div>
    </div>
  )
}
