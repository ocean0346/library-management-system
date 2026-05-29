'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCoins } from '@/hooks/useCoins'
import { supabase } from '@/lib/supabase-client'
import { Coins, Sparkles, X, Crown, Zap, Gem, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type CoinPackage = {
    id: string
    name: string
    coin_amount: number
    price_vnd: number
    bonus_coins: number
    sort_order: number
}

export function CoinBalance() {
    const { user } = useAuth()
    const { balance, isLoading } = useCoins()
    const [showModal, setShowModal] = useState(false)

    if (!user) return null

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowModal(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] group cursor-pointer"
                type="button"
            >
                <div className="relative">
                    <Coins className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                    <Sparkles className="h-2.5 w-2.5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                    {isLoading ? '...' : balance.toLocaleString()}
                </span>
            </button>

            {showModal && <CoinPurchaseModal onClose={() => setShowModal(false)} />}
        </>
    )
}

export function CoinPurchaseModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuth()
    const { balance, fetchBalance } = useCoins()
    const { toast } = useToast()
    const [packages, setPackages] = useState<CoinPackage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
    const [isPurchasing, setIsPurchasing] = useState(false)

    useEffect(() => {
        const fetchPackages = async () => {
            const { data } = await supabase
                .from('coin_packages')
                .select('*')
                .eq('is_active', true)
                .order('sort_order')
            setPackages(data || [])
            setIsLoading(false)
        }
        fetchPackages()
    }, [])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const handlePurchase = async (pkg: CoinPackage) => {
        if (!user) return
        setIsPurchasing(true)
        setSelectedPkg(pkg.id)

        try {

            const response = await fetch('/api/payment/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: pkg.id,
                    packageName: pkg.name,
                    coinAmount: pkg.coin_amount,
                    bonusCoins: pkg.bonus_coins,
                    priceVnd: pkg.price_vnd,
                    userId: user.id,
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Không thể tạo thanh toán')
            }

            window.location.href = data.paymentUrl
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Có lỗi xảy ra khi tạo thanh toán",
                variant: "destructive"
            })
            setIsPurchasing(false)
            setSelectedPkg(null)
        }
    }

    const pkgIcons = [Zap, Crown, Gem]
    const pkgColors = [
        { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30 hover:border-blue-500/60', icon: 'text-blue-500', badge: 'bg-blue-500' },
        { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30 hover:border-purple-500/60', icon: 'text-purple-500', badge: 'bg-purple-500' },
        { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30 hover:border-amber-500/60', icon: 'text-amber-500', badge: 'bg-amber-500' },
    ]

    return createPortal(
        <div 
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
        >
            {}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
                onClick={onClose} 
            />

            {}
            <div className="relative w-full max-w-lg bg-background border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {}
                <div className="relative p-6 pb-4 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-b">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
                        type="button"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                            <Coins className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Nạp Xu</h2>
                            <p className="text-sm text-muted-foreground">
                                Số dư hiện tại: <span className="font-bold text-yellow-600 dark:text-yellow-400">{balance.toLocaleString()} xu</span>
                            </p>
                        </div>
                    </div>
                </div>

                {}
                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : packages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Chưa có gói nạp nào</p>
                    ) : (
                        packages.map((pkg, index) => {
                            const colors = pkgColors[index % pkgColors.length]
                            const Icon = pkgIcons[index % pkgIcons.length]
                            const isSelected = selectedPkg === pkg.id

                            return (
                                <button
                                    key={pkg.id}
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={isPurchasing}
                                    type="button"
                                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group
                                        bg-gradient-to-r ${colors.bg} ${colors.border}
                                        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                                        disabled:opacity-60 disabled:pointer-events-none
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-lg ${colors.badge} flex items-center justify-center shadow-md`}>
                                                <Icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base">{pkg.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="flex items-center gap-1 text-sm font-semibold">
                                                        <Coins className="h-3.5 w-3.5 text-yellow-500" />
                                                        {pkg.coin_amount} xu
                                                    </span>
                                                    {pkg.bonus_coins > 0 && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-bold">
                                                            +{pkg.bonus_coins} bonus
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isSelected && isPurchasing ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <span className="text-lg font-black">
                                                    {(pkg.price_vnd / 1000).toFixed(0)}k
                                                </span>
                                            )}
                                            <p className="text-xs text-muted-foreground">VNĐ</p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>

                {}
                <div className="p-4 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                        🔒 Thanh toán an toàn qua <span className="font-semibold">VNPay</span> — Hỗ trợ ATM, Visa, MasterCard, QR Pay
                    </p>
                </div>
            </div>
        </div>,
        document.body
    )
}
