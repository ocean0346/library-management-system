import { VNPay, HashAlgorithm, ignoreLogger } from 'vnpay'

const vnpay = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || 'CGXZLS0Z',
    secureSecret: process.env.VNPAY_HASH_SECRET || 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: true,
    loggerFn: ignoreLogger,
})

export default vnpay
