import type { FC } from 'react'
import { WalletIcon, SparklesIcon } from 'lucide-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { QNTX_TOKEN_URL } from '@/lib/constants'
import { WALLET_BTN } from '@/lib/styles'

/** Step indicator circle */
const StepNumber: FC<{ n: number }> = ({ n }) => (
  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground">
    {n}
  </span>
)

/** Onboarding guide shown when no wallet is connected */
export const OnboardingGuide: FC = () => {
  const { openConnectModal } = useConnectModal()
  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-foreground">Welcome to QNTX Chat</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Pay-per-message AI powered by the{' '}
        <a
          href="https://www.x402.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground"
        >
          x402 protocol
        </a>
        . No subscriptions, no API keys — just connect a wallet and start chatting.
      </p>

      <div className="space-y-3 rounded-xl border border-border/60 bg-accent/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Getting Started
        </p>
        <div className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="text-sm leading-relaxed">
            <span className="font-medium text-foreground">Bridge USDC to Monad</span>
            <span className="text-muted-foreground">
              {' '}
              — Transfer a small amount of USDC to the Monad network. No native token (MON) needed.
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="space-y-2 text-sm leading-relaxed">
            <div>
              <span className="font-medium text-foreground">Connect your wallet</span>
              <span className="text-muted-foreground">
                {' '}
                — Click the button or use the top-right corner.
              </span>
            </div>
            <button onClick={openConnectModal} className={`py-2 ${WALLET_BTN}`}>
              <WalletIcon className="size-4" />
              Connect Wallet
            </button>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <StepNumber n={3} />
          <div className="text-sm leading-relaxed">
            <span className="font-medium text-foreground">Start chatting</span>
            <span className="text-muted-foreground">
              {' '}
              — Each message triggers a tiny USDC micropayment. You sign once per message, no gas
              fees — the facilitator covers all transaction costs.
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs">
            <SparklesIcon className="size-3 text-purple-500 dark:text-purple-400" />
          </span>
          <div className="text-sm leading-relaxed">
            <span className="font-medium text-purple-600 dark:text-purple-400">Save with QNTX</span>
            <span className="text-muted-foreground">
              {' '}
              — Hold{' '}
              <a
                href={QNTX_TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-purple-600 underline decoration-purple-400/40 underline-offset-2 transition-colors hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
              >
                QNTX tokens
              </a>{' '}
              to unlock up to 50% off every message.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
