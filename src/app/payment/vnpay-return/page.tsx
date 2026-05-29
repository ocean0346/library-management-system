'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useCoins } from '@/hooks/useCoins'
import { CheckCircle2, XCircle, Loader2, Coins, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

function VNPayReturnContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, loading: isAuthLoading } = useAuth()
    const { fetchBalance } = useCoins()

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
    const [message, setMessage] = useState('')
    const [txnRef, setTxnRef] = useState('')
    const [amount, setAmount] = useState(0)

    // Chống duplicate: chỉ xử lý 1 lần duy nhất
    const isProcessed = useRef(false)

    useEffect(() => {
        // Đợi auth load xong
        if (isAuthLoading) return

        // Chống StrictMode gọi 2 lần
        if (isProcessed.current) return
        isProcessed.current = true

        const processPayment = async () => {
            const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
            const vnp_TxnRef = searchParams.get('vnp_TxnRef')
            const vnp_Amount = searchParams.get('vnp_Amount')
            const vnp_OrderInfo = searchParams.get('vnp_OrderInfo')
            const vnp_TransactionStatus = searchParams.get('vnp_TransactionStatus')

            setTxnRef(vnp_TxnRef || '')
            setAmount(parseInt(vnp_Amount || '0') / 100)

            if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                if (user) {
                    try {

                        const { data: existing } = await supabase
                            .from('coin_transactions')
                            .select('id')
                            .eq('stripe_session_id', vnp_TxnRef)
                            .maybeSingle()

                        if (existing) {

                            await fetchBalance()
                            setStatus('success')
                            setMessage('Giao dịch đã được xử lý trước đó!')
                            return
                        }

                        const orderInfo = vnp_OrderInfo || ''
                        const coinMatch = orderInfo.match(/Nap (\d+) xu/)
                        const bonusMatch = orderInfo.match(/\+ (\d+) bonus/)

                        const coinAmount = coinMatch ? parseInt(coinMatch[1]) : 0
                        const bonusCoins = bonusMatch ? parseInt(bonusMatch[1]) : 0
                        const totalCoins = coinAmount + bonusCoins

                        if (totalCoins > 0) {
                            const { data, error } = await supabase.rpc('add_coins_to_user', {
                                p_user_id: user.id,
                                p_amount: totalCoins,
                                p_type: 'DEPOSIT',
                                p_description: `VNPay: ${orderInfo}`,
                                p_stripe_session_id: vnp_TxnRef
                            })

                            if (error) throw error

                            await fetchBalance()
                            setStatus('success')
                            setMessage(`Nạp thành công ${totalCoins} xu vào tài khoản!`)
                        } else {
                            throw new Error('Không xác định được số xu')
                        }
                    } catch (err: any) {
                        console.error('Error adding coins:', err)
                        setStatus('failed')
                        setMessage('Thanh toán thành công nhưng có lỗi khi cộng xu. Vui lòng liên hệ hỗ trợ.')
                    }
                } else {
                    setStatus('failed')
                    setMessage('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
                }
            } else {
                const errorMessages: Record<string, string> = {
                    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ.',
                    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
                    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
                    '11': 'Đã hết hạn chờ thanh toán.',
                    '12': 'Thẻ/Tài khoản bị khóa.',
                    '13': 'Bạn nhập sai mật khẩu xác thực (OTP).',
                    '24': 'Bạn đã hủy giao dịch.',
                    '51': 'Tài khoản không đủ số dư.',
                    '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
                    '75': 'Ngân hàng đang bảo trì.',
                    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
                    '99': 'Lỗi không xác định.',
                }

                setStatus('failed')
                setMessage(errorMessages[vnp_ResponseCode || '99'] || 'Giao dịch không thành công.')
            }
        }

        processPayment()
    }, [isAuthLoading, user]) 

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
            <Card className="w-full max-w-md overflow-hidden">
                <CardContent className="p-0">
                    {status === 'loading' ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-lg font-medium">Đang xử lý thanh toán...</p>
                            <p className="text-sm text-muted-foreground mt-2">Vui lòng đợi trong giây lát</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="text-center">
                            {}
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 border-b">
                                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 mb-4">
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Thanh Toán Thành Công!</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-center gap-2 text-lg">
                                    <Coins className="h-6 w-6 text-yellow-500" />
                                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{message}</span>
                                </div>

                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Mã giao dịch: <span className="font-mono text-foreground">{txnRef}</span></p>
                                    <p>Số tiền: <span className="font-bold text-foreground">{amount.toLocaleString()} VNĐ</span></p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href="/account/coins">
                                            <Coins className="h-4 w-4 mr-2" />
                                            Lịch Sử Xu
                                        </Link>
                                    </Button>
                                    <Button className="flex-1 bg-gradient-to-r from-primary to-[#09ADAA]" asChild>
                                        <Link href="/">
                                            <Home className="h-4 w-4 mr-2" />
                                            Trang Chủ
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            {}
                            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 p-8 border-b">
                                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25 mb-4">
                                    <XCircle className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Thanh Toán Thất Bại</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-muted-foreground">{message}</p>

                                {txnRef && (
                                    <p className="text-sm text-muted-foreground">
                                        Mã giao dịch: <span className="font-mono text-foreground">{txnRef}</span>
                                    </p>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Quay Lại
                                    </Button>
                                    <Button className="flex-1" asChild>
                                        <Link href="/">
                                            <Home className="h-4 w-4 mr-2" />
                                            Trang Chủ
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function VNPayReturnPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <VNPayReturnContent />
        </Suspense>
    )
}
