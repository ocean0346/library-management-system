'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, BookOpen, Sparkles, TrendingUp, ChevronRight, User, Star, ArrowRight, Award } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
export default function Home() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [recentBooks, setRecentBooks] = useState<Book[]>([])
    const [popularBooks, setPopularBooks] = useState<Book[]>([])
    const [topRatedBooks, setTopRatedBooks] = useState<Book[]>([])
    const [topCategories, setTopCategories] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        const fetchHomepageData = async () => {
            setIsLoading(true)
            try {
                // Fetch 4 most recent books
                const { data: recent } = await supabase
                    .from('books')
                    .select('*, categories(name), chapters(chapter_number, title, created_at)')
                    .order('created_at', { ascending: false })
                    .limit(9)
                if (recent) setRecentBooks(recent as Book[])
                const { data: catsData } = await supabase
                    .from('categories')
                    .select('name, books(count)')
                if (catsData) {
                    const sortedCats = catsData.sort((a: any, b: any) => (b.books?.[0]?.count || 0) - (a.books?.[0]?.count || 0))
                    setTopCategories(sortedCats.slice(0, 3).map(c => c.name))
                }
                const { data: popular } = await supabase
                    .from('books')
                    .select('*, categories(name), chapters(chapter_number, title, created_at)')
                    .order('views_count', { ascending: false, nullsFirst: false })
                    .limit(9)
                if (popular) setPopularBooks(popular as Book[])
                const { data: allBooksForRating } = await supabase
                    .from('books')
                    .select('*, categories(name), chapters(chapter_number, title, created_at)')
                const { data: reviewStats } = await supabase
                    .from('reviews')
                    .select('book_id, rating')
                if (allBooksForRating) {
                    const ratingMap: Record<string, { total: number; count: number }> = {}
                    if (reviewStats) {
                        reviewStats.forEach((r: any) => {
                            if (!ratingMap[r.book_id]) {
                                ratingMap[r.book_id] = { total: 0, count: 0 }
                            }
                            ratingMap[r.book_id].total += r.rating
                            ratingMap[r.book_id].count += 1
                        })
                    }
                    const rated = allBooksForRating
                        .filter((b: any) => ratingMap[b.book_id])
                        .map((b: any) => ({
                            ...b,
                            average_rating: Math.round((ratingMap[b.book_id].total / ratingMap[b.book_id].count) * 10) / 10,
                            _count: ratingMap[b.book_id].count
                        }))
                        .sort((a: any, b: any) => b.average_rating - a.average_rating || b._count - a._count)
                    const unrated = allBooksForRating
                        .filter((b: any) => !ratingMap[b.book_id])
                        .map((b: any) => ({ ...b, average_rating: 0 }))
                    const combined = [...rated, ...unrated].slice(0, 9) as Book[]
                    setTopRatedBooks(combined)
                }
            } catch (error) {
                console.error("Error fetching homepage data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchHomepageData()
    }, [])
    return (
        <div className="flex flex-col min-h-screen">
            {}
            <section className="relative pt-16 pb-16 lg:pt-20 lg:pb-24 overflow-hidden w-full flex items-center justify-center min-h-[60vh]">
                {}
                <div className="absolute inset-0 bg-background">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_110%)]" />
                    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#02FF73]/20 rounded-full blur-[120px] opacity-70 animate-pulse" />
                    <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-[#09ADAA]/20 rounded-full blur-[100px] opacity-60" />
                </div>
                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-md mb-8 transition-all hover:bg-primary/20 cursor-default">
                        <Sparkles className="w-4 h-4 mr-2" /> Thư viện Sách Chọn Lọc
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
                        Thư Viện Tài Liệu <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#02FF73] via-[#09ADAA] to-blue-500 bg-300% animate-gradient">
                            Online Hàng Đầu
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground/90 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Thư viện của chúng tôi cung cấp hàng nghìn tài liệu và sách điện tử công khai.
                        Đọc trực tiếp trên trình duyệt, không giới hạn, không cần đăng nhập cầu kỳ.
                    </p>
                    <div className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 px-4">
                        <div className="relative w-full group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center bg-background rounded-full border shadow-xl">
                                <Search className="absolute left-6 text-muted-foreground h-6 w-6" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm cuốn sách tiếp theo của bạn..."
                                    className="w-full pl-16 pr-6 py-8 text-xl rounded-full border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && router.push(`/books?q=${encodeURIComponent(searchQuery.trim())}`)}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full sm:w-auto bg-gradient-to-r from-[#02FF73] to-[#09ADAA] hover:brightness-110 text-black font-bold py-8 px-10 text-lg rounded-full shadow-lg shadow-[#02FF73]/20 transition-all hover:scale-105 active:scale-95 border-none"
                            onClick={() => searchQuery.trim() && router.push(`/books?q=${encodeURIComponent(searchQuery.trim())}`)}
                        >
                            Tìm Kiếm
                        </Button>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <p className="text-sm font-medium text-muted-foreground">Phổ biến:</p>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {(topCategories.length > 0 ? topCategories : ['Tiểu thuyết', 'Khoa học', 'Lịch sử']).map(tag => (
                                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-black transition-colors" onClick={() => router.push(`/books?category=${encodeURIComponent(tag)}`)}>
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {}
            <div className="flex-1 w-full bg-muted/10 relative z-20 pb-24">
                <div className="container mx-auto px-4 -mt-10 lg:-mt-20 relative z-30 space-y-24">
                    {}
                    <section className="bg-background/80 backdrop-blur-xl border shadow-2xl shadow-black/5 rounded-3xl p-6 lg:p-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#02FF73]/20 flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-[#02FF73]" />
                                    </div>
                                    Sách Mới Cập Nhật
                                </h2>
                                <p className="text-muted-foreground mt-3 text-lg">Những tựa sách vừa được đưa lên thư viện tuần này</p>
                            </div>
                            <Button variant="outline" className="rounded-full shadow-sm hover:border-primary/50 hover:bg-primary/5" asChild>
                                <Link href="/books">
                                    Khám phá thêm <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        {isLoading ? (
                            <div className="flex flex-wrap gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[200px] flex-auto w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 bg-muted/40 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : recentBooks.length > 0 ? (
                            <div className="flex flex-wrap gap-6">
                                {recentBooks.slice(0, 9).map((book) => (
                                    <div key={book.book_id} className="flex-auto w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground bg-muted/20 border border-dashed rounded-2xl flex flex-col items-center justify-center">
                                <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg">Chưa có dữ liệu sách mới</p>
                            </div>
                        )}
                    </section>
                    {}
                    <section className="bg-background/80 backdrop-blur-xl border shadow-2xl shadow-black/5 rounded-3xl p-6 lg:p-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                    </div>
                                    Sách Nổi Bật Nhất
                                </h2>
                                <p className="text-muted-foreground mt-3 text-lg">Những tác phẩm được tìm kiếm và xem nhiều nhất</p>
                            </div>
                            <Button variant="outline" className="rounded-full hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors" asChild>
                                <Link href="/books?sort=views_count">
                                    Xem bảng xếp hạng <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        {isLoading ? (
                            <div className="flex flex-wrap gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[200px] flex-auto w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 bg-muted/40 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : popularBooks.length > 0 ? (
                            <div className="flex flex-wrap gap-6">
                                {popularBooks.map((book) => (
                                    <div key={book.book_id} className="flex-auto w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground bg-muted/20 border border-dashed rounded-2xl flex flex-col items-center justify-center">
                                <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg">Chưa có đủ dữ liệu</p>
                            </div>
                        )}
                    </section>
                    {}
                    <section className="bg-background/80 backdrop-blur-xl border shadow-2xl shadow-black/5 rounded-3xl p-6 lg:p-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    Sách Được Đánh Giá Cao
                                </h2>
                                <p className="text-muted-foreground mt-3 text-lg">Được cộng đồng độc giả yêu thích và đánh giá 5 sao</p>
                            </div>
                            <Button variant="outline" className="rounded-full hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors" asChild>
                                <Link href="/books?sort=top_rated">
                                    Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        {isLoading ? (
                            <div className="flex flex-wrap gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[200px] flex-auto w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 bg-muted/40 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : topRatedBooks.length > 0 ? (
                            <div className="flex flex-wrap gap-6">
                                {topRatedBooks.map((book) => (
                                    <div key={book.book_id} className="flex-auto w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground bg-muted/20 border border-dashed rounded-2xl flex flex-col items-center justify-center">
                                <Star className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg">Chưa có đánh giá nào</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
