'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { AlertCircle, Loader2, BookOpen, Mail, Sparkles } from 'lucide-react'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const { signIn, signInWithGoogle } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const explicitRedirect = searchParams.get('redirect')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            await signIn(email, password)

            if (explicitRedirect) {
                router.push(explicitRedirect)
            } else {
                // Check role to determine redirect
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', email)
                    .single()

                const role = userData?.role
                if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                    router.push('/dashboard')
                } else {
                    router.push('/')
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại email và mật khẩu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex">
            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md">
                    <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
                        <CardHeader className="space-y-4 text-center pb-2">
                            {/* Logo Icon */}
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                                <BookOpen className="h-8 w-8 text-black" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-display font-bold">
                                    Chào mừng trở lại
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    Đăng nhập để vào ThưViệnOnline
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

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={isLoading}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-medium">
                                            Mật khẩu
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        placeholder="Nhập mật khẩu của bạn"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            setError(null)
                                        }}
                                        disabled={isLoading}
                                        required
                                    />
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
                                            Đang đăng nhập...
                                        </>
                                    ) : (
                                        'Đăng Nhập'
                                    )}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">
                                            Hoặc
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full bg-white text-black hover:bg-gray-50 border-gray-200"
                                    size="lg"
                                    onClick={async () => {
                                        setIsGoogleLoading(true)
                                        try {
                                            await signInWithGoogle()
                                        } catch (error) {
                                            console.error('Google Sign In error:', error)
                                            setError('Không thể đăng nhập bằng Google lúc này.')
                                            setIsGoogleLoading(false)
                                        }
                                    }}
                                    disabled={isGoogleLoading || isLoading}
                                >
                                    {isGoogleLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                    )}
                                    Đăng nhập với Google
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 pt-2">
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        Chưa có tài khoản ThưViệnOnline?
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/register">
                                    Tạo tài khoản mới
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#02FF73] to-[#09ADAA] items-center justify-center p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Decorative Circles */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-md text-black">
                    <div className="mb-8">
                        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl border border-white/20">
                            <BookOpen className="w-10 h-10 text-black absolute" />
                            <Sparkles className="w-5 h-5 text-black absolute top-2 right-2 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-display font-bold mb-4">
                        Thiên Đường Của Các Độc Giả
                    </h2>
                    <p className="text-lg opacity-80 mb-8">
                        Cùng tham gia với hàng vạn độc giả khác bằng cách lưu giữ, theo dõi và trải nghiệm những cuốn tiểu thuyết hay nhất trên ThưViệnOnline.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-black/20 border-2 border-[#02FF73] flex items-center justify-center text-xs font-bold"
                                >
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium opacity-80">
                            Hơn 5 vạn tác phẩm có sẵn
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Login() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    )
}
