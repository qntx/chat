import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-sm font-bold text-[hsl(var(--primary-foreground))]">
          x4
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">x402 Chat</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Pay-per-message AI chat
          </p>
        </div>
      </div>
      <ConnectButton
        showBalance={true}
        chainStatus="icon"
        accountStatus="address"
      />
    </header>
  );
}
