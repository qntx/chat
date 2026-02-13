import { ConnectButton } from "@rainbow-me/rainbowkit";
import { GithubIcon } from "lucide-react";

const GITHUB_URL = "https://github.com/qntx/chat";

export function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tracking-tight text-foreground/80">
          QNTX Chat
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/60 rounded-full border border-border/60 px-1.5 py-0.5">
          beta
        </span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
          aria-label="GitHub"
        >
          <GithubIcon className="size-4" />
        </a>
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
        />
      </div>
    </header>
  );
}
