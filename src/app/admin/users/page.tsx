'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Loader2, Shield, User as UserIcon } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from "@/hooks/use-toast"

export default function UserManagement() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    
    const [isAdmin, setIsAdmin] = useState(false)
    const [usersList, setUsersList] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsersList(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast({
                title: "Lỗi",
                description: "Không thể lấy danh sách người dùng. Có thể do RLS hoặc bạn không có quyền.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return
            
            if (!user) {
                router.push('/login')
                return
            }

            const { data: userData } = await supabase
                .from('users')
                .select('is_admin')
                .eq('user_id', user.id)
                .single()
            
            if (!userData?.is_admin) {
                router.push('/dashboard')
                return
            }

            setIsAdmin(true)
            fetchUsers()
        }
        
        checkAccess()
    }, [user, authLoading, router, fetchUsers])

    const toggleAdminStatus = async (targetUserId: string, currentStatus: boolean) => {
        if (targetUserId === user?.id) {
            toast({
                title: "Thao tác từ chối",
                description: "Bạn không thể tự tước quyền admin của chính mình!",
                variant: "destructive"
            })
            return
        }

        setIsProcessing(targetUserId)
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_admin: !currentStatus })
                .eq('user_id', targetUserId)

            if (error) throw error

            toast({
                title: "Thành công",
                description: `Đã ${!currentStatus ? 'Cấp quyền Admin' : 'Hạ cấp xuống Độc giả'} cho người dùng này.`,
            })
            
            // Refresh table locally
            setUsersList(prev => prev.map(u => 
                u.user_id === targetUserId ? { ...u, is_admin: !currentStatus } : u
            ))
        } catch (error) {
            console.error('Error toggling admin:', error)
            toast({
                title: "Lỗi",
                description: "Không thể thay đổi quyền người dùng này.",
                variant: "destructive"
            })
        } finally {
            setIsProcessing(null)
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!isAdmin) return null

    return (
        <div className="container max-w-6xl mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Độc Giả</h1>
                    <p className="text-muted-foreground mt-1">
                        Theo dõi tài khoản và phân quyền quản trị trị hệ thống.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Danh sách Tài Khoản
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                                <tr>
                                    <th className="px-4 py-3 font-medium rounded-tl-lg">Người Dùng</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Ngày Tham Gia</th>
                                    <th className="px-4 py-3 font-medium">Vai Trò</th>
                                    <th className="px-4 py-3 font-medium rounded-tr-lg">Chức Năng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {usersList.map((u) => (
                                    <tr key={u.user_id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-4 font-medium">
                                            {u.full_name}
                                        </td>
                                        <td className="px-4 py-4">
                                            {u.email}
                                        </td>
                                        <td className="px-4 py-4 text-muted-foreground">
                                            {new Date(u.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center w-fit gap-1 ${u.is_admin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                {u.is_admin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                                                {u.is_admin ? 'Admin' : 'Độc giả'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Button 
                                                variant={u.is_admin ? "outline" : "secondary"} 
                                                size="sm"
                                                onClick={() => toggleAdminStatus(u.user_id, !!u.is_admin)}
                                                disabled={isProcessing === u.user_id || u.user_id === user?.id}
                                            >
                                                {isProcessing === u.user_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    u.is_admin ? 'Hạ Quyền' : 'Phong Admin'
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {usersList.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Không tìm thấy dữ liệu người dùng.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
