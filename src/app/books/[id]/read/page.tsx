'use client'

import { useState, useEffect, useCallback, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Expand, Shrink } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { useCoins, FREE_PDF_PAGES } from '@/hooks/useCoins'
import LockedPDFOverlay from '@/components/coins/LockedPDFOverlay'

const PdfViewer = dynamic(() => import('@/components/books/PdfViewer'), { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center"><Loading /></div> })

export default function DocumentReaderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { isPDFLocked, fetchUnlockedContent } = useCoins()

    const [isLoading, setIsLoading] = useState(true)
    const [book, setBook] = useState<any>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [initialPage, setInitialPage] = useState(0)
    const [isLocked, setIsLocked] = useState(false)
    const [coinPrice, setCoinPrice] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [showLockedOverlay, setShowLockedOverlay] = useState(false)

    const hasLoggedRef = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const fetchReadingData = useCallback(async () => {
        setIsLoading(true)
        try {
            // Fetch Book Details
            const { data: bookData, error } = await supabase
                .from('books')
                .select('title, author, file_url, file_type, organization_id, coin_price')
                .eq('book_id', id)
                .single()

            if (error || !bookData || !bookData.file_url) {
                toast({ title: "Lỗi", description: "Tài liệu này không tồn tại hoặc chưa có tệp đính kèm.", variant: "destructive" })
                router.push(`/books/${id}`)
                return
            }

            setBook(bookData)
            const bookCoinPrice = bookData.coin_price ?? 0
            setCoinPrice(bookCoinPrice)

            // Check if PDF is locked
            if (bookCoinPrice > 0) {
                if (user) {
                    await fetchUnlockedContent(id)
                    const { data: unlocked } = await supabase
                        .from('user_unlocked_content')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('book_id', id)
                        .is('chapter_number', null)
                        .maybeSingle()
                    
                    setIsLocked(!unlocked)
                } else {
                    setIsLocked(true)
                }
            } else {
                setIsLocked(false)
            }

            // Log Access & Progress once per mount
            if (!hasLoggedRef.current) {
                hasLoggedRef.current = true
                
                // Tăng view cho quyển sách (Ai vào xem cũng tăng)
                supabase.rpc('increment_book_views', { p_book_id: id })
                    .then(({ error }) => { if (error) console.error("Increment views error:", error) })

                if (user) {
                    supabase.rpc('record_document_access', {
                        p_organization_id: bookData.organization_id || null,
                        p_book_id: id,
                        p_user_id: user.id
                    }).then(({ error }) => { if (error) console.error("Record access error:", error) })

                    // Fetch or Create user_reading_progress
                    supabase.from('user_reading_progress').select('chapter_number').eq('user_id', user.id).eq('book_id', id).single()
                        .then(({ data }) => {
                            if (data) {
                                setInitialPage(Math.max(0, data.chapter_number - 1))
                            } else {
                                supabase.from('user_reading_progress').insert({
                                    user_id: user.id,
                                    book_id: id,
                                    chapter_number: 1,
                                    last_read_at: new Date().toISOString()
                                }).then(({ error }) => { if (error) console.error("Initial progress error:", error) })
                            }
                        })
                }
            }

        } catch (error) {
            console.error("Error fetching document data:", error)
        } finally {
            setIsLoading(false)
        }
    }, [id, user, router, toast])

    useEffect(() => {
        fetchReadingData()
    }, [fetchReadingData])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`)
            })
        } else {
            document.exitFullscreen()
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const handlePageChange = useCallback((pageIndex: number) => {
        setCurrentPage(pageIndex)

        // If locked and past free pages, show overlay
        if (isLocked && pageIndex >= FREE_PDF_PAGES) {
            setShowLockedOverlay(true)
        }

        if (!user) return
        
        // Save to DB
        const pageNum = pageIndex + 1
        supabase.from('user_reading_progress').upsert({
            user_id: user.id,
            book_id: id,
            chapter_number: pageNum,
            last_read_at: new Date().toISOString()
        }, { onConflict: 'user_id, book_id' })
        .then(({ error }) => { if (error) console.error("Update progress error:", error) })
    }, [id, user, isLocked])

    const handleUnlocked = () => {
        setIsLocked(false)
        setShowLockedOverlay(false)
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loading />
            </div>
        )
    }

    if (!book) return null

    return (
        <div className="flex flex-col h-screen bg-background" ref={containerRef}>
            {/* Header Toolbar */}
            <header className={`flex items-center justify-between p-4 border-b bg-card shrink-0 transition-all ${isFullscreen ? 'opacity-0 hover:opacity-100 absolute top-0 left-0 right-0 z-50 shadow-md' : ''}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href={`/books/${id}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex flex-col overflow-hidden">
                        <h1 className="text-lg font-bold truncate">{book.title}</h1>
                        <span className="text-sm text-muted-foreground truncate">{book.author}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isLocked && (
                        <Button variant="outline" size="sm" onClick={() => window.open(book.file_url, '_blank')} className="hidden sm:flex">
                            <Download className="h-4 w-4 mr-2" />
                            Tải Xuống
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? (
                            <><Shrink className="h-4 w-4 mr-2" /> Thu Nhỏ</>
                        ) : (
                            <><Expand className="h-4 w-4 mr-2" /> Toàn Màn Hình</>
                        )}
                    </Button>
                </div>
            </header>

            {/* Document Viewer */}
            <main className="flex-1 overflow-hidden relative bg-muted/30">
                {!book.file_url ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Không tìm thấy đường dẫn tài liệu.</p>
                    </div>
                ) : (
                    <>
                        <PdfViewer 
                            fileUrl={book.file_url} 
                            initialPage={initialPage} 
                            onPageChange={handlePageChange}
                        />
                        
                        {/* Locked Overlay for PDF */}
                        {showLockedOverlay && isLocked && (
                            <LockedPDFOverlay
                                bookId={id}
                                bookTitle={book.title}
                                coinPrice={coinPrice}
                                onUnlocked={handleUnlocked}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
