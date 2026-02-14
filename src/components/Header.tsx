import type { ReactNode } from 'react'
import { useAui } from '@assistant-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { WalletIcon, ChevronDownIcon, PanelLeftIcon } from 'lucide-react'

/** GitHub mark SVG — lucide deprecated all brand icons */
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
  </svg>
)

const GITHUB_URL = 'https://github.com/qntx/chat'

export function Header({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  const aui = useAui()

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between px-6 [&>*]:pointer-events-auto">
      {/* Brand */}
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Open sidebar"
          >
            <PanelLeftIcon className="size-4" />
          </button>
        )}
        <button
          onClick={() => aui.threads().switchToNewThread()}
          className="flex items-center gap-0 transition-opacity hover:opacity-70"
          aria-label="New chat"
        >
          <span
            className="text-base font-semibold tracking-tight text-foreground"
            style={{ fontFamily: '"QNTX", sans-serif' }}
          >
            qnTX
          </span>
          <span className="hidden text-xs text-muted-foreground/50 sm:inline">&nbsp;/&nbsp;</span>
          <span className="hidden text-xs text-muted-foreground/50 sm:inline">chat</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <HeaderIconLink href={GITHUB_URL} label="GitHub">
          <GitHubIcon className="size-5" />
        </HeaderIconLink>
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted
            if (!ready) return null

            if (!account) {
              return (
                <button
                  onClick={openConnectModal}
                  className="flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-accent/50 px-4 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent"
                >
                  <WalletIcon className="size-4" />
                  <span className="hidden sm:inline">Connect</span>
                </button>
              )
            }

            if (chain?.unsupported) {
              return (
                <button
                  onClick={openChainModal}
                  className="flex h-9 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Wrong network
                </button>
              )
            }

            return (
              <div className="flex items-center gap-1">
                {/* Chain icon */}
                {chain && (
                  <button
                    onClick={openChainModal}
                    className="flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-accent"
                    aria-label={chain.name ?? 'Switch network'}
                  >
                    {chain.hasIcon && chain.iconUrl ? (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? 'Chain'}
                        className="size-5 rounded-full"
                        style={{ background: chain.iconBackground }}
                      />
                    ) : (
                      <span className="size-5 rounded-full bg-muted" />
                    )}
                  </button>
                )}

                {/* Account */}
                <button
                  onClick={openAccountModal}
                  className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="font-mono">{account.displayName}</span>
                  <ChevronDownIcon className="size-3.5 opacity-50" />
                </button>
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}

function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
      aria-label={label}
    >
      {children}
    </a>
  )
}
