'use client'

import { useState, useEffect, useCallback, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Settings, List, Lock, Coins } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { useCoins, FREE_CHAPTERS } from '@/hooks/useCoins'
import UnlockChapterButton from '@/components/coins/UnlockChapterButton'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ReadingWebNovelPage({ params }: { params: Promise<{ id: string, chapterNumber: string }> }) {
    const { id, chapterNumber } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { isChapterLocked, fetchUnlockedContent, unlockChapter, balance } = useCoins()

    const [isLoading, setIsLoading] = useState(true)
    const [book, setBook] = useState<any>(null)
    const [chapter, setChapter] = useState<any>(null)
    const [allChapters, setAllChapters] = useState<any[]>([])
    const [isLocked, setIsLocked] = useState(false)
    const [coinPrice, setCoinPrice] = useState(0)

    const [fontSize, setFontSize] = useState(18)
    const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light')

    const hasLoggedRef = useRef(false)

    const fetchReadingData = useCallback(async () => {
        setIsLoading(true)
        try {

            const { data: bookData } = await supabase.from('books').select('title, author, organization_id, coin_price').eq('book_id', id).single()
            setBook(bookData)
            const bookCoinPrice = bookData?.coin_price ?? 0
            setCoinPrice(bookCoinPrice)

            if (user) {
                await fetchUnlockedContent(id)
            }

            const { data: chapterData, error: chapterError } = await supabase.from('chapters')
                .select('*')
                .eq('book_id', id)
                .eq('chapter_number', parseInt(chapterNumber))
                .single()

            if (chapterError) {
                toast({ title: "Lỗi", description: "Không tìm thấy chương này.", variant: "destructive" })
                router.push(`/books/${id}`)
                return
            }
            setChapter(chapterData)

            const chapterNum = parseInt(chapterNumber)
            const locked = isChapterLocked(id, chapterNum, bookCoinPrice, chapterData.is_free)

            if (locked && user) {
                const { data: unlocked } = await supabase
                    .from('user_unlocked_content')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('book_id', id)
                    .eq('chapter_number', chapterNum)
                    .maybeSingle()

                setIsLocked(!unlocked)
            } else if (locked && !user) {
                setIsLocked(true)
            } else {
                setIsLocked(false)
            }

            if (!hasLoggedRef.current && !locked) {
                hasLoggedRef.current = true

                supabase.rpc('increment_book_views', { p_book_id: id })
                    .then(({ error }) => { if (error) console.error("Increment views error:", error) })

                if (user) {
                    supabase.rpc('record_document_access', {
                        p_organization_id: bookData?.organization_id || null,
                        p_book_id: id,
                        p_user_id: user.id
                    }).then(({ error }) => { if (error) console.error("Record access error:", error) })

                    supabase.from('user_reading_progress').upsert({
                        user_id: user.id,
                        book_id: id,
                        chapter_number: parseInt(chapterNumber),
                        last_read_at: new Date().toISOString()
                    }, { onConflict: 'user_id, book_id' })
                    .then(({ error }) => { if (error) console.error("Reading progress error:", error) })
                }
            }

            const { data: chaps } = await supabase.from('chapters')
                .select('chapter_number, title')
                .eq('book_id', id)
                .order('chapter_number', { ascending: true })
            setAllChapters(chaps || [])

        } catch (error) {
            console.error("Error fetching reading data:", error)
        } finally {
            setIsLoading(false)
        }
    }, [id, chapterNumber, user, router, toast])

    useEffect(() => {
        fetchReadingData()

        const savedSettings = localStorage.getItem('novel_settings')
        if (savedSettings) {
            const { size, t } = JSON.parse(savedSettings)
            if (size) setFontSize(size)
            if (t) setTheme(t)
        }
    }, [fetchReadingData])

    useEffect(() => {
        localStorage.setItem('novel_settings', JSON.stringify({ size: fontSize, t: theme }))
    }, [fontSize, theme])

    const handleUnlocked = () => {
        setIsLocked(false)
        hasLoggedRef.current = false 
        fetchReadingData()
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loading size="lg" /></div>
    }

    if (!chapter) return null

    const currentIndex = allChapters.findIndex(c => c.chapter_number === chapter.chapter_number)
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null

    const themeClasses = {
        light: "bg-[#f4f4f4] text-[#333] border-[#e0e0e0]",
        dark: "bg-[#1a1a1a] text-[#d4d4d4] border-[#333]",
        sepia: "bg-[#f4ecd8] text-[#5b4636] border-[#d3c2a8]"
    }

    const isNextChapterLocked = nextChapter && isChapterLocked(id, nextChapter.chapter_number, coinPrice, nextChapter.is_free)

    return (
        <div className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
            {}
            <div className={`sticky top-0 z-50 backdrop-blur-xl bg-opacity-90 border-b px-4 py-3 flex items-center justify-between ${themeClasses[theme]}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/books/${id}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold line-clamp-1">{book?.title}</h1>
                        <p className="text-xs opacity-70">Chương {chapter.chapter_number}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {}
                    <div className="hidden sm:flex bg-black/5 rounded-full p-1 border">
                        <button onClick={() => setTheme('light')} className={`h-6 w-6 rounded-full bg-[#f4f4f4] border border-gray-300 ${theme === 'light' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                        <button onClick={() => setTheme('sepia')} className={`h-6 w-6 rounded-full bg-[#f4ecd8] border border-transparent mx-2 ${theme === 'sepia' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                        <button onClick={() => setTheme('dark')} className={`h-6 w-6 rounded-full bg-[#1a1a1a] border border-transparent ${theme === 'dark' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                    </div>

                    {}
                    <div className="hidden sm:flex items-center gap-1 bg-black/5 rounded-full px-2 border ml-2">
                        <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="px-2 py-1 hover:bg-black/10 rounded font-bold">A-</button>
                        <span className="text-xs px-1">{fontSize}</span>
                        <button onClick={() => setFontSize(f => Math.min(32, f + 2))} className="px-2 py-1 hover:bg-black/10 rounded font-bold">A+</button>
                    </div>
                </div>
            </div>

            {}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 font-display">Chương {chapter.chapter_number}{chapter.title ? `: ${chapter.title}` : ''}</h2>
                    <div className="h-1 w-20 mx-auto bg-primary/40 rounded-full"></div>
                </div>

                {/* Locked Content Overlay */}
                {isLocked ? (
                    <div className="relative">
                        {/* Show blurred preview */}
                        <div className="max-h-[200px] overflow-hidden relative">
                            {chapter.content_text.includes('<p') || chapter.content_text.includes('<h') ? (
                                <div 
                                    className={`prose max-w-none chapter-content blur-sm select-none prose-p:text-current prose-headings:text-current prose-li:text-current prose-strong:text-current ${theme === 'dark' ? 'prose-invert' : ''}`}
                                    style={{ fontSize: `${fontSize}px` }}
                                    dangerouslySetInnerHTML={{ __html: chapter.content_text.substring(0, 500) }}
                                />
                            ) : (
                                <div 
                                    className="leading-[1.8] whitespace-pre-wrap chapter-content blur-sm select-none"
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    {chapter.content_text.substring(0, 500)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
                        </div>

                        {}
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30 flex items-center justify-center mb-6">
                                <Lock className="h-10 w-10 text-yellow-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Chương Bị Khóa</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Chương {chapter.chapter_number} là nội dung trả phí. Mở khóa bằng xu để tiếp tục đọc.
                            </p>
                            <UnlockChapterButton
                                bookId={id}
                                chapterNumber={parseInt(chapterNumber)}
                                coinPrice={coinPrice}
                                isLocked={true}
                                onUnlocked={handleUnlocked}
                            />
                            <p className="text-sm text-muted-foreground mt-4">
                                Số dư hiện tại: <span className="font-bold text-yellow-600 dark:text-yellow-400">{balance} xu</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {chapter.content_text.includes('<p') || chapter.content_text.includes('<h') ? (
                            <div 
                                className={`prose max-w-none chapter-content prose-p:mb-[1.5em] prose-headings:font-display prose-img:block prose-img:mx-auto prose-img:max-w-full prose-img:rounded-md break-words prose-p:text-current prose-headings:text-current prose-li:text-current prose-strong:text-current ${theme === 'dark' ? 'prose-invert' : ''}`}
                                style={{ fontSize: `${fontSize}px` }}
                                dangerouslySetInnerHTML={{ __html: chapter.content_text }}
                            />
                        ) : (
                            <div 
                                className="leading-[1.8] whitespace-pre-wrap chapter-content break-words"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {chapter.content_text}
                            </div>
                        )}
                    </>
                )}

                {}
                <div className="mt-20 pt-8 border-t flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <Button 
                        variant="outline" 
                        disabled={!prevChapter}
                        onClick={() => prevChapter && router.push(`/books/${id}/read/${prevChapter.chapter_number}`)}
                        className={`w-full sm:w-auto ${themeClasses[theme]}`}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Chương Trước
                    </Button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="w-full sm:w-auto"
                            >
                                <List className="mr-2 h-4 w-4" /> Mục Lục
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0">
                            <SheetHeader className="p-6 pb-4 border-b">
                                <SheetTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Mục Lục
                                </SheetTitle>
                                <p className="text-sm text-muted-foreground line-clamp-1">{book?.title}</p>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-120px)]">
                                <div className="p-2">
                                    {allChapters.map((ch) => {
                                        const isCurrent = ch.chapter_number === chapter.chapter_number
                                        const chLocked = isChapterLocked(id, ch.chapter_number, coinPrice, ch.is_free)
                                        return (
                                            <button
                                                key={ch.chapter_number}
                                                onClick={() => router.push(`/books/${id}/read/${ch.chapter_number}`)}
                                                className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-200 flex items-center gap-3 ${
                                                    isCurrent 
                                                        ? 'bg-primary/10 text-primary font-semibold border border-primary/20' 
                                                        : 'hover:bg-muted/80 text-foreground'
                                                }`}
                                            >
                                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {chLocked ? <Lock className="h-3.5 w-3.5" /> : ch.chapter_number}
                                                </span>
                                                <span className="line-clamp-1 text-sm">
                                                    {ch.title || `Chương ${ch.chapter_number}`}
                                                </span>
                                                {isCurrent && (
                                                    <span className="ml-auto flex-shrink-0 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                                        Đang đọc
                                                    </span>
                                                )}
                                                {chLocked && !isCurrent && (
                                                    <span className="ml-auto flex-shrink-0 text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Coins className="h-2.5 w-2.5" />
                                                        {coinPrice}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>

                    <Button 
                        variant="outline" 
                        disabled={!nextChapter}
                        onClick={() => nextChapter && router.push(`/books/${id}/read/${nextChapter.chapter_number}`)}
                        className={`w-full sm:w-auto ${themeClasses[theme]}`}
                    >
                        Chương Sau
                        {isNextChapterLocked && <Lock className="ml-1 h-3 w-3 text-yellow-500" />}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
