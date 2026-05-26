'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCoins } from '@/hooks/useCoins'
import { useRouter } from 'next/navigation'
import { Coins, Lock, Unlock, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CoinPurchaseModal } from './CoinBalance'

type Props = {
    bookId: string
    chapterNumber: number
    coinPrice: number
    isLocked: boolean
    onUnlocked: () => void
}

export default function UnlockChapterButton({ bookId, chapterNumber, coinPrice, isLocked, onUnlocked }: Props) {
    const { user } = useAuth()
    const { balance, unlockChapter } = useCoins()
    const { toast } = useToast()
    const router = useRouter()
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [showCoinModal, setShowCoinModal] = useState(false)

    if (!isLocked) return null

    const handleUnlock = async () => {
        if (!user) {
            toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để mở khóa chương." })
            router.push(`/login?redirect=/books/${bookId}`)
            return
        }

        if (balance < coinPrice) {
            setShowCoinModal(true)
            return
        }

        setIsUnlocking(true)
        try {
            const result = await unlockChapter(bookId, chapterNumber, coinPrice)
            if (result?.success) {
                toast({
                    title: "🔓 Mở khóa thành công!",
                    description: result.message,
                })
                onUnlocked()
            } else {
                if (result?.message?.includes('Không đủ xu')) {
                    setShowCoinModal(true)
                } else {
                    toast({
                        title: "Lỗi",
                        description: result?.message || "Không thể mở khóa chương",
                        variant: "destructive"
                    })
                }
            }
        } catch {
            toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" })
        } finally {
            setIsUnlocking(false)
        }
    }

    return (
        <>
            <Button
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all hover:scale-105 active:scale-95"
                size="sm"
            >
                {isUnlocking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                    <Unlock className="h-4 w-4 mr-1" />
                )}
                <Coins className="h-3.5 w-3.5 mr-1 text-yellow-200" />
                {coinPrice} xu
            </Button>

            {showCoinModal && <CoinPurchaseModal onClose={() => setShowCoinModal(false)} />}
        </>
    )
}
