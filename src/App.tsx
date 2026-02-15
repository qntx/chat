import { useState } from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { WalletProvider } from '@/providers/WalletProvider'
import { ModelProvider } from '@/providers/ModelProvider'
import { ChatProvider } from '@/providers/ChatProvider'
import { Header } from '@/components/Header'
import { ChatThread } from '@/components/Thread'
import { ThreadList } from '@/components/ThreadList'
import { PanelLeftIcon } from 'lucide-react'
import { ICON_BTN } from '@/lib/styles'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <WalletProvider>
        <ModelProvider>
          <ChatProvider>
            <div className="relative flex h-dvh overflow-hidden">
              {/* Sidebar */}
              <aside
                className={`flex-shrink-0 border-r border-border/40 bg-background transition-[width] duration-200 ease-in-out ${
                  sidebarOpen ? 'w-64' : 'w-0'
                } overflow-hidden`}
              >
                <div className="flex h-full w-64 flex-col">
                  <div className="flex h-14 items-center px-2">
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className={ICON_BTN}
                      aria-label="Close sidebar"
                    >
                      <PanelLeftIcon className="size-4" />
                    </button>
                  </div>
                  <ThreadList />
                </div>
              </aside>

              {/* Main content */}
              <div className="relative flex flex-1 flex-col">
                <Header
                  sidebarOpen={sidebarOpen}
                  onToggleSidebar={() => setSidebarOpen((v) => !v)}
                />
                <ChatThread />
              </div>
            </div>
          </ChatProvider>
        </ModelProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}
