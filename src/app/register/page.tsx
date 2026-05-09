'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { AlertCircle, Loader2, User, Mail, UserPlus, Check, BookOpen, Sparkles } from 'lucide-react'

const features = [
    "Tiếp cận kho tàng tiểu thuyết khổng lồ",
    "Tham gia cộng đồng đọc truyện sôi động",
    "Đánh dấu và theo dõi quá trình đọc",
    "Nhận thông báo khi có chương mới",
]

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { signUp } = useAuth()
    const router = useRouter()

    const validateForm = () => {
        if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
            setError('Vui lòng điền đầy đủ tất cả các trường')
            return false
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return false
        }
        return true
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            await signUp(
                formData.email,
                formData.password,
                formData.username,
                formData.fullName
            )
            router.push('/dashboard')
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Không thể tạo tài khoản')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#09ADAA] to-[#02FF73] items-center justify-center p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Decorative Circles */}
                <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-md text-black">
                    <div className="mb-8">
                        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl border border-white/20">
                            <BookOpen className="w-10 h-10 text-black absolute" />
                            <Sparkles className="w-5 h-5 text-black absolute top-2 right-2 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-display font-bold mb-4">
                        Khởi Đầu Hành Trình Cùng ThưViệnOnline
                    </h2>
                    <p className="text-lg opacity-80 mb-8">
                        Tạo tài khoản miễn phí để mở khóa toàn bộ tính năng tuyệt vời của chúng tôi.
                    </p>

                    {/* Features List */}
                    <ul className="space-y-3">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center">
                                    <Check className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-lg">
                    <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
                        <CardHeader className="space-y-4 text-center pb-2">
                            {/* Logo Icon */}
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                                <UserPlus className="h-8 w-8 text-black" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-display font-bold">
                                    Tạo Tài Khoản
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    Gia nhập ThưViệnOnline ngay hôm nay
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive" className="animate-fade-in">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-sm font-medium">
                                            Tên Đăng Nhập
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="username"
                                                name="username"
                                                placeholder="nguyenvana"
                                                className="pl-10"
                                                value={formData.username}
                                                onChange={handleChange}
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-sm font-medium">
                                            Họ và Tên
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="fullName"
                                                name="fullName"
                                                placeholder="Nguyễn Văn A"
                                                className="pl-10"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium">
                                            Mật Khẩu
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            placeholder="Tối thiểu 6 ký tự"
                                            value={formData.password}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                            Xác Nhận Mật Khẩu
                                        </Label>
                                        <PasswordInput
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Nhập lại mật khẩu"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gradient"
                                    className="w-full"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang tạo tài khoản...
                                        </>
                                    ) : (
                                        'Đăng Ký'
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Bằng việc đăng ký, bạn xác nhận đồng ý với{' '}
                                    <Link href="/terms" className="text-foreground hover:underline">
                                        Điều Khoản Sử Dụng
                                    </Link>{' '}
                                    và{' '}
                                    <Link href="/privacy" className="text-foreground hover:underline">
                                        Chính Sách Bảo Mật
                                    </Link>{' '}của chúng tôi.
                                </p>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 pt-2">
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        Đã có tài khoản?
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">
                                    Quay lại Đăng nhập
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
