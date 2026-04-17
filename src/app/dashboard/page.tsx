'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Clock, Loader2, ArrowRight, Tags, History, PlusCircle } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    
    const [isAdmin, setIsAdmin] = useState(false)
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalDownloads: 0,
    })
    const [isLoading, setIsLoading] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        if (!user) return

        setIsLoading(true)
        try {
            // Check Admin
            const { data: userData } = await supabase
                .from('users')
                .select('is_admin')
                .eq('user_id', user.id)
                .single()
            
            const adminMode = !!userData?.is_admin
            setIsAdmin(adminMode)

            if (!adminMode) {
                router.push('/bookshelf')
                return
            }

            // Admin stats
            const { count: booksCount } = await supabase.from('books').select('*', { count: 'exact', head: true })
            const { count: logsCount } = await supabase.from('access_logs').select('*', { count: 'exact', head: true })
            
            setStats({
                totalBooks: booksCount || 0,
                totalDownloads: logsCount || 0
            })
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) {
            fetchDashboardData()
        }
    }, [user, fetchDashboardData])

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="container max-w-7xl mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Quản Trị</h1>
                    <p className="text-muted-foreground mt-1">
                        Hệ thống Thư Viện Online
                    </p>
                </div>
                <Button asChild>
                    <Link href="/books/add">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Thêm Sách Mới
                    </Link>
                </Button>
            </div>

            <div className="space-y-10">
                    {/* Thống kê nhanh */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-2 rounded-full bg-gradient-to-b from-[#02FF73] to-[#09ADAA]"></div>
                            <h2 className="text-xl font-semibold tracking-tight">Thống kê Tổng quan</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Link href="/books">
                                <Card className="relative overflow-hidden group cursor-pointer border-0 ring-1 ring-border shadow-sm hover:shadow-md transition-all h-full bg-gradient-to-br from-background to-muted/30">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#09ADAA]/10 rounded-full blur-2xl group-hover:bg-[#09ADAA]/20 transition-all -translate-y-1/2 translate-x-1/2"></div>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-xl bg-[#09ADAA]/10 flex items-center justify-center text-[#09ADAA]">
                                                <BookOpen className="h-6 w-6" />
                                            </div>
                                            <div className="text-3xl font-bold tracking-tighter">{stats.totalBooks}</div>
                                        </div>
                                        <CardTitle className="text-base text-muted-foreground font-medium mb-1">Tổng Số Sách</CardTitle>
                                        <p className="text-xs font-semibold text-[#09ADAA] flex items-center mt-2 group-hover:translate-x-1 transition-transform">
                                            Vào kho sách <ArrowRight className="ml-1 h-3 w-3" />
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/admin/logs">
                                <Card className="relative overflow-hidden group cursor-pointer border-0 ring-1 ring-border shadow-sm hover:shadow-md transition-all h-full bg-gradient-to-br from-background to-muted/30">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#02FF73]/10 rounded-full blur-2xl group-hover:bg-[#02FF73]/20 transition-all -translate-y-1/2 translate-x-1/2"></div>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-xl bg-[#02FF73]/10 flex items-center justify-center text-[#02FF73]">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div className="text-3xl font-bold tracking-tighter">{stats.totalDownloads}</div>
                                        </div>
                                        <CardTitle className="text-base text-muted-foreground font-medium mb-1">Tổng Lượt Truy Cập</CardTitle>
                                        <p className="text-xs font-semibold text-[#02FF73] flex items-center mt-2 group-hover:translate-x-1 transition-transform">
                                            Báo cáo chi tiết <ArrowRight className="ml-1 h-3 w-3" />
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </section>

                    {/* Công cụ quản trị */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-2 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>
                            <h2 className="text-xl font-semibold tracking-tight">Công Cụ Quản Trị</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Link href="/books/add">
                                <Card className="hover:border-primary/50 hover:shadow-sm transition-all group cursor-pointer h-full bg-muted/20">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <PlusCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm">Thêm Sách Mới</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Khai báo tài liệu mới</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            
                            <Link href="/admin/users">
                                <Card className="hover:border-blue-500/50 hover:shadow-sm transition-all group cursor-pointer h-full bg-muted/20">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm">Quản Lý Độc Giả</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Phân quyền, kiểm tra</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/admin/categories">
                                <Card className="hover:border-orange-500/50 hover:shadow-sm transition-all group cursor-pointer h-full bg-muted/20">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Tags className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm">Quản Lý Danh Mục</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Chỉnh sửa thể loại</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/admin/logs">
                                <Card className="hover:border-indigo-500/50 hover:shadow-sm transition-all group cursor-pointer h-full bg-muted/20">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <History className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm">Lịch Sử Truy Cập</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Kiểm tra Logs hệ thống</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </section>
                </div>
        </div>
    )
}
