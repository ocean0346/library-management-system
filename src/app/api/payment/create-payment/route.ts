import { NextRequest, NextResponse } from 'next/server'
import vnpay from '@/lib/vnpay'
import { ProductCode, VnpLocale } from 'vnpay'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { packageId, packageName, coinAmount, bonusCoins, priceVnd, userId } = body

        if (!packageId || !priceVnd || !userId) {
            return NextResponse.json({ error: 'Thiếu thông tin gói nạp' }, { status: 400 })
        }

        // Tạo mã giao dịch duy nhất
        const txnRef = `COIN_${Date.now()}_${Math.random().toString(36).substring(7)}`

        // Lấy IP của user
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

        // Build VNPay payment URL
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
        const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
        const baseUrl = `${protocol}://${host}`
        const returnUrl = `${baseUrl}/payment/vnpay-return`

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: priceVnd, // VNPay lib tự nhân 100
            vnp_IpAddr: clientIp,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Nap ${coinAmount} xu${bonusCoins > 0 ? ` + ${bonusCoins} bonus` : ''} - ${packageName}`,
            vnp_OrderType: ProductCode.Pay,
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: VnpLocale.VN,
        })

        // Lưu thông tin giao dịch tạm vào URL params để xử lý khi return
        // Trong production nên lưu vào DB, nhưng với bài tập dùng query params đủ
        const fullPaymentUrl = paymentUrl

        return NextResponse.json({ 
            paymentUrl: fullPaymentUrl,
            txnRef,
        })
    } catch (error: any) {
        console.error('VNPay create payment error:', error)
        return NextResponse.json(
            { error: error.message || 'Không thể tạo thanh toán' }, 
            { status: 500 }
        )
    }
}
