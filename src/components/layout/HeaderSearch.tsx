'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
type Suggestion = {
    book_id: string
    title: string
    author: string
    cover_image_url: string
    chapters: { chapter_number: number }[]
}
export default function HeaderSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    // A simple custom debounce since we might not have use-debounce hook
    const [debouncedQuery, setDebouncedQuery] = useState('')
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(timer)
    }, [query])
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedQuery.trim()) {
                setSuggestions([])
                setIsSearching(false)
                return
            }
            setIsSearching(true)
            try {
                const termToSearch = debouncedQuery.trim().toLowerCase()
                const { data, error } = await supabase
                    .from('books')
                    .select('book_id, title, author, cover_image_url, chapters(chapter_number)')
                    .or(`title.ilike.%${termToSearch}%,author.ilike.%${termToSearch}%`)
                    .order('views_count', { ascending: false, nullsFirst: false })
                    .limit(5)
                if (data) {
                    setSuggestions(data as Suggestion[])
                }
            } catch (error) {
                console.error("Search error:", error)
            } finally {
                setIsSearching(false)
            }
        }
        fetchSuggestions()
    }, [debouncedQuery])
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])
    const handleSearchSubmit = () => {
        if (query.trim()) {
            setShowSuggestions(false)
            router.push(`/books?q=${encodeURIComponent(query.trim())}`)
        }
    }
    return (
        <div ref={wrapperRef} className="hidden md:flex relative mr-2 items-center z-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                type="text" 
                placeholder="Tìm kiếm truyện, sách..."
                className="w-[200px] lg:w-[300px] pl-9 rounded-full bg-muted/50 border-transparent focus-visible:bg-transparent"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                }}
                onFocus={() => {
                    if (query.trim()) setShowSuggestions(true)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit()
                }}
            />
            {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
            {}
            {showSuggestions && query.trim().length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full lg:w-[400px] bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[350px]">
                    {isSearching && suggestions.length === 0 ? (
                        <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                            Đang tìm kiếm...
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                            Không tìm thấy kết quả phù hợp
                        </div>
                    ) : (
                        <div className="overflow-y-auto py-2">
                            {suggestions.map((book) => {
                                const latestChapter = book.chapters && book.chapters.length > 0 
                                    ? Math.max(...book.chapters.map(c => c.chapter_number)) 
                                    : null
                                return (
                                    <Link 
                                        key={book.book_id}
                                        href={`/books/${book.book_id}`}
                                        className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-0"
                                        onClick={() => setShowSuggestions(false)}
                                    >
                                        {}
                                        <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden bg-muted">
                                            <Image 
                                                src={book.cover_image_url || '/images/placeholder.jpg'} 
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        </div>
                                        {}
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                {book.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                {book.author}
                                            </span>
                                            {latestChapter !== null && (
                                                <span className="text-xs text-primary/80 font-medium mt-1">
                                                    Chương {latestChapter}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                            <div 
                                className="p-3 text-center text-sm font-medium text-primary cursor-pointer hover:bg-muted/50 transition-colors border-t"
                                onClick={handleSearchSubmit}
                            >
                                Xem tất cả kết quả cho &quot;{query}&quot;
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
