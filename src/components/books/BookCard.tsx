'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types/book'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Eye, User, Star } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'

type BookCardProps = {
    book: Book
    showQuickActions?: boolean
}

export default function BookCard({ book, showQuickActions = true }: BookCardProps) {
    const isAvailable = true // Digital documents are always available
    const { user } = useAuth()
    const [progressChapter, setProgressChapter] = useState<number | null>((book as any)._progress_chapter || null)

    // Lấy tiến độ đọc nếu chưa được truyền từ component cha (VD: Tủ Sách)
    useEffect(() => {
        if ((book as any)._progress_chapter || !user) return

        const fetchProgress = async () => {
            const { data } = await supabase
                .from('user_reading_progress')
                .select('chapter_number')
                .eq('user_id', user.id)
                .eq('book_id', book.book_id)
                .single()
            
            if (data) {
                setProgressChapter(data.chapter_number)
            }
        }
        fetchProgress()
    }, [user, book.book_id, (book as any)._progress_chapter])

    // Sắp xếp và lấy 2 chương mới nhất (nếu có)
    const latestChapters = (book.chapters || [])
        .sort((a, b) => b.chapter_number - a.chapter_number)
        .slice(0, 2)

    return (
        <Card className="group h-full flex flex-row overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background border border-border/50 relative">
            {/* Image Container */}
            <div className="relative w-[110px] md:w-[130px] h-[165px] md:h-[190px] shrink-0 overflow-hidden bg-muted">
                <Link href={`/books/${book.book_id}`} className="absolute inset-0 z-0 block">
                    <Image
                        src={book.cover_image_url || '/images/placeholder.jpg'}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 110px, 130px"
                    />
                </Link>

                {/* Rating Overlay */}
                {(book as any).average_rating > 0 && (
                    <div className="absolute top-1.5 right-1.5 z-10 bg-black/50 backdrop-blur-md rounded shadow-sm px-1.5 py-0.5 flex items-center gap-1 border border-white/10 pointer-events-none">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-white">{(book as any).average_rating}</span>
                    </div>
                )}
                
                {/* Views Badge Overlay */}
                {(book as any).views_count > 0 && (
                    <div className="absolute top-1.5 left-1.5 z-10 bg-black/50 backdrop-blur-md rounded shadow-sm px-1.5 py-0.5 flex items-center gap-1 border border-white/10 pointer-events-none">
                        <Eye className="w-3 h-3 text-white/80" />
                        <span className="text-[10px] font-medium text-white/90">
                            {(book as any).views_count >= 1000 
                                ? `${((book as any).views_count / 1000).toFixed(1)}k` 
                                : (book as any).views_count}
                        </span>
                    </div>
                )}

                {/* Gradient Overlay on Hover for Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 gap-2 pointer-events-none">
                    {showQuickActions && (
                        <div className="flex gap-1 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto">
                            <Button variant="gradient" size="icon" className="w-8 h-8 rounded-full" asChild>
                                <Link href={`/books/${book.book_id}`}>
                                    <BookOpen className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-white/90 text-black hover:bg-white" asChild>
                                <Link href={`/books/${book.book_id}`}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-1 p-3 md:p-4 min-w-0">
                {/* Title & Author */}
                <div className="mb-2">
                    <Link
                        href={`/books/${book.book_id}`}
                        className="block group/title"
                    >
                        <h3 className="font-display font-semibold text-base md:text-lg text-foreground line-clamp-2 md:line-clamp-1 group-hover/title:text-primary transition-colors leading-tight">
                            {book.title}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span className="line-clamp-1">{book.author}</span>
                    </div>
                </div>

                {/* Badge Category / Type */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {(() => {
                        const catName = book.category_name || (book.categories as any)?.name || 'Chưa Phân Loại';
                        if (catName !== 'Chưa Phân Loại') {
                            return (
                                <Link href={`/books?category=${encodeURIComponent(catName)}`}>
                                    <Badge variant="outline" className="text-[10px] sm:text-xs hover:bg-primary/10 transition-colors cursor-pointer">
                                        {catName}
                                    </Badge>
                                </Link>
                            )
                        }
                        return (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                                {catName}
                            </Badge>
                        )
                    })()}
                    
                    {/* Tags (Secondary Categories) */}
                    {book.tags && book.tags.slice(0, 2).map((tag, index) => (
                        <Link key={index} href={`/books?tag=${encodeURIComponent(tag)}`}>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs bg-muted/50 hover:bg-muted cursor-pointer">
                                {tag}
                            </Badge>
                        </Link>
                    ))}

                    <Badge variant="secondary" className="text-[10px] sm:text-xs bg-primary/10 text-primary hover:bg-primary/20">
                        {book.file_type ? book.file_type.toUpperCase() : 'PDF'}
                    </Badge>
                </div>

                {/* Chapters Section (If exists) or empty space */}
                <div className="mt-auto pt-2 border-t border-border/40">
                    {latestChapters.length > 0 ? (
                        <div className="space-y-1.5">
                            {latestChapters.map((chap, index) => (
                                <Link key={index} href={`/books/${book.book_id}/read/${chap.chapter_number}`} className="flex items-center gap-2 group/chap">
                                    <Badge variant="secondary" className="text-[10px] bg-muted group-hover/chap:bg-primary/20 group-hover/chap:text-primary transition-colors px-2 py-0 h-5">
                                        Chương {chap.chapter_number}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex-1 flex justify-between items-center group-hover/chap:text-foreground transition-colors">
                                        <span className="line-clamp-1">{chap.title}</span>
                                        {chap.created_at && (
                                            <span className="text-[10px] opacity-70 shrink-0 ml-2">
                                                {format(new Date(chap.created_at), 'MMMM d, yyyy')}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground line-clamp-2 uppercase mt-1 tracking-wide opacity-50">
                            Tài Liệu Toàn Tập
                        </p>
                    )}
                </div>
            </div>

            {/* Reading Progress Overlay */}
            {progressChapter && (
                <Link 
                    href={book.file_url ? `/books/${book.book_id}/read` : `/books/${book.book_id}/read/${progressChapter}`}
                    className="absolute bottom-3 right-3 text-[11px] font-medium bg-background/90 px-2 py-1 rounded shadow-sm border text-muted-foreground z-20 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                >
                    Đang đọc: {book.file_url ? 'Trang' : 'Chương'} {progressChapter}
                </Link>
            )}
        </Card>
    )
} 
