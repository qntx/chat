import { WalletProvider } from '@/providers/WalletProvider'
import { ChatProvider } from '@/providers/ChatProvider'
import { Header } from '@/components/Header'
import { ChatThread } from '@/components/ChatThread'

export default function App() {
  return (
    <WalletProvider>
      <ChatProvider>
        <div className="relative h-dvh">
          <Header />
          <ChatThread />
        </div>
      </ChatProvider>
    </WalletProvider>
  )
}
