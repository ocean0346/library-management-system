'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { Plus, Trash2, Pencil, Tags, Check, X as XIcon, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
export default function CategoryManagement() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [isAdmin, setIsAdmin] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Edit category state
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const fetchCategories = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true })
            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast({
                title: "Lỗi",
                description: "Không thể lấy danh sách thể loại.",
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
            fetchCategories()
        }
        checkAccess()
    }, [user, authLoading, router, fetchCategories])
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return
        setIsSubmitting(true)
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{ name: newCategoryName.trim() }])
                .select()
                .single()
            if (error) {
                if (error.code === '23505') { 
                    throw new Error("Tên thể loại này đã tồn tại!")
                }
                throw error
            }
            toast({
                title: "Thành công",
                description: `Đã thêm thể loại "${data.name}"`,
            })
            setNewCategoryName('')
            setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)))
        } catch (error: any) {
            toast({
                title: "Thất bại",
                description: error.message || "Không thể thêm thể loại mới.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa thể loại "${name}" không? Các sách thuộc thể loại này sẽ bị gỡ phân loại.`)) return
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('category_id', id)
            if (error) throw error
            toast({
                title: "Đã Xóa",
                description: `Đã xóa thể loại ${name}`,
            })
            setCategories(prev => prev.filter(c => c.category_id !== id))
        } catch (error) {
            console.error('Error deleting category:', error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa thể loại này.",
                variant: "destructive"
            })
        }
    }
    const startEdit = (cat: any) => {
        setEditingId(cat.category_id)
        setEditName(cat.name)
    }
    const cancelEdit = () => {
        setEditingId(null)
        setEditName('')
    }
    const saveEdit = async (id: number) => {
        if (!editName.trim()) return
        setIsSavingEdit(true)
        try {
            const { error, data } = await supabase
                .from('categories')
                .update({ name: editName.trim() })
                .eq('category_id', id)
                .select()
                .single()
            if (error) {
                if (error.code === '23505') throw new Error("Tên thể loại này đã tồn tại!")
                throw error
            }
            setCategories(prev => prev.map(c => c.category_id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name)))
            setEditingId(null)
            toast({
                title: "Thành công",
                description: "Cập nhật tên thể loại thành công",
            })
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Lỗi khi cập nhật",
                variant: "destructive"
            })
        } finally {
            setIsSavingEdit(false)
        }
    }
    if (authLoading || isLoading) {
        return <div className="flex h-[60vh] items-center justify-center"><Loading size="lg" /></div>
    }
    if (!isAdmin) return null
    return (
        <div className="container max-w-5xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Quản Lý Danh Mục</h1>
                <p className="text-muted-foreground mt-1">
                    Thêm, sửa, hoặc xóa các chủ đề và thể loại sách trong hệ thống.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Plus className="h-5 w-5 text-primary" />
                            Thêm Thể Loại Mới
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên thể loại</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Ví dụ: Khoa học viễn tưởng" 
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    maxLength={100}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={!newCategoryName.trim() || isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tags className="mr-2 h-4 w-4" />}
                                Thêm Mới
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                {}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Danh Sách Hiện Tại</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                Chưa có thể loại nào.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {categories.map(cat => (
                                    <div key={cat.category_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 rounded-xl border bg-muted/20 hover:bg-muted/50 transition-colors gap-3">
                                        {}
                                        {editingId === cat.category_id ? (
                                            <div className="flex-1 flex items-center gap-2 w-full">
                                                <Input 
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="flex-1"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={() => saveEdit(cat.category_id)} disabled={isSavingEdit || !editName.trim()}>
                                                    {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={cancelEdit}>
                                                    <XIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 font-medium">{cat.name}</div>
                                                <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                                                        <Pencil className="h-4 w-4 mr-1 sm:mr-0 lg:mr-1" />
                                                        <span className="inline sm:hidden lg:inline">Sửa</span>
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCategory(cat.category_id, cat.name)}>
                                                        <Trash2 className="h-4 w-4 mr-1 sm:mr-0 lg:mr-1" />
                                                        <span className="inline sm:hidden lg:inline">Xóa</span>
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
