import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Thư Viện Online',
    description: 'Nền tảng đọc sách và tài liệu trực tuyến miễn phí hàng đầu.',
    icons: {
        icon: '/thu-vien-online-logo.svg',
        apple: '/thu-vien-online-logo.svg',
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
                <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                </div>
                <Toaster />
        </AuthProvider>
        </body>
        </html>
    )
}
