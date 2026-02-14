import { useMemo, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/config'
import { useTheme } from '@/hooks/use-theme'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export function WalletProvider({ children }: { children: ReactNode }) {
  const { resolved } = useTheme()

  const rkTheme = useMemo(
    () =>
      resolved === 'dark'
        ? darkTheme({
            accentColor: '#ede7dc',
            accentColorForeground: '#0f0e0c',
            borderRadius: 'medium',
            fontStack: 'system',
          })
        : lightTheme({
            accentColor: '#1a1a1a',
            accentColorForeground: '#f5f0e8',
            borderRadius: 'medium',
            fontStack: 'system',
          }),
    [resolved],
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} initialChain={143} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
