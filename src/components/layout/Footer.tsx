'use client'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Users, Building2, Mail, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
const footerLinks = {
    product: {
        title: 'Khám Phá',
        links: [
            { label: 'Trang Chủ', href: '/' },
            { label: 'Thư Viện', href: '/books' },
            { label: 'Tủ Sách Của Tôi', href: '/bookshelf' },
        ],
    },
    resources: {
        title: 'Hỗ Trợ',
        links: [
            { label: 'Điều Khoản Sử Dụng', href: '/terms' },
            { label: 'Chính Sách Bảo Mật', href: '/privacy' },
            { label: 'Chính Sách Cookie', href: '/cookies' },
        ],
    },
    account: {
        title: 'Tài Khoản',
        links: [
            { label: 'Đăng Nhập', href: '/login' },
            { label: 'Đăng Ký', href: '/register' },
            { label: 'Cài Đặt Tài Khoản', href: '/account/settings' },
        ],
    },
}
export default function Footer() {
    const pathname = usePathname()
    if (pathname && pathname.includes('/read')) return null
    return (
        <footer className="border-t border-border/40 bg-muted/30">
            <div className="container py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    {}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-4 group">
                            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] shadow-lg shadow-[#02FF73]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(2,255,115,0.4)]">
                                <BookOpen className="w-5 h-5 text-black absolute" />
                                <Sparkles className="w-3 h-3 text-black absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-[#02FF73] to-[#09ADAA] bg-clip-text text-transparent group-hover:brightness-110 transition-all">
                                ThưViện<span className="text-foreground">Online</span>
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm max-w-xs mb-6">
                            Thư Viện Online: Thư viện tài liệu online hàng đầu, nơi lưu trữ, chia sẻ và lan tỏa tri thức tới mọi người.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://github.com/ocean0346"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                aria-label="GitHub"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>
                    {}
                    {Object.values(footerLinks).map((section) => (
                        <div key={section.title}>
                            <h4 className="font-display font-semibold text-sm mb-4">
                                {section.title}
                            </h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                {}
                <div className="border-t border-border/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Thư Viện Online. Đã đăng ký bản quyền.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Chính sách bảo mật
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Điều khoản dịch vụ
                        </Link>
                        <Link href="/cookies" className="hover:text-foreground transition-colors">
                            Chính sách Cookie
                        </Link>
                        <span className="hidden md:inline">
                            Xây dựng và phát triển bởi Dương
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
