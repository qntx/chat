import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] px-4">
      <span className="text-sm font-medium text-[hsl(var(--foreground)/0.9)]">
        x402 Chat
      </span>
      <ConnectButton
        showBalance={false}
        chainStatus="icon"
        accountStatus="address"
      />
    </header>
  );
}
