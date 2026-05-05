'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Clock, History, Search as SearchIcon, ArrowLeft, ArrowRight } from 'lucide-react'

const LOGS_PER_PAGE = 20

export default function AccessLogs() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    
    const [isAdmin, setIsAdmin] = useState(false)
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalLogs, setTotalLogs] = useState(0)

    const fetchLogs = useCallback(async () => {
        setIsLoading(true)
        try {
            const startRange = (currentPage - 1) * LOGS_PER_PAGE
            const endRange = startRange + LOGS_PER_PAGE - 1

            const { data, count, error } = await supabase
                .from('access_logs')
                .select(`
                    log_id,
                    access_date,
                    users (full_name, email),
                    books (title)
                `, { count: 'exact' })
                .order('access_date', { ascending: false })
                .range(startRange, endRange)

            if (error) throw error

            setLogs(data || [])
            if (count !== null) {
                setTotalLogs(count)
                setTotalPages(Math.ceil(count / LOGS_PER_PAGE))
            }
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setIsLoading(false)
        }
    }, [currentPage])

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return
            if (!user) {
                router.push('/login')
                return
            }
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single()
            
            if (!userData?.role || (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN')) {
                router.push('/dashboard')
                return
            }
            setIsAdmin(true)
            fetchLogs()
        }
        checkAccess()
    }, [user, authLoading, router, fetchLogs])

    if (authLoading || (isLoading && logs.length === 0)) {
        return <div className="flex h-[60vh] items-center justify-center"><Loading size="lg" /></div>
    }

    if (!isAdmin) return null

    return (
        <div className="container max-w-6xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Lịch Sử Truy Cập</h1>
                <p className="text-muted-foreground mt-1">
                    Theo dõi toàn bộ lịch sử đọc sách của người dùng trên toàn hệ thống ({totalLogs} lượt).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Nhật Ký Truy Cập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto relative min-h-[200px]">
                        {isLoading && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[1px] rounded-lg">
                                <Loading />
                            </div>
                        )}
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                                <tr>
                                    <th className="px-4 py-3 font-medium rounded-tl-lg">Thời Gian</th>
                                    <th className="px-4 py-3 font-medium">Độc Giả</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium rounded-tr-lg">Sách Đã Đọc</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr key={log.log_id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {new Date(log.access_date).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-4 font-medium">
                                            {(log.users as any)?.full_name || 'Khách vãng lai'}
                                        </td>
                                        <td className="px-4 py-4">
                                            {(log.users as any)?.email || '-'}
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-primary">
                                            {(log.books as any)?.title || 'Sách đã bị xóa'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {logs.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-muted-foreground">
                                Chưa có lượt truy cập nào được ghi nhận.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <div className="text-sm text-muted-foreground hidden sm:block">
                                Trang {currentPage} / {totalPages}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="flex-1 sm:flex-none"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Trước
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="flex-1 sm:flex-none"
                                >
                                    Sau <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
