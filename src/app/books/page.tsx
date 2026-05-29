'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import SearchFilters from '@/components/books/SearchFilters'
import { PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Building2, Plus } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'

export default function BookCatalogPage() {
    return (
        <Suspense fallback={<div className="container py-10"><Loading /></div>}>
            <BookCatalog />
        </Suspense>
    )
}

function BookCatalog() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading: authLoading } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)

    const [books, setBooks] = useState<Book[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ? decodeURIComponent(searchParams.get('q')!) : '')
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')

    useEffect(() => {
        const q = searchParams.get('q')
        if (q !== null) {
            const decoded = decodeURIComponent(q)
            if (decoded !== searchTerm) {
                setSearchTerm(decoded)
            }
        } else if (q === null && searchTerm !== '') {
            setSearchTerm('')
        }
        const sort = searchParams.get('sort')
        if (sort !== null && sort !== sortBy) {
            setSortBy(sort)
        } else if (sort === null && sortBy !== 'created_at') {
            setSortBy('created_at')
        }
        const cat = searchParams.get('category')
        if (cat !== null && cat !== selectedCategory) {
            setSelectedCategory(decodeURIComponent(cat))
        } else if (cat === null && selectedCategory !== 'all') {
            setSelectedCategory('all')
        }
        const tag = searchParams.get('tag')
        if (tag !== null && tag !== selectedTag) {
            setSelectedTag(decodeURIComponent(tag))
        } else if (tag === null && selectedTag !== null) {
            setSelectedTag(null)
        }
    }, [searchParams])
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : 'all')
    const [selectedTag, setSelectedTag] = useState<string | null>(searchParams.get('tag') ? decodeURIComponent(searchParams.get('tag')!) : null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const booksPerPage = 12

    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('name')
                .order('name', { ascending: true })

            if (error) throw error
            // Remove duplicates
            const uniqueCategories = [...new Set(data.map(category => category.name))]
            setCategories(uniqueCategories)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }, [])

    const fetchBooks = useCallback(async () => {
        setIsLoading(true)
        try {
            // For top_rated, we need to fetch all matching books first, then sort client-side
            const isTopRated = sortBy === 'top_rated'

            let query = supabase
                .from('books')
                .select('*, categories(name), chapters(chapter_number, title, created_at)', { count: 'exact' })

            if (!isTopRated) {
                query = query.range((currentPage - 1) * booksPerPage, currentPage * booksPerPage - 1)
            }

            // Dynamic sorting
            if (sortBy === 'views_count') {
                query = query.order('views_count', { ascending: false, nullsFirst: false })
            } else if (sortBy === 'featured') {
                query = query.order('views_count', { ascending: false, nullsFirst: false })
                    .order('created_at', { ascending: false })
            } else if (sortBy === 'title') {
                query = query.order('title', { ascending: true })
            } else if (!isTopRated) {
                query = query.order('created_at', { ascending: false })
            }

            if (searchTerm) {
                const termToSearch = searchTerm.trim().toLowerCase()
                query = query.or(`title.ilike.%${termToSearch}%,author.ilike.%${termToSearch}%,isbn.ilike.%${termToSearch}%`)
            }

            if (selectedCategory && selectedCategory !== 'all') {
                const { data: categoryData } = await supabase
                    .from('categories')
                    .select('category_id')
                    .ilike('name', selectedCategory)
                    .limit(1)
                    .maybeSingle()

                if (categoryData) {
                    query = query.or(`category_id.eq.${categoryData.category_id},tags.cs.{"${selectedCategory}"}`)
                }
            }

            if (selectedTag) {
                const { data: tagCategoryData } = await supabase
                    .from('categories')
                    .select('category_id')
                    .ilike('name', selectedTag)
                    .limit(1)
                    .maybeSingle()

                if (tagCategoryData) {
                    query = query.or(`tags.cs.{"${selectedTag}"},category_id.eq.${tagCategoryData.category_id}`)
                } else {
                    query = query.contains('tags', [selectedTag])
                }
            }

            const { data, error, count } = await query

            if (error) throw error

            if (data) {
                // Always fetch reviews to calculate average rating for BookCard display
                const bookIds = data.map((b: any) => b.book_id)
                let reviews: any[] | null = null
                
                if (bookIds.length > 0) {
                    const { data: fetchedReviews, error: reviewsError } = await supabase
                        .from('reviews')
                        .select('book_id, rating')
                        .in('book_id', bookIds)
                    
                    if (!reviewsError) {
                        reviews = fetchedReviews
                    }
                }

                const ratingMap: Record<string, { total: number; count: number }> = {}
                if (reviews) {
                    reviews.forEach((r: any) => {
                        if (!ratingMap[r.book_id]) ratingMap[r.book_id] = { total: 0, count: 0 }
                        ratingMap[r.book_id].total += r.rating
                        ratingMap[r.book_id].count++
                    })
                }

                // Attach average_rating to each book
                const booksWithRating = data.map((b: any) => ({
                    ...b,
                    average_rating: ratingMap[b.book_id]
                        ? Math.round((ratingMap[b.book_id].total / ratingMap[b.book_id].count) * 10) / 10
                        : 0
                }))

                if (isTopRated) {
                    // Sort: rated books first (by avg desc), then unrated
                    const sorted = [...booksWithRating].sort((a: any, b: any) => {
                        const aHasRating = !!ratingMap[a.book_id]
                        const bHasRating = !!ratingMap[b.book_id]

                        if (aHasRating && !bHasRating) return -1
                        if (!aHasRating && bHasRating) return 1
                        if (!aHasRating && !bHasRating) return 0

                        if (b.average_rating !== a.average_rating) return b.average_rating - a.average_rating
                        return ratingMap[b.book_id].count - ratingMap[a.book_id].count
                    })

                    const totalCount = sorted.length
                    const paged = sorted.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage)
                    setBooks(paged as Book[])
                    setTotalPages(Math.ceil(totalCount / booksPerPage))
                } else {
                    setBooks(booksWithRating as Book[])
                    setTotalPages(Math.ceil((count || 0) / booksPerPage))
                }
            }
        } catch (error: any) {
            console.error('Error fetching books:', JSON.stringify(error, null, 2))
            console.error(error?.message)
            // Hiển thị tạm lỗi ra màn hình để debug
            if (typeof window !== 'undefined') {
                alert("Chi tiết lỗi: " + (error?.message || JSON.stringify(error)));
            }
        } finally {
            setIsLoading(false)
        }
    }, [currentPage, searchTerm, selectedCategory, sortBy, booksPerPage])
    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    useEffect(() => {
        fetchBooks()
    }, [fetchBooks])

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

        if (user) {
            checkAdmin()
        }
    }, [user])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        if (selectedTag) {
            setSelectedTag(null)
            const params = new URLSearchParams()
            if (value) params.set('q', value)
            if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
            router.replace(`/books?${params.toString()}`)
        }
        setCurrentPage(1)
    }

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
        if (selectedTag) {
            setSelectedTag(null)
            const params = new URLSearchParams()
            if (searchTerm) params.set('q', searchTerm)
            if (value && value !== 'all') params.set('category', value)
            router.replace(`/books?${params.toString()}`)
        }
        setCurrentPage(1)
    }

    const handleSortChange = (value: string) => {
        setSortBy(value)
        setCurrentPage(1)
    }

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }



    return (
        <div className="space-y-8 container max-w-7xl mx-auto py-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#02FF73]/10 via-[#09ADAA]/5 to-background p-8 md:p-12 border shadow-sm">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#09ADAA]/20 blur-[80px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#02FF73]/10 blur-[100px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur-md border-[#02FF73]/30 text-[#09ADAA]">
                            Khám phá tri thức
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black mb-3">
                            Thư Viện Trực Tuyến
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Khám phá thư viện sách điện tử chất lượng cao với hàng nghìn đầu sách đáng đọc được cập nhật liên tục.
                        </p>
                    </div>
                    {isAdmin && (
                        <Button asChild size="lg" className="shadow-lg shadow-[#02FF73]/20 rounded-full shrink-0 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] border-none text-black hover:scale-105 transition-transform">
                            <Link href="/books/add">
                                <Plus className="mr-2 h-5 w-5" />
                                Đăng Sách Mới
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                sortBy={sortBy}
                onSortChange={handleSortChange}
            />

            {selectedTag && (
                <div className="mb-6 flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">Đang lọc theo Thẻ (Tag):</span>
                        <Badge variant="secondary" className="text-sm py-1 px-3 bg-primary/20 hover:bg-primary/30 text-primary">
                            {selectedTag}
                        </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/books')}>
                        Xóa Lọc Thẻ
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div
                            key={`skeleton-${index}`}
                            className="h-64 bg-gray-200 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <>
                    {books.length === 0 ? (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-semibold mb-2">Không Có Kết Quả Nào</h2>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm || selectedCategory !== 'all'
                                    ? "Hãy thử thay đổi từ khóa hoặc bộ lọc để tìm được tài liệu bạn cần."
                                    : "Thư viện hiện tại đang chưa có cuốn sách nào."
                                }
                            </p>
                            {isAdmin && !searchTerm && selectedCategory === 'all' && (
                                <Button asChild>
                                    <Link href="/books/add">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Đăng Cuốn Sách Đầu Tiên
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {books.map((book) => (
                                <BookCard key={book.book_id} book={book} />
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <nav className="flex justify-center mt-8">
                            <PaginationContent>
                                <PaginationItem>
                                    <Button
                                        variant="outline"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                        className="mr-2"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Trang Trước
                                    </Button>
                                </PaginationItem>

                                <PaginationItem>
                                    <span className="flex items-center px-4">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                </PaginationItem>

                                <PaginationItem>
                                    <Button
                                        variant="outline"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="ml-2"
                                    >
                                        Trang Kế Tiếp
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </nav>
                    )}
                </>
            )}
        </div>
    )
}

