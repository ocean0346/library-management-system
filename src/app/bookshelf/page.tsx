'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, Heart, Books as LibrarySquare, Spinner as Loader2, CaretLeft as ChevronLeft, CaretRight as ChevronRight } from '@phosphor-icons/react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
const ITEMS_PER_PAGE = 6
function PaginationControls({ currentPage, totalItems, onPageChange }: { currentPage: number, totalItems: number, onPageChange: (p: number) => void }) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    if (totalPages <= 1) return null
    return (
        <Pagination className="mt-8">
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
export default function BookshelfPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [savedBooks, setSavedBooks] = useState<Book[]>([])
    const [favoritedBooks, setFavoritedBooks] = useState<Book[]>([])
    const [historyBooks, setHistoryBooks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    // Pagination states
    const [historyPage, setHistoryPage] = useState(1)
    const [savedPage, setSavedPage] = useState(1)
    const [favoritesPage, setFavoritesPage] = useState(1)
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/bookshelf')
        }
    }, [user, authLoading, router])
    useEffect(() => {
        const fetchBookshelf = async () => {
            if (!user) return
            setIsLoading(true)
            try {
                // Fetch saved
                const { data: savedData } = await supabase
                    .from('user_saved_books')
                    .select('books(*, categories(name))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                if (savedData) {
                    // Filter out nulls if underlying book was deleted
                    setSavedBooks(savedData.map(item => item.books).filter(Boolean) as any)
                }
                // Fetch favorited
                const { data: favData } = await supabase
                    .from('user_favorites')
                    .select('books(*, categories(name))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                if (favData) {
                    setFavoritedBooks(favData.map(item => item.books).filter(Boolean) as any)
                }
                // Fetch history
                const { data: historyData } = await supabase
                    .from('user_reading_progress')
                    .select('*, books(*, categories(name))')
                    .eq('user_id', user.id)
                    .order('last_read_at', { ascending: false })
                    .limit(20)
                if (historyData) {
                    // For history we map the book and inject the chapter
                    const formattedHistory = historyData.map(item => ({
                        ...(item.books as any),
                        _progress_chapter: item.chapter_number,
                        _progress_date: item.last_read_at
                    })).filter(Boolean)
                    setHistoryBooks(formattedHistory)
                }
            } catch (error) {
                console.error("Error fetching bookshelf:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchBookshelf()
    }, [user])
    if (authLoading || (isLoading && user)) {
        return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }
    if (!user) return null
    return (
        <div className="container max-w-5xl mx-auto py-12 px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-8 border-b pb-6 border-border/50">
                <div className="bg-primary/10 p-3 rounded-2xl shadow-inner text-primary">
                    <LibrarySquare className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tủ Sách Cá Nhân</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Nơi lưu giữ các tác phẩm bạn yêu thích</p>
                </div>
            </div>
            <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full sm:w-[500px] grid-cols-3 mb-8 h-12">
                    <TabsTrigger value="history" className="text-base gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                        <LibrarySquare className="h-4 w-4" />
                        Lịch Sử Đọc
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="text-base gap-2 data-[state=active]:bg-[#09ADAA] data-[state=active]:text-white">
                        <Bookmark className="h-4 w-4" />
                        Đã Lưu
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="text-base gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                        <Heart className="h-4 w-4" />
                        Yêu Thích
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="history" className="mt-0 outline-none min-h-[400px]">
                    {historyBooks.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl mx-auto w-full max-w-2xl">
                            <LibrarySquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Chưa Có Lịch Sử Đọc</h3>
                            <p className="text-muted-foreground mb-6">Bạn chưa đọc cuốn truyện nào gần đây.</p>
                            <button onClick={() => router.push('/books')} className="text-sm font-medium text-primary hover:underline">
                                Khám phá kho truyện ngay &rarr;
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {historyBooks.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE).map((book, idx) => (
                                    <div key={book.book_id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                            <PaginationControls 
                                currentPage={historyPage} 
                                totalItems={historyBooks.length} 
                                onPageChange={setHistoryPage} 
                            />
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="saved" className="mt-0 outline-none min-h-[400px]">
                    {savedBooks.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl mx-auto w-full max-w-2xl">
                            <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Chưa Có Truyện Nào Được Lưu</h3>
                            <p className="text-muted-foreground mb-6">Bạn chưa ghim cuốn truyện nào vào tủ sách.</p>
                            <button onClick={() => router.push('/books')} className="text-sm font-medium text-primary hover:underline">
                                Khám phá kho truyện ngay &rarr;
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {savedBooks.slice((savedPage - 1) * ITEMS_PER_PAGE, savedPage * ITEMS_PER_PAGE).map((book, idx) => (
                                    <div key={book.book_id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                            <PaginationControls 
                                currentPage={savedPage} 
                                totalItems={savedBooks.length} 
                                onPageChange={setSavedPage} 
                            />
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="favorites" className="mt-0 outline-none min-h-[400px]">
                    {favoritedBooks.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl mx-auto w-full max-w-2xl">
                            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Chưa Có Truyện Yêu Thích</h3>
                            <p className="text-muted-foreground mb-6">Hãy thả tim cho các truyện bạn tâm đắc để chúng ưu tiên xuất hiện ở đây.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {favoritedBooks.slice((favoritesPage - 1) * ITEMS_PER_PAGE, favoritesPage * ITEMS_PER_PAGE).map((book, idx) => (
                                    <div key={book.book_id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                            <PaginationControls 
                                currentPage={favoritesPage} 
                                totalItems={favoritedBooks.length} 
                                onPageChange={setFavoritesPage} 
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
