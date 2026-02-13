import { WalletProvider } from "@/providers/WalletProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { Header } from "@/components/Header";
import { ChatThread } from "@/components/ChatThread";

export default function App() {
  return (
    <WalletProvider>
      <ChatProvider>
        <div className="flex h-dvh flex-col">
          <Header />
          <main className="flex-1 overflow-hidden">
            <ChatThread />
          </main>
        </div>
      </ChatProvider>
    </WalletProvider>
  );
}
