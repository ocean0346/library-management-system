import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Chính Sách Bảo Mật - ThưViệnOnline',
    description: 'Chính sách bảo mật của ThưViệnOnline',
}

export default function PrivacyPolicyPage() {
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
                <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Chính Sách Bảo Mật</h1>
                <p className="text-muted-foreground text-lg mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">1. Giới Thiệu</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chào mừng bạn đến với ThưViệnOnline. Chúng tôi tôn trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của bạn.
                        Chính sách bảo mật này sẽ thông báo cho bạn về cách chúng tôi bảo vệ dữ liệu cá nhân khi bạn truy cập trang web
                        và cho bạn biết về quyền riêng tư cũng như cách pháp luật bảo vệ bạn.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">2. Thông Tin Chúng Tôi Thu Thập</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Chúng tôi có thể thu thập, sử dụng, lưu trữ và chuyển giao các loại dữ liệu cá nhân khác nhau về bạn:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Dữ liệu nhận dạng:</strong> bao gồm họ tên, tên đăng nhập hoặc thông tin định danh tương tự</li>
                        <li><strong>Dữ liệu liên hệ:</strong> bao gồm địa chỉ email</li>
                        <li><strong>Dữ liệu kỹ thuật:</strong> bao gồm địa chỉ IP, loại trình duyệt, cài đặt múi giờ và vị trí</li>
                        <li><strong>Dữ liệu sử dụng:</strong> bao gồm thông tin về cách bạn sử dụng trang web và dịch vụ của chúng tôi</li>
                        <li><strong>Dữ liệu thư viện:</strong> bao gồm thông tin về sách đã đọc, lịch sử đọc và danh sách yêu thích</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">3. Cách Chúng Tôi Sử Dụng Thông Tin</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Chúng tôi sử dụng dữ liệu cá nhân của bạn cho các mục đích sau:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Cung cấp và duy trì dịch vụ thư viện trực tuyến</li>
                        <li>Quản lý tài khoản của bạn</li>
                        <li>Lưu trữ tiến độ đọc sách và danh sách yêu thích</li>
                        <li>Gửi thông báo quan trọng về cập nhật sách mới</li>
                        <li>Cải thiện dịch vụ và trải nghiệm người dùng</li>
                        <li>Tuân thủ các nghĩa vụ pháp lý</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">4. Bảo Mật Dữ Liệu</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chúng tôi đã triển khai các biện pháp bảo mật phù hợp để ngăn chặn dữ liệu cá nhân của bạn bị mất,
                        sử dụng hoặc truy cập trái phép. Chúng tôi sử dụng mã hóa tiêu chuẩn công nghiệp và máy chủ bảo mật
                        để bảo vệ dữ liệu của bạn.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">5. Lưu Trữ Dữ Liệu</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chúng tôi chỉ lưu giữ dữ liệu cá nhân của bạn trong thời gian cần thiết để thực hiện các mục đích đã thu thập.
                        Khi bạn xóa tài khoản, chúng tôi sẽ xóa hoặc ẩn danh dữ liệu cá nhân của bạn trong vòng 30 ngày.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">6. Quyền Của Bạn</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Theo luật bảo vệ dữ liệu, bạn có các quyền bao gồm:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Truy cập:</strong> Bạn có thể yêu cầu bản sao dữ liệu cá nhân của mình</li>
                        <li><strong>Chỉnh sửa:</strong> Bạn có thể yêu cầu chúng tôi sửa dữ liệu không chính xác hoặc không đầy đủ</li>
                        <li><strong>Xóa:</strong> Bạn có thể yêu cầu chúng tôi xóa dữ liệu cá nhân của mình</li>
                        <li><strong>Di chuyển:</strong> Bạn có thể yêu cầu chuyển dữ liệu sang tổ chức khác</li>
                        <li><strong>Phản đối:</strong> Bạn có thể phản đối một số hình thức xử lý dữ liệu</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">7. Dịch Vụ Bên Thứ Ba</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Dịch vụ của chúng tôi có thể sử dụng các dịch vụ bên thứ ba cho xác thực và phân tích.
                        Các dịch vụ này có chính sách bảo mật riêng và chúng tôi khuyến khích bạn xem xét chúng.
                        Chúng tôi sử dụng Supabase cho dịch vụ xác thực và cơ sở dữ liệu.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">8. Thay Đổi Chính Sách</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi nào
                        bằng cách đăng chính sách mới trên trang này và cập nhật ngày &quot;Cập nhật lần cuối&quot;.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">9. Liên Hệ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua email{' '}
                        <a href="mailto:pengu0163@gmail.com" className="text-primary hover:underline">
                            pengu0163@gmail.com
                        </a>
                    </p>
                </section>
            </article>
        </div>
    )
}
