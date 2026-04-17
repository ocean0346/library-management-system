'use client'

import { useState, useEffect, useCallback, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Settings } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'

export default function ReadingWebNovelPage({ params }: { params: Promise<{ id: string, chapterNumber: string }> }) {
    const { id, chapterNumber } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(true)
    const [book, setBook] = useState<any>(null)
    const [chapter, setChapter] = useState<any>(null)
    const [allChapters, setAllChapters] = useState<any[]>([])

    // Reading Settings
    const [fontSize, setFontSize] = useState(18)
    const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light')

    const hasLoggedRef = useRef(false)

    const fetchReadingData = useCallback(async () => {
        setIsLoading(true)
        try {
            // Log Access & Progress once per mount
            if (!hasLoggedRef.current) {
                hasLoggedRef.current = true
                try {
                    // Tăng view cho quyển sách (Ai vào xem cũng tăng)
                    await supabase.rpc('increment_book_views', { p_book_id: id })

                    if (user) {
                        await supabase.rpc('record_document_access', {
                            p_organization_id: "00000000-0000-0000-0000-000000000000",
                            p_book_id: id,
                            p_user_id: user.id
                        })

                        // Lưu tiến độ đọc trang của người dùng
                        await supabase.from('user_reading_progress').upsert({
                            user_id: user.id,
                            book_id: id,
                            chapter_number: parseInt(chapterNumber),
                            last_read_at: new Date().toISOString()
                        }, { onConflict: 'user_id, book_id' })
                    }
                } catch (e) {
                    console.error("Access/Progress log error:", e)
                }
            }

            // Fetch Book Details
            const { data: bookData } = await supabase.from('books').select('title, author').eq('book_id', id).single()
            setBook(bookData)

            // Fetch Current Chapter
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

            // Fetch All Chapters for Navigation
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
        
        // Restore settings if any
        const savedSettings = localStorage.getItem('novel_settings')
        if (savedSettings) {
            const { size, t } = JSON.parse(savedSettings)
            if (size) setFontSize(size)
            if (t) setTheme(t)
        }
    }, [fetchReadingData])

    // Save preferences
    useEffect(() => {
        localStorage.setItem('novel_settings', JSON.stringify({ size: fontSize, t: theme }))
    }, [fontSize, theme])

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loading size="lg" /></div>
    }

    if (!chapter) return null

    // Find Prev/Next
    const currentIndex = allChapters.findIndex(c => c.chapter_number === chapter.chapter_number)
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null

    const themeClasses = {
        light: "bg-[#f4f4f4] text-[#333] border-[#e0e0e0]",
        dark: "bg-[#1a1a1a] text-[#d4d4d4] border-[#333]",
        sepia: "bg-[#f4ecd8] text-[#5b4636] border-[#d3c2a8]"
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
            {/* Top Navigation Bar */}
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
                    {/* Theme Controls */}
                    <div className="hidden sm:flex bg-black/5 rounded-full p-1 border">
                        <button onClick={() => setTheme('light')} className={`h-6 w-6 rounded-full bg-[#f4f4f4] border border-gray-300 ${theme === 'light' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                        <button onClick={() => setTheme('sepia')} className={`h-6 w-6 rounded-full bg-[#f4ecd8] border border-transparent mx-2 ${theme === 'sepia' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                        <button onClick={() => setTheme('dark')} className={`h-6 w-6 rounded-full bg-[#1a1a1a] border border-transparent ${theme === 'dark' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                    </div>
                    
                    {/* Font Size Controls */}
                    <div className="hidden sm:flex items-center gap-1 bg-black/5 rounded-full px-2 border ml-2">
                        <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="px-2 py-1 hover:bg-black/10 rounded font-bold">A-</button>
                        <span className="text-xs px-1">{fontSize}</span>
                        <button onClick={() => setFontSize(f => Math.min(32, f + 2))} className="px-2 py-1 hover:bg-black/10 rounded font-bold">A+</button>
                    </div>
                </div>
            </div>

            {/* Reading Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 font-serif">Chương {chapter.chapter_number}: {chapter.title}</h2>
                    <div className="h-1 w-20 mx-auto bg-primary/40 rounded-full"></div>
                </div>

                {chapter.content_text.includes('<p') || chapter.content_text.includes('<h') ? (
                    <div 
                        className="prose dark:prose-invert max-w-none chapter-content font-serif prose-p:mb-[1.5em] prose-headings:font-sans prose-img:block prose-img:mx-auto prose-img:max-w-full prose-img:rounded-md break-words"
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: chapter.content_text }}
                    />
                ) : (
                    <div 
                        className="font-serif leading-[1.8] whitespace-pre-wrap chapter-content break-words"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {chapter.content_text}
                    </div>
                )}

                {/* Bottom Navigation */}
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

                    <Button 
                        variant="ghost" 
                        onClick={() => router.push(`/books/${id}`)}
                        className="w-full sm:w-auto"
                    >
                        <BookOpen className="mr-2 h-4 w-4" /> Mục Lục
                    </Button>

                    <Button 
                        variant="outline" 
                        disabled={!nextChapter}
                        onClick={() => nextChapter && router.push(`/books/${id}/read/${nextChapter.chapter_number}`)}
                        className={`w-full sm:w-auto ${themeClasses[theme]}`}
                    >
                        Chương Sau
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
