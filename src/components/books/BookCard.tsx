'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types/book'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Eye, User } from 'lucide-react'
import { format } from 'date-fns'

type BookCardProps = {
    book: Book
    showQuickActions?: boolean
}

export default function BookCard({ book, showQuickActions = true }: BookCardProps) {
    const isAvailable = true // Digital documents are always available

    // Sắp xếp và lấy 2 chương mới nhất (nếu có)
    const latestChapters = (book.chapters || [])
        .sort((a, b) => b.chapter_number - a.chapter_number)
        .slice(0, 2)

    return (
        <Card className="group h-full flex flex-row overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background border border-border/50">
            {/* Image Container */}
            <div className="relative w-[110px] md:w-[130px] h-[165px] md:h-[190px] shrink-0 overflow-hidden bg-muted">
                <Image
                    src={book.cover_image_url || '/images/placeholder.jpg'}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 110px, 130px"
                />

                {/* Gradient Overlay on Hover for Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 gap-2">
                    {showQuickActions && (
                        <div className="flex gap-1 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
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
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {book.category_name || (book.categories as any)?.name || 'Chưa Phân Loại'}
                    </Badge>
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
        </Card>
    )
} 
