'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useCoins } from '@/hooks/useCoins'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Coins, ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, BookOpen, Sparkles, Gift, Undo2 } from 'lucide-react'
import { format } from 'date-fns'
import { CoinPurchaseModal } from '@/components/coins/CoinBalance'

type Transaction = {
    id: string
    amount: number
    type: string
    description: string
    book_id: string | null
    chapter_number: number | null
    created_at: string
}

export default function CoinHistoryPage() {
    const { user, loading: authLoading } = useAuth()
    const { balance } = useCoins()
    const router = useRouter()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login?redirect=/account/coins')
            return
        }

        const fetchTransactions = async () => {
            setIsLoading(true)
            const { data } = await supabase
                .from('coin_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)
            
            setTransactions(data || [])
            setIsLoading(false)
        }

        fetchTransactions()
    }, [user, authLoading, router])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return <ArrowDownLeft className="h-4 w-4" />
            case 'PURCHASE_CHAPTER': return <BookOpen className="h-4 w-4" />
            case 'PURCHASE_PDF': return <BookOpen className="h-4 w-4" />
            case 'BONUS': return <Gift className="h-4 w-4" />
            case 'REFUND': return <Undo2 className="h-4 w-4" />
            case 'ADMIN_GRANT': return <Sparkles className="h-4 w-4" />
            default: return <Coins className="h-4 w-4" />
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Nạp xu</Badge>
            case 'PURCHASE_CHAPTER': return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">Mở khóa chương</Badge>
            case 'PURCHASE_PDF': return <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">Mở khóa PDF</Badge>
            case 'BONUS': return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">Thưởng</Badge>
            case 'REFUND': return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">Hoàn xu</Badge>
            case 'ADMIN_GRANT': return <Badge className="bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30">Admin tặng</Badge>
            default: return <Badge variant="secondary">{type}</Badge>
        }
    }

    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loading size="lg" /></div>
    }

    return (
        <div className="container max-w-3xl mx-auto px-4 py-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
            </Button>

            {/* Balance Card */}
            <Card className="mb-8 overflow-hidden">
                <div className="relative p-6 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                                <Coins className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Số dư hiện tại</p>
                                <p className="text-4xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums">
                                    {balance.toLocaleString()} <span className="text-lg font-bold">xu</span>
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => setShowPurchaseModal(true)}
                            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-yellow-500/25"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nạp Xu
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        Lịch Sử Giao Dịch
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Coins className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Chưa có giao dịch nào</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                            tx.amount > 0 
                                                ? 'bg-green-500/10 text-green-500' 
                                                : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {getTypeIcon(tx.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm line-clamp-1">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getTypeBadge(tx.type)}
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`font-bold tabular-nums text-base ${
                                        tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showPurchaseModal && <CoinPurchaseModal onClose={() => setShowPurchaseModal(false)} />}
        </div>
    )
}
