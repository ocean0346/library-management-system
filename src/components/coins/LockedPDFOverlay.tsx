'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCoins } from '@/hooks/useCoins'
import { useRouter } from 'next/navigation'
import { Coins, Lock, BookOpen, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CoinPurchaseModal } from './CoinBalance'

type Props = {
    bookId: string
    bookTitle: string
    coinPrice: number
    onUnlocked: () => void
}

export default function LockedPDFOverlay({ bookId, bookTitle, coinPrice, onUnlocked }: Props) {
    const { user } = useAuth()
    const { balance, unlockPDF } = useCoins()
    const { toast } = useToast()
    const router = useRouter()
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [showCoinModal, setShowCoinModal] = useState(false)

    const handleUnlock = async () => {
        if (!user) {
            toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để mở khóa sách." })
            router.push(`/login?redirect=/books/${bookId}`)
            return
        }

        if (balance < coinPrice) {
            setShowCoinModal(true)
            return
        }

        setIsUnlocking(true)
        try {
            const result = await unlockPDF(bookId, coinPrice)
            if (result?.success) {
                toast({
                    title: "🔓 Mở khóa thành công!",
                    description: `Bạn đã mở khóa "${bookTitle}". Chúc bạn đọc sách vui vẻ!`,
                })
                onUnlocked()
            } else {
                if (result?.message?.includes('Không đủ xu')) {
                    setShowCoinModal(true)
                } else {
                    toast({
                        title: "Lỗi",
                        description: result?.message || "Không thể mở khóa sách",
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
            <div className="absolute inset-0 z-40 flex items-center justify-center">
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />

                {/* Lock card */}
                <div className="relative z-10 text-center max-w-md mx-auto p-8">
                    <div className="relative inline-flex mb-6">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30 flex items-center justify-center">
                            <Lock className="h-10 w-10 text-yellow-500" />
                        </div>
                        <Sparkles className="h-5 w-5 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                    </div>

                    <h3 className="text-2xl font-bold mb-2">Nội dung Premium</h3>
                    <p className="text-muted-foreground mb-2">
                        Bạn đã xem hết 10 trang miễn phí.
                    </p>
                    <p className="text-muted-foreground mb-6">
                        Mở khóa toàn bộ sách <span className="font-semibold text-foreground">"{bookTitle}"</span> để tiếp tục đọc.
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{coinPrice} xu</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleUnlock}
                            disabled={isUnlocking}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold text-base py-6 rounded-xl shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all hover:scale-[1.02] active:scale-95"
                            size="lg"
                        >
                            {isUnlocking ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <BookOpen className="h-5 w-5 mr-2" />
                            )}
                            Mở Khóa & Đọc Ngay
                        </Button>

                        {balance < coinPrice && (
                            <p className="text-sm text-muted-foreground">
                                Số dư: <span className="font-bold text-yellow-600 dark:text-yellow-400">{balance} xu</span>
                                {' '} — Bạn cần thêm <span className="font-bold text-red-500">{coinPrice - balance} xu</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {showCoinModal && <CoinPurchaseModal onClose={() => setShowCoinModal(false)} />}
        </>
    )
}
