'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Loader2, Shield, User as UserIcon, Search, Ban, Unlock, Trash2, Crown } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from "@/hooks/use-toast"
import { Input } from '@/components/ui/input'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
const ITEMS_PER_PAGE = 10
function PaginationControls({ currentPage, totalItems, onPageChange }: { currentPage: number, totalItems: number, onPageChange: (p: number) => void }) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    if (totalPages <= 1) return null
    return (
        <Pagination className="mt-6 pb-2">
            <PaginationContent>
                <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1) }}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
                {[...Array(totalPages)].map((_, i) => (
                    <PaginationLink 
                        key={i}
                        href="#" 
                        isActive={currentPage === i + 1}
                        onClick={(e) => { e.preventDefault(); onPageChange(i + 1) }}
                    >
                        {i + 1}
                    </PaginationLink>
                ))}
                <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1) }}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
            </PaginationContent>
        </Pagination>
    )
}
const ROLE_OPTIONS = [
    { value: 'READER', label: 'Độc Giả', icon: UserIcon, color: 'bg-muted text-muted-foreground' },
    { value: 'ADMIN', label: 'Admin', icon: Shield, color: 'bg-blue-500/10 text-blue-500' },
    { value: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown, color: 'bg-primary/10 text-primary' },
]
function getRoleInfo(role: string) {
    return ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0]
}
// Sort: SUPER_ADMIN > ADMIN > READER, then by created_at desc
function sortUsers(users: any[]) {
    const roleOrder: Record<string, number> = { 'SUPER_ADMIN': 0, 'ADMIN': 1, 'READER': 2 }
    return [...users].sort((a, b) => {
        const orderA = roleOrder[a.role] ?? 3
        const orderB = roleOrder[b.role] ?? 3
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
}
export default function UserManagement() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [isAdmin, setIsAdmin] = useState(false)
    const [callerRole, setCallerRole] = useState<string>('READER')
    const [usersList, setUsersList] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            const sorted = sortUsers(data || [])
            setUsersList(sorted)
            setFilteredUsers(sorted)
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
                .select('role')
                .eq('user_id', user.id)
                .single()
            if (!userData?.role || (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN')) {
                router.push('/dashboard')
                return
            }
            setIsAdmin(true)
            setCallerRole(userData.role)
            fetchUsers()
        }
        checkAccess()
    }, [user, authLoading, router, fetchUsers])
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(sortUsers(usersList))
            return
        }
        const query = searchQuery.toLowerCase()
        const filtered = usersList.filter(u => 
            (u.full_name && u.full_name.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query)) ||
            (u.username && u.username.toLowerCase().includes(query))
        )
        setFilteredUsers(sortUsers(filtered))
        setCurrentPage(1)
    }, [searchQuery, usersList])
    const changeUserRole = async (targetUserId: string, newRole: string) => {
        if (targetUserId === user?.id) {
            toast({
                title: "Thao tác từ chối",
                description: "Bạn không thể tự thay đổi vai trò của chính mình!",
                variant: "destructive"
            })
            return
        }
        setIsProcessing(targetUserId)
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('user_id', targetUserId)
            if (error) throw error
            const roleInfo = getRoleInfo(newRole)
            toast({
                title: "Thành công",
                description: `Đã chuyển vai trò thành "${roleInfo.label}".`,
            })
            setUsersList(prev => sortUsers(prev.map(u => 
                u.user_id === targetUserId ? { ...u, role: newRole } : u
            )))
        } catch (error) {
            console.error('Error changing role:', error)
            toast({
                title: "Lỗi",
                description: "Không thể thay đổi vai trò người dùng này.",
                variant: "destructive"
            })
        } finally {
            setIsProcessing(null)
        }
    }
    const toggleBanStatus = async (targetUserId: string, currentBanStatus: boolean) => {
        if (targetUserId === user?.id) {
            toast({
                title: "Thao tác từ chối",
                description: "Bạn không thể tự khóa chính mình!",
                variant: "destructive"
            })
            return
        }
        setIsProcessing(targetUserId)
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_banned: !currentBanStatus })
                .eq('user_id', targetUserId)
            if (error) throw error
            toast({
                title: "Thành công",
                description: `Đã ${!currentBanStatus ? 'Khóa' : 'Mở khóa'} tài khoản người dùng này.`,
            })
            setUsersList(prev => prev.map(u => 
                u.user_id === targetUserId ? { ...u, is_banned: !currentBanStatus } : u
            ))
        } catch (error) {
            console.error('Error toggling ban status:', error)
            toast({
                title: "Lỗi",
                description: "Vui lòng chạy SQL Migration để thêm cột is_banned trước khi sử dụng tính năng này.",
                variant: "destructive"
            })
        } finally {
            setIsProcessing(null)
        }
    }
    const deleteUser = async (targetUserId: string) => {
        if (targetUserId === user?.id) {
            toast({
                title: "Thao tác từ chối",
                description: "Bạn không thể xóa tài khoản của chính mình!",
                variant: "destructive"
            })
            return
        }
        setIsProcessing(targetUserId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`/api/admin/users/${targetUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            })
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to delete user')
            }
            toast({
                title: "Thành công",
                description: "Đã xóa vĩnh viễn người dùng khỏi hệ thống.",
            })
            setUsersList(prev => prev.filter(u => u.user_id !== targetUserId))
        } catch (error: any) {
            console.error('Error deleting user:', error)
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa người dùng này.",
                variant: "destructive"
            })
        } finally {
            setIsProcessing(null)
            setUserToDelete(null)
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Độc Giả</h1>
                    <p className="text-muted-foreground mt-1">
                        Theo dõi tài khoản, phân quyền, cấm và xóa người dùng.
                    </p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm theo tên hoặc email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Danh sách Tài Khoản ({filteredUsers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                                <tr>
                                    <th className="px-4 py-3 font-medium rounded-tl-lg">Người Dùng</th>
                                    <th className="px-4 py-3 font-medium">Trạng Thái</th>
                                    <th className="px-4 py-3 font-medium">Ngày Tham Gia</th>
                                    <th className="px-4 py-3 font-medium">Vai Trò</th>
                                    <th className="px-4 py-3 font-medium rounded-tr-lg">Chức Năng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((u) => {
                                    const roleInfo = getRoleInfo(u.role)
                                    const RoleIcon = roleInfo.icon
                                    const isSelf = u.user_id === user?.id
                                    const isSuperAdmin = callerRole === 'SUPER_ADMIN'
                                    const canManage = isSuperAdmin && !isSelf
                                    return (
                                        <tr key={u.user_id} className={`hover:bg-muted/20 transition-colors ${u.is_banned ? 'opacity-60' : ''}`}>
                                            <td className="px-4 py-4 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{u.full_name}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">{u.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {u.is_banned ? (
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 w-fit flex items-center gap-1">
                                                        Bị Khóa
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-500 w-fit flex items-center gap-1">
                                                        Hoạt Động
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {new Date(u.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-4">
                                                {isSelf || !isSuperAdmin ? (
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center w-fit gap-1 ${roleInfo.color}`}>
                                                        <RoleIcon className="h-3 w-3" />
                                                        {roleInfo.label}
                                                    </span>
                                                ) : (
                                                    <Select 
                                                        value={u.role || 'READER'} 
                                                        onValueChange={(newRole) => changeUserRole(u.user_id, newRole)}
                                                        disabled={isProcessing === u.user_id}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ROLE_OPTIONS.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        <opt.icon className="h-3 w-3" />
                                                                        {opt.label}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {isSuperAdmin && !isSelf ? (
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        variant={u.is_banned ? "outline" : "destructive"} 
                                                        size="sm"
                                                        onClick={() => toggleBanStatus(u.user_id, !!u.is_banned)}
                                                        disabled={isProcessing === u.user_id}
                                                        className={!u.is_banned ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : ''}
                                                        title={u.is_banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                    >
                                                        {isProcessing === u.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : (u.is_banned ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />)}
                                                    </Button>
                                                    <AlertDialog open={userToDelete === u.user_id} onOpenChange={(open) => !open && setUserToDelete(null)}>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="sm"
                                                                disabled={isProcessing === u.user_id}
                                                                onClick={() => setUserToDelete(u.user_id)}
                                                                title="Xóa vĩnh viễn"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Hành động này không thể hoàn tác. Việc này sẽ xóa hoàn toàn tài khoản <strong>{u.full_name}</strong> và dữ liệu liên quan khỏi hệ thống.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    className="bg-red-500 hover:bg-red-600 text-white"
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        deleteUser(u.user_id)
                                                                    }}
                                                                >
                                                                    {isProcessing === u.user_id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                                    Xóa Vĩnh Viễn
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Không tìm thấy dữ liệu người dùng.
                            </div>
                        )}
                        <PaginationControls 
                            currentPage={currentPage} 
                            totalItems={filteredUsers.length} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
