'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Book } from '@/types/book'
import BookReviews from '@/components/books/BookReviews'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Calendar,
    User,
    Building2,
    Loader2,
    ArrowLeft,
    Pencil,
    Trash2,
    Download,
    FileText,
    HardDrive,
    BookOpen
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loading } from '@/components/ui/loading'
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
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

export default function BookDetails() {
    const [book, setBook] = useState<Book | null>(null)
    const [chapters, setChapters] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAccessing, setIsAccessing] = useState(false)
    const [isReading, setIsReading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    const { toast } = useToast()
    const bookId = params.id as string

    useEffect(() => {
        const checkAdmin = async () => {
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('user_id', user.id)
                    .single()
                
                if (data?.is_admin) {
                    setIsAdmin(true)
                }
            }
        }
        
        checkAdmin()
    }, [user])

    const fetchBook = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('books')
                .select(`
                    *,
                    categories(name)
                `)
                .eq('book_id', bookId)
                .single()

            if (error) {
                console.error('Fetch error:', error);
                toast({
                    title: "Lỗi",
                    description: "Không thể lấy thông tin tác phẩm",
                    variant: "destructive",
                })
                return
            }
            setBook(data)

            // Luôn fetch chapters nếu có
            const { data: chaps } = await supabase.from('chapters').select('chapter_number, title').eq('book_id', bookId).order('chapter_number', { ascending: true })
            setChapters(chaps || [])
        } catch (error) {
            console.error('Fetch error:', error);
            toast({
                title: "Error",
                description: "Failed to fetch book details",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [bookId, toast])

    useEffect(() => {
        if (bookId) {
            fetchBook()
        }
    }, [bookId, fetchBook])

    const handleAccessDocument = async () => {
        if (chapters.length === 0 && (!book || !book.file_url)) {
            toast({
                title: "Lỗi",
                description: "Tài liệu này không có sẵn phần nội dung",
                variant: "destructive",
            })
            return
        }

        setIsAccessing(true)
        try {
            const { error } = await supabase.rpc('record_document_access', {
                p_organization_id: (book as any).organization_id || "00000000-0000-0000-0000-000000000000",
                p_book_id: bookId,
                p_user_id: user ? user.id : null
            })

            if (error) {
                console.error('Access error:', error)
            }

            if (chapters.length > 0) {
                router.push(`/books/${bookId}/read/1`)
                return
            }

            if (!book?.file_url) {
                toast({ title: "Thông Báo", description: "Truyện / Sách này chưa có nội dung được đăng.", variant: "default" })
                setIsAccessing(false)
                return
            }

            // Show embedded reader instead of opening new tab
            setIsReading(true)
            setTimeout(() => {
                const element = document.getElementById('embedded-reader')
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }, 100)
            
            toast({
                title: "Thành Công",
                description: "Đang tải tài liệu, vui lòng đợi...",
            })
        } catch (error) {
            console.error('Access error:', error)
            toast({
                title: "Error",
                description: "An unexpected error occurred while accessing the document",
                variant: "destructive",
            })
        } finally {
            setIsAccessing(false)
        }
    }

    const handleDelete = async () => {
        if (!isAdmin || !book) return

        setIsDeleting(true)
        try {
            // Documents don't have constraints like active loans
            // we can just delete it immediately


            const { error } = await supabase
                .from('books')
                .delete()
                .eq('book_id', bookId)

            if (error) throw error

            toast({
                title: "Success",
                description: "Book deleted successfully",
            })

            router.push('/books')
        } catch (error) {
            console.error('Delete error:', error)
            toast({
                title: "Error",
                description: "Failed to delete the book",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }



    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!book) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-2xl font-bold">Không Tìm Thấy Sách</h2>
                <p className="text-muted-foreground mt-2">
                    Cuốn sách bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
                </p>
                <Button onClick={() => router.push('/books')} className="mt-4">
                    Trở Lại Tủ Sách
                </Button>
            </div>
        )
    }



    return (
        <div className="container max-w-7xl mx-auto px-4">
            <Button
                variant="ghost"
                onClick={() => router.push('/books')}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trở Lại Tủ Sách
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Book Cover and Actions */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="relative aspect-2/3 w-full rounded-lg overflow-hidden mb-6">
                            <Image
                                src={book.cover_image_url || '/images/placeholder.jpg'}
                                alt={book.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="space-y-4">
                            <Badge
                                variant="default"
                                className="w-full justify-center py-1.5"
                            >
                                {book.file_type === 'WEBNOVEL' ? 'TRUYỆN CHỮ' : (book.file_type ? book.file_type.toUpperCase() : 'PDF')}
                            </Badge>
                            <Button
                                className="w-full bg-gradient-to-r from-primary to-[#09ADAA]"
                                onClick={handleAccessDocument}
                                disabled={isAccessing || isReading}
                            >
                                {isAccessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang mở...
                                    </>
                                ) : (
                                    <>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Đọc Ngay
                                    </>
                                )}
                            </Button>

                            {/* Admin/Librarian Actions */}
                            {isAdmin && (
                                <>
                                    <Separator className="my-4" />
                                    <Button
                                        variant="secondary"
                                        className="w-full mb-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500 hover:text-blue-600"
                                        onClick={() => router.push(`/books/${bookId}/chapters`)}
                                    >
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Quản Lý Chương
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => router.push(`/books/${bookId}/edit`)}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Sửa
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                    )}
                                                    Xóa
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Xóa Cuốn Sách Này?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bạn có chắc chắn muốn xóa sách &quot;{book.title}&quot;?
                                                        Thao tác này không thể hoàn tác và sẽ xóa tất cả bình luận liên quan.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Hủy Bỏ</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDelete}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Xác Nhận Xóa
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Book Details */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-3xl">{book.title}</CardTitle>
                        <CardDescription className="text-lg">
                            bởi {book.author}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Book Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">ISBN:</span>
                                    <span>{book.isbn || 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Nhà Xuất Bản:</span>
                                    <span>{book.publisher}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Ngày Xuất Bản:</span>
                                    <span>
                                        {book.publish_date && format(new Date(book.publish_date), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Thể Loại:</span>
                                    <span>{(book.categories as any)?.name || 'Chưa Phân Loại'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Định Dạng:</span>
                                    <span>{book.file_type?.toUpperCase() || 'Tài Liệu Số'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Kích Thước:</span>
                                    <span>{book.file_size_bytes ? `${(book.file_size_bytes).toFixed(2)} MB` : 'Không xác định'}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Book Description */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Giới Thiệu Nội Dung</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {book.description || 'Chưa có mô tả cho cuốn sách này.'}
                            </p>
                        </div>

                        <Separator />

                        {/* List of Chapters (All Formats) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Danh Sách Chương Dạng Chữ
                                <Badge variant="secondary" className="ml-2">{chapters.length} Chương</Badge>
                            </h3>
                            
                            {chapters.length > 0 ? (
                                <div className="bg-muted/20 border rounded-lg max-h-[300px] overflow-y-auto">
                                    <div className="divide-y">
                                        {chapters.map(chap => (
                                            <div 
                                                key={chap.chapter_number} 
                                                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center group"
                                                onClick={() => router.push(`/books/${bookId}/read/${chap.chapter_number}`)}
                                            >
                                                <div>
                                                    <span className="font-medium mr-2">Chương {chap.chapter_number}:</span>
                                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{chap.title}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Đọc <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Book Reviews */}
            <BookReviews bookId={bookId} isAdmin={isAdmin} />

            {/* Embedded Reader View */}
            {isReading && book.file_url && (
                <div id="embedded-reader" className="mt-12 mb-20 animate-fade-in-up scroll-mt-24">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Đang Đọc: {book.title}</CardTitle>
                            <Button variant="outline" onClick={() => setIsReading(false)}>
                                Đóng (Close)
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full h-[80vh] border rounded bg-muted/20">
                                <iframe 
                                    src={book.file_url} 
                                    className="w-full h-full rounded"
                                    title={`Reading ${book.title}`}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
