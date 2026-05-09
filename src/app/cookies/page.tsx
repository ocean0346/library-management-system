import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Chính Sách Cookie - ThưViệnOnline',
    description: 'Chính sách Cookie của ThưViệnOnline',
}

export default function CookiePolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Về Trang Chủ
                    </Link>
                </Button>
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Chính Sách Cookie</h1>
                <p className="text-muted-foreground text-lg mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">1. Cookie Là Gì?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Cookie là các tệp văn bản nhỏ được lưu trên máy tính hoặc thiết bị di động của bạn khi bạn truy cập một trang web.
                        Cookie được sử dụng rộng rãi để giúp trang web hoạt động hiệu quả hơn và cung cấp thông tin cho chủ sở hữu trang web.
                        Cookie giúp chúng tôi cải thiện trải nghiệm của bạn bằng cách ghi nhớ tùy chọn và hiểu cách bạn sử dụng dịch vụ.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">2. Cách Chúng Tôi Sử Dụng Cookie</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Chúng tôi sử dụng cookie cho các mục đích sau:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Xác thực:</strong> Để duy trì trạng thái đăng nhập và phiên làm việc của bạn</li>
                        <li><strong>Tùy chọn:</strong> Để ghi nhớ cài đặt như chế độ giao diện (sáng/tối)</li>
                        <li><strong>Bảo mật:</strong> Để bảo vệ tài khoản và ngăn chặn gian lận</li>
                        <li><strong>Phân tích:</strong> Để hiểu cách người dùng tương tác với trang web</li>
                        <li><strong>Hiệu suất:</strong> Để đảm bảo trang web tải nhanh và hoạt động ổn định</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">3. Các Loại Cookie Chúng Tôi Sử Dụng</h2>

                    <div className="mb-6">
                        <h3 className="text-xl font-display font-medium mb-3">Cookie Thiết Yếu</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Các cookie này cần thiết để trang web hoạt động bình thường. Chúng bao gồm các chức năng cốt lõi
                            như bảo mật, truy cập tài khoản và quản lý phiên làm việc. Bạn không thể tắt các cookie này
                            vì dịch vụ sẽ không thể hoạt động nếu thiếu chúng.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-display font-medium mb-3">Cookie Chức Năng</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Các cookie này cho phép chúng tôi ghi nhớ các lựa chọn của bạn (như ngôn ngữ hoặc giao diện ưa thích)
                            và cung cấp các tính năng cá nhân hóa.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-display font-medium mb-3">Cookie Phân Tích</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Các cookie này giúp chúng tôi hiểu cách khách truy cập tương tác với trang web bằng cách thu thập
                            và báo cáo thông tin ẩn danh. Điều này giúp chúng tôi cải thiện dịch vụ và trải nghiệm người dùng.
                        </p>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">4. Cookie Bên Thứ Ba</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Chúng tôi có thể sử dụng các dịch vụ bên thứ ba có cookie riêng:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Supabase:</strong> Cho xác thực và quản lý phiên đăng nhập</li>
                        <li><strong>Vercel:</strong> Cho phân tích hiệu suất trang web</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        Các dịch vụ bên thứ ba này có chính sách cookie riêng. Chúng tôi khuyến khích bạn xem xét chúng.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">5. Thời Hạn Cookie</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Cookie có thể là cookie phiên hoặc cookie lâu dài:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Cookie phiên:</strong> Là cookie tạm thời, sẽ bị xóa khi bạn đóng trình duyệt</li>
                        <li><strong>Cookie lâu dài:</strong> Được lưu trên thiết bị trong một khoảng thời gian nhất định hoặc cho đến khi bạn xóa chúng</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        Cookie xác thực của chúng tôi thường tồn tại từ 7-30 ngày tùy theo tùy chọn phiên đăng nhập của bạn.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">6. Quản Lý Cookie</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Bạn có thể kiểm soát và quản lý cookie theo nhiều cách:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Cài đặt trình duyệt:</strong> Hầu hết các trình duyệt cho phép bạn từ chối hoặc chấp nhận cookie và xóa cookie hiện có</li>
                        <li><strong>Duyệt web riêng tư:</strong> Sử dụng chế độ ẩn danh để ngăn cookie được lưu trữ</li>
                        <li><strong>Công cụ quản lý cookie:</strong> Sử dụng tiện ích mở rộng trình duyệt để quản lý cookie chi tiết hơn</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        Xin lưu ý rằng việc chặn hoặc xóa cookie có thể ảnh hưởng đến khả năng sử dụng dịch vụ của bạn,
                        vì một số tính năng yêu cầu cookie để hoạt động.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">7. Hướng Dẫn Theo Trình Duyệt</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Dưới đây là liên kết quản lý cookie trên các trình duyệt phổ biến:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                        <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">8. Cập Nhật Chính Sách</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chúng tôi có thể cập nhật Chính Sách Cookie này theo thời gian để phản ánh các thay đổi trong hoạt động
                        hoặc vì lý do pháp lý. Chúng tôi sẽ đăng bất kỳ thay đổi nào trên trang này và cập nhật ngày &quot;Cập nhật lần cuối&quot;.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">9. Liên Hệ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Nếu bạn có bất kỳ câu hỏi nào về việc sử dụng cookie của chúng tôi, vui lòng liên hệ qua email{' '}
                        <a href="mailto:pengu0163@gmail.com" className="text-primary hover:underline">
                            pengu0163@gmail.com
                        </a>
                    </p>
                </section>
            </article>
        </div>
    )
}
