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
import { Calendar, User, Buildings as Building2, Spinner as Loader2, ArrowLeft, Pencil, Trash as Trash2, Download, FileText, HardDrive, BookOpenText as BookOpen, Star, Heart, Bookmark } from '@phosphor-icons/react'
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loading } from '@/components/ui/loading'
import { useCoins, FREE_CHAPTERS } from '@/hooks/useCoins'
import UnlockChapterButton from '@/components/coins/UnlockChapterButton'
import { Coins, LockKey as Lock } from '@phosphor-icons/react'
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
    const [relatedBooks, setRelatedBooks] = useState<Book[]>([])
    const [chapters, setChapters] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [lastReadChapter, setLastReadChapter] = useState<number | null>(null)
    const [isFavorited, setIsFavorited] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [isInteractionLoading, setIsInteractionLoading] = useState(false)
    const { isChapterLocked, fetchUnlockedContent, balance } = useCoins()
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
                    .select('role')
                    .eq('user_id', user.id)
                    .single()
                if (data?.role === 'ADMIN' || data?.role === 'SUPER_ADMIN') {
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
            let related: Book[] = [];
            if (data?.category_id) {
                const { data: catRelated } = await supabase
                    .from('books')
                    .select('*')
                    .eq('category_id', data.category_id)
                    .neq('book_id', bookId)
                    .limit(5)
                if (catRelated) related = catRelated;
            }
            if (related.length === 0) {
                const { data: anyRelated } = await supabase
                    .from('books')
                    .select('*')
                    .neq('book_id', bookId)
                    .order('created_at', { ascending: false })
                    .limit(5)
                if (anyRelated) related = anyRelated;
            }
            setRelatedBooks(related)
            if (user) {
                const [favRes, saveRes, progressRes] = await Promise.all([
                    supabase.from('user_favorites').select('book_id').eq('user_id', user.id).eq('book_id', bookId).single(),
                    supabase.from('user_saved_books').select('book_id').eq('user_id', user.id).eq('book_id', bookId).single(),
                    supabase.from('user_reading_progress').select('chapter_number').eq('user_id', user.id).eq('book_id', bookId).single()
                ])
                if (favRes.data) setIsFavorited(true)
                if (saveRes.data) setIsSaved(true)
                if (progressRes.data) setLastReadChapter(progressRes.data.chapter_number)
            }
            const { data: chaps } = await supabase.from('chapters').select('chapter_number, title, is_free').eq('book_id', bookId).order('chapter_number', { ascending: true })
            setChapters(chaps || [])
            if (user) {
                await fetchUnlockedContent(bookId)
            }
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
        if (chapters.length > 0) {
            router.push(`/books/${bookId}/read/${lastReadChapter || 1}`)
            return
        }
        if (!book?.file_url) {
            toast({ title: "Thông Báo", description: "Truyện / Sách này chưa có nội dung được đăng.", variant: "default" })
            return
        }
        router.push(`/books/${bookId}/read`)
    }
    const handleToggleFavorite = async () => {
        if (!user) {
            toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để thực hiện tính năng này." })
            router.push(`/login?redirect=/books/${bookId}`)
            return
        }
        setIsInteractionLoading(true)
        try {
            if (isFavorited) {
                await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('book_id', bookId)
                setIsFavorited(false)
                toast({ title: "Đã hủy Yêu thích" })
            } else {
                await supabase.from('user_favorites').insert({ user_id: user.id, book_id: bookId })
                setIsFavorited(true)
                toast({ title: "Đã thêm vào danh sách Yêu thích!", description: "Bạn có thể xem lại trong hồ sơ cá nhân." })
            }
        } catch (error) {
            toast({ title: "Lỗi", description: "Thao tác thất bại, vui lòng thử lại.", variant: "destructive" })
        } finally {
            setIsInteractionLoading(false)
        }
    }
    const handleToggleSave = async () => {
        if (!user) {
            toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để thực hiện tính năng này." })
            router.push(`/login?redirect=/books/${bookId}`)
            return
        }
        setIsInteractionLoading(true)
        try {
            if (isSaved) {
                await supabase.from('user_saved_books').delete().eq('user_id', user.id).eq('book_id', bookId)
                setIsSaved(false)
                toast({ title: "Đã xóa khỏi danh sách Lưu" })
            } else {
                await supabase.from('user_saved_books').insert({ user_id: user.id, book_id: bookId })
                setIsSaved(true)
                toast({ title: "Đã lưu truyện thành công!", description: "Bạn có thể tìm thấy trong góc Tủ Sách." })
            }
        } catch (error) {
            toast({ title: "Lỗi", description: "Thao tác thất bại, vui lòng thử lại.", variant: "destructive" })
        } finally {
            setIsInteractionLoading(false)
        }
    }
    const handleDelete = async () => {
        if (!isAdmin || !book) return
        setIsDeleting(true)
        try {
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
                {}
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
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                {lastReadChapter 
                                    ? (book.file_type === 'WEBNOVEL' || chapters.length > 0 ? `Đọc Tiếp Chương ${lastReadChapter}` : 'Tiếp Tục Đọc') 
                                    : 'Đọc Ngay'}
                            </Button>
                            {}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button 
                                    variant="outline" 
                                    disabled={isInteractionLoading}
                                    onClick={handleToggleFavorite} 
                                    className={`w-full ${isFavorited ? "text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200" : ""}`}
                                >
                                    <Heart className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                                    {isFavorited ? 'Đã Thích' : 'Yêu Thích'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    disabled={isInteractionLoading}
                                    onClick={handleToggleSave} 
                                    className={`w-full ${isSaved ? "text-[#09ADAA] hover:text-[#09ADAA]/80 bg-[#09ADAA]/10 hover:bg-[#09ADAA]/20 border-[#09ADAA]/30" : ""}`}
                                >
                                    <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                                    {isSaved ? 'Đã Lưu' : 'Lưu Lại'}
                                </Button>
                            </div>
                            {}
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
                {}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-3xl">{book.title}</CardTitle>
                        <CardDescription className="text-lg">
                            bởi {book.author}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {}
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
                                <div className="flex items-start space-x-2">
                                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <span className="text-muted-foreground mt-0.5">Thể Loại:</span>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            {(book.categories as any)?.name || 'Chưa Phân Loại'}
                                        </Badge>
                                        {book.tags && book.tags.map((tag, idx) => (
                                            <Link key={idx} href={`/books?tag=${encodeURIComponent(tag)}`}>
                                                <Badge variant="secondary" className="hover:bg-primary/20 cursor-pointer">
                                                    {tag}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Định Dạng:</span>
                                    <span>{book.file_type?.toUpperCase() || 'Tài Liệu Số'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Dung lượng Tệp:</span>
                                    <span>{book.file_size_bytes ? `${(book.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : 'Không xác định'}</span>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        {}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Giới Thiệu Nội Dung</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {book.description || 'Chưa có mô tả cho cuốn sách này.'}
                            </p>
                        </div>
                        <Separator />
                        {}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Danh Sách Chương Dạng Chữ
                                    <Badge variant="secondary" className="ml-2">{chapters.length} Chương</Badge>
                                </h3>
                                {(book.coin_price ?? 0) > 0 && chapters.some(c => !c.is_free) && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Lock className="h-3.5 w-3.5" />
                                        <span>Một số chương yêu cầu mua bằng xu</span>
                                    </div>
                                )}
                            </div>
                            {chapters.length > 0 ? (
                                <div className="bg-muted/20 border rounded-lg max-h-[300px] overflow-y-auto">
                                    <div className="divide-y">
                                        {chapters.map(chap => {
                                            const coinPrice = book.coin_price ?? 0
                                            const locked = isChapterLocked(bookId, chap.chapter_number, coinPrice, chap.is_free)
                                            return (
                                                <div 
                                                    key={chap.chapter_number} 
                                                    className={`p-4 transition-colors flex justify-between items-center group ${locked ? 'opacity-80' : 'hover:bg-muted/50 cursor-pointer'}`}
                                                    onClick={() => !locked && router.push(`/books/${bookId}/read/${chap.chapter_number}`)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {locked && <Lock className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                                                        <span className="font-medium mr-2">Chương {chap.chapter_number}{chap.title ? ':' : ''}</span>
                                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{chap.title}</span>
                                                    </div>
                                                    {locked ? (
                                                        <UnlockChapterButton
                                                            bookId={bookId}
                                                            chapterNumber={chap.chapter_number}
                                                            coinPrice={coinPrice}
                                                            isLocked={locked}
                                                            onUnlocked={() => fetchUnlockedContent(bookId)}
                                                        />
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Đọc <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Book Reviews */}
            <BookReviews bookId={bookId} isAdmin={isAdmin} />
            {/* Có thể bạn muốn đọc thêm */}
            {relatedBooks.length > 0 && (
                <div className="mt-12 bg-card rounded-xl border border-border shadow-sm p-6 overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-border/50 pb-3 mb-6">
                        <div className="bg-[#09ADAA] h-8 w-8 rounded flex items-center justify-center shrink-0">
                            <Star weight="fill" className="text-white h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">CÓ THỂ BẠN MUỐN ĐỌC THÊM</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        {relatedBooks.slice(0, 5).map((relatedBook) => (
                            <Link 
                                key={relatedBook.book_id} 
                                href={`/books/${relatedBook.book_id}`}
                                className="flex gap-4 group hover:bg-muted/30 p-2 rounded-lg transition-colors border border-transparent hover:border-border/50"
                            >
                                <div className="w-16 h-20 md:w-20 md:h-24 shrink-0 rounded-md overflow-hidden relative border border-border">
                                    <Image 
                                        src={relatedBook.cover_image_url || '/images/placeholder.jpg'} 
                                        alt={relatedBook.title} 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col py-1">
                                    <h4 className="font-semibold text-sm md:text-base group-hover:text-[#09ADAA] transition-colors line-clamp-1">{relatedBook.title} - {relatedBook.author}</h4>
                                    {(relatedBook as any).created_at && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date((relatedBook as any).created_at), 'MMMM dd, yyyy')}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
