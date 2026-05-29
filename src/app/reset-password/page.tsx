'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { AlertCircle, Loader2, BookOpen, CheckCircle2, ArrowLeft } from 'lucide-react'
export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
    const router = useRouter()
    useEffect(() => {
        // Check if we have a valid recovery session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            // The session will exist if the user clicked the reset link
            // Supabase automatically exchanges the token for a session
            if (session) {
                setIsValidSession(true)
            } else {
                // Listen for auth state change in case token is being processed
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'PASSWORD_RECOVERY') {
                        setIsValidSession(true)
                    } else if (session) {
                        setIsValidSession(true)
                    }
                })
                setTimeout(() => {
                    if (isValidSession === null) {
                        setIsValidSession(false)
                    }
                }, 2000)
                return () => subscription.unsubscribe()
            }
        }
        checkSession()
    }, [isValidSession])
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })
            if (error) {
                throw error
            }
            setIsSuccess(true)
            await supabase.auth.signOut()
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error) {
            console.error('Password update error:', error)
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError('Không thể cập nhật mật khẩu. Vui lòng thử lại.')
            }
        } finally {
            setIsLoading(false)
        }
    }
    if (isValidSession === null) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardContent className="pt-12 pb-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#02FF73]" />
                        <p className="mt-4 text-muted-foreground">Đang xác minh liên kết...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }
    if (isValidSession === false) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardHeader className="space-y-4 text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-display font-bold">
                                Liên kết không hợp lệ hoặc hết hạn
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Liên kết đặt lại mật khẩu này không hợp lệ hoặc đã hết hạn.
                                Vui lòng yêu cầu liên kết mới.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 text-center">
                        <Button variant="gradient" className="w-full" asChild>
                            <Link href="/forgot-password">
                                Yêu cầu liên kết mới
                            </Link>
                        </Button>
                        <Link
                            href="/login"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center mt-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại đăng nhập
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }
    if (isSuccess) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardHeader className="space-y-4 text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                            <CheckCircle2 className="h-8 w-8 text-black" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-display font-bold">
                                Mật khẩu đã được cập nhật!
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Mật khẩu của bạn đã được đặt lại thành công.
                                Đang chuyển hướng đến trang đăng nhập...
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#02FF73]" />
                    </CardContent>
                </Card>
            </div>
        )
    }
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                        <BookOpen className="h-8 w-8 text-black" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-display font-bold">
                            Đặt mật khẩu mới
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Nhập mật khẩu mới của bạn bên dưới
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
                            <Label htmlFor="password" className="text-sm font-medium">
                                Mật Khẩu Mới
                            </Label>
                            <PasswordInput
                                id="password"
                                placeholder="Nhập mật khẩu mới"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError(null)
                                }}
                                disabled={isLoading}
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                Tối thiểu 6 ký tự
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                Xác Nhận Mật Khẩu Mới
                            </Label>
                            <PasswordInput
                                id="confirmPassword"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
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
                                    Đang cập nhật...
                                </>
                            ) : (
                                'Đặt lại mật khẩu'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
