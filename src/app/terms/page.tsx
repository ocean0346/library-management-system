import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'
export const metadata: Metadata = {
    title: 'Điều Khoản Sử Dụng - ThưViệnOnline',
    description: 'Điều khoản sử dụng của ThưViệnOnline',
}
export default function TermsOfServicePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/" className="gap-2">
                        <ArrowLeft weight="duotone" className="h-4 w-4" />
                        Về Trang Chủ
                    </Link>
                </Button>
            </div>
            <article className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Điều Khoản Sử Dụng</h1>
                <p className="text-muted-foreground text-lg mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">1. Chấp Nhận Điều Khoản</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Bằng việc truy cập và sử dụng ThưViệnOnline, bạn chấp nhận và đồng ý tuân theo các điều khoản
                        và điều kiện của thỏa thuận này. Nếu bạn không đồng ý với các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">2. Mô Tả Dịch Vụ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        ThưViệnOnline cung cấp thư viện tài liệu online miễn phí. Dịch vụ của chúng tôi bao gồm
                        kho sách đa dạng, tính năng lưu trữ và theo dõi tiến độ đọc, cùng với hệ thống đánh giá và nhận xét.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">3. Tài Khoản Người Dùng</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Để sử dụng dịch vụ, bạn cần:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Tạo tài khoản với thông tin chính xác và đầy đủ</li>
                        <li>Duy trì bảo mật thông tin đăng nhập của bạn</li>
                        <li>Thông báo cho chúng tôi ngay lập tức nếu phát hiện sử dụng trái phép</li>
                        <li>Chịu trách nhiệm cho mọi hoạt động diễn ra trên tài khoản của bạn</li>
                    </ul>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">4. Quy Tắc Sử Dụng</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Bạn đồng ý không:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp nào</li>
                        <li>Tải lên hoặc chia sẻ nội dung vi phạm quyền sở hữu trí tuệ</li>
                        <li>Cố gắng truy cập trái phép vào tài khoản hoặc hệ thống khác</li>
                        <li>Can thiệp hoặc làm gián đoạn dịch vụ hoặc máy chủ</li>
                        <li>Sử dụng hệ thống tự động để truy cập dịch vụ mà không có sự cho phép</li>
                        <li>Chia sẻ thông tin đăng nhập tài khoản của bạn cho người khác</li>
                    </ul>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">5. Sở Hữu Trí Tuệ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        ThưViệnOnline, bao gồm nội dung gốc, tính năng và chức năng, thuộc sở hữu của chúng tôi
                        và được bảo vệ bởi luật bản quyền và sở hữu trí tuệ. Bạn giữ quyền sở hữu đối với nội dung
                        bạn tải lên nhưng cấp cho chúng tôi giấy phép sử dụng để cung cấp dịch vụ.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">6. Giới Hạn Trách Nhiệm</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Trong phạm vi tối đa được pháp luật cho phép, chúng tôi sẽ không chịu trách nhiệm cho bất kỳ
                        thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào, hoặc bất kỳ tổn thất lợi nhuận hay
                        doanh thu nào phát sinh từ việc bạn sử dụng dịch vụ.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">7. Chấm Dứt</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chúng tôi có thể chấm dứt hoặc tạm ngưng tài khoản và quyền truy cập dịch vụ của bạn ngay lập tức,
                        không cần thông báo trước, vì bất kỳ lý do nào, bao gồm vi phạm các điều khoản này.
                        Bạn cũng có thể xóa tài khoản bất cứ lúc nào thông qua cài đặt tài khoản.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">8. Thay Đổi Điều Khoản</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chúng tôi bảo lưu quyền sửa đổi hoặc thay thế các điều khoản này bất cứ lúc nào. 
                        Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">9. Liên Hệ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Nếu bạn có bất kỳ câu hỏi nào về Điều Khoản Sử Dụng này, vui lòng liên hệ với chúng tôi qua email{' '}
                        <a href="mailto:pengu0163@gmail.com" className="text-primary hover:underline">
                            pengu0163@gmail.com
                        </a>
                    </p>
                </section>
            </article>
        </div>
    )
}
