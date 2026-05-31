'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, FloppyDisk as Save, Spinner as Loader2, Trash as Trash2, Pencil as Edit } from '@phosphor-icons/react'
import { Loading } from '@/components/ui/loading'
import dynamic from 'next/dynamic'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor').then(mod => mod.RichTextEditor), { ssr: false })
export default function ManageChaptersPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { toast } = useToast()
    const [isAdmin, setIsAdmin] = useState(false)
    const [book, setBook] = useState<any>(null)
    const [chapters, setChapters] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [currentChapterId, setCurrentChapterId] = useState<string | null>(null)
    const [chapterNumber, setChapterNumber] = useState<number | ''>('')
    const [chapterTitle, setChapterTitle] = useState('')
    const [chapterContent, setChapterContent] = useState('')
    const [isFree, setIsFree] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null)
    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            // Check Admin
            const { data: userData } = await supabase.from('users').select('role').eq('user_id', user?.id).single()
            if (!userData?.role || (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN')) {
                toast({ title: "Từ chối truy cập", description: "Bạn không có quyền quản lý chương", variant: "destructive" })
                router.push(`/books/${id}`)
                return
            }
            setIsAdmin(true)
            const { data: bookData } = await supabase.from('books').select('*').eq('book_id', id).single()
            setBook(bookData)
            const { data: chaptersData } = await supabase.from('chapters').select('*').eq('book_id', id).order('chapter_number', { ascending: true })
            setChapters(chaptersData || [])
            const nextChapNum = chaptersData && chaptersData.length > 0 ? (chaptersData[chaptersData.length - 1].chapter_number + 1) : 1
            setChapterNumber(nextChapNum)
            setIsFree(nextChapNum <= 10)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setIsLoading(false)
        }
    }, [id, user, router, toast])
    useEffect(() => {
        if (!authLoading && user) {
            fetchData()
        } else if (!authLoading && !user) {
            router.push('/login')
        }
    }, [authLoading, user, fetchData])
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof chapterNumber !== 'number' || !chapterContent.trim()) {
            toast({ title: "Lỗi", description: "Vui lòng nhập số chương và nội dung chương", variant: "destructive" })
            return
        }
        const finalTitle = chapterTitle.trim() || null
        setIsSubmitting(true)
        try {
            if (isEditing && currentChapterId) {
                const { error } = await supabase.from('chapters').update({
                    chapter_number: chapterNumber,
                    title: finalTitle,
                    content_text: chapterContent,
                    is_free: isFree
                }).eq('chapter_id', currentChapterId)
                if (error) throw error
                toast({ title: "Thành công", description: "Đã cập nhật chương." })
            } else {
                const { error } = await supabase.from('chapters').insert({
                    book_id: id,
                    chapter_number: chapterNumber,
                    title: finalTitle,
                    content_text: chapterContent,
                    is_free: isFree
                })
                if (error) throw error
                toast({ title: "Thành công", description: "Đã thêm chương mới." })
            }
            setIsEditing(false)
            setCurrentChapterId(null)
            setChapterTitle('')
            setChapterContent('')
            const nextChap = chapters.length > 0 ? chapters[chapters.length-1].chapter_number + 1 : 1
            setChapterNumber(nextChap)
            setIsFree(nextChap <= 10)
            fetchData() // Refresh list
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleEdit = (chapter: any) => {
        setIsEditing(true)
        setCurrentChapterId(chapter.chapter_id)
        setChapterNumber(chapter.chapter_number)
        setChapterTitle(chapter.title || '')
        setChapterContent(chapter.content_text)
        setIsFree(chapter.is_free ?? false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const confirmDelete = async () => {
        if (!deleteChapterId) return
        try {
            const { error } = await supabase.from('chapters').delete().eq('chapter_id', deleteChapterId)
            if (error) throw error
            toast({ title: "Thành công", description: "Đã xóa chương." })
            fetchData()
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.message, variant: "destructive" })
        } finally {
            setDeleteChapterId(null)
        }
    }
    if (isLoading || authLoading) return <div className="flex justify-center py-20"><Loading size="lg" /></div>
    return (
        <div className="container max-w-5xl mx-auto py-8">
            <Button variant="ghost" onClick={() => router.push(`/books/${id}`)} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Trở về Trang Sách
            </Button>
            <div className="grid md:grid-cols-[1fr_350px] gap-8 items-start">
                {}
                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-background border-b border-primary/10 mb-4 pb-6">
                        <CardTitle className="text-2xl">{isEditing ? 'Chỉnh Sửa Chương' : 'Thêm Chương Mới'}</CardTitle>
                        <CardDescription>
                            Tác phẩm: <strong className="text-foreground">{book?.title}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2 col-span-1">
                                    <Label>Số Chương</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={chapterNumber}
                                        onChange={(e) => {
                                            const num = parseInt(e.target.value) || ''
                                            setChapterNumber(num)
                                            if (!isEditing && typeof num === 'number') {
                                                setIsFree(num <= 10)
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2 col-span-3">
                                    <Label>Tựa đề Chương</Label>
                                    <Input
                                        placeholder="Nhập tựa đề chương (không bắt buộc)"
                                        value={chapterTitle}
                                        onChange={(e) => setChapterTitle(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="is-free" checked={isFree} onCheckedChange={setIsFree} />
                                <Label htmlFor="is-free">Chương Miễn Phí (Người đọc không cần trả xu)</Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Cỗ máy Biên soạn Nội dung Chương (Rich Text)</Label>
                                <RichTextEditor
                                    content={chapterContent}
                                    onChange={setChapterContent}
                                    placeholder="Soạn thảo nội dung chương ở đây... hỗ trợ in đậm, nghiêng, căn lề, chèn URL ảnh."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                {isEditing && (
                                    <Button type="button" variant="outline" onClick={() => {
                                        const nextChap = chapters.length > 0 ? chapters[chapters.length-1].chapter_number + 1 : 1
                                        setIsEditing(false); setCurrentChapterId(null); setChapterTitle(''); setChapterContent(''); setIsFree(nextChap <= 10); setChapterNumber(nextChap);
                                    }}>Hủy Sửa</Button>
                                )}
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#02FF73] to-[#09ADAA] text-black">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isEditing ? 'Cập Nhật Chương' : 'Đăng Chương Kế Tiếp'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                {}
                <Card className="sticky top-24 shadow-md bg-muted/20">
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-lg">Danh Sách Chương Đã Đăng</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                        {chapters.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">Chưa có chương nào được đăng.</div>
                        ) : (
                            <div className="divide-y">
                                {chapters.map(chap => (
                                    <div key={chap.chapter_id} className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col gap-1 w-[70%]">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">Chương {chap.chapter_number}</span>
                                                {chap.is_free && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">Miễn phí</span>}
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{chap.title}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(chap)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteChapterId(chap.chapter_id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {}
            <AlertDialog open={!!deleteChapterId} onOpenChange={(open) => !open && setDeleteChapterId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa chương</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa chương này? Toàn bộ nội dung chương sẽ bị mất vĩnh viễn và không thể khôi phục.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa chương
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
