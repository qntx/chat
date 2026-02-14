import { WalletProvider } from '@/providers/WalletProvider'
import { ModelProvider } from '@/providers/ModelProvider'
import { ChatProvider } from '@/providers/ChatProvider'
import { Header } from '@/components/Header'
import { ChatThread } from '@/components/Thread'

export default function App() {
  return (
    <WalletProvider>
      <ModelProvider>
        <ChatProvider>
          <div className="relative h-dvh">
            <Header />
            <ChatThread />
          </div>
        </ChatProvider>
      </ModelProvider>
    </WalletProvider>
  )
}
