'use client'

import { CoinProvider } from '@/hooks/useCoins'

export default function CoinProviderWrapper({ children }: { children: React.ReactNode }) {
    return <CoinProvider>{children}</CoinProvider>
}
