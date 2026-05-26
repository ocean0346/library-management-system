'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'

const FREE_CHAPTERS = 10  // 10 chương đầu miễn phí
const FREE_PDF_PAGES = 10 // 10 trang PDF đầu miễn phí

export { FREE_CHAPTERS, FREE_PDF_PAGES }

type CoinContextType = {
    balance: number
    isLoading: boolean
    fetchBalance: () => Promise<void>
    isChapterLocked: (bookId: string, chapterNumber: number, coinPrice: number, isFree?: boolean) => boolean
    isPDFLocked: (bookId: string, coinPrice: number) => boolean
    fetchUnlockedContent: (bookId: string) => Promise<void>
    unlockChapter: (bookId: string, chapterNumber: number, coinCost: number) => Promise<any>
    unlockPDF: (bookId: string, coinCost: number) => Promise<any>
    unlockedChapters: Set<string>
    unlockedPDFs: Set<string>
}

const CoinContext = createContext<CoinContextType | undefined>(undefined)

export function CoinProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [balance, setBalance] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [unlockedChapters, setUnlockedChapters] = useState<Set<string>>(new Set())
    const [unlockedPDFs, setUnlockedPDFs] = useState<Set<string>>(new Set())

    // Fetch user balance
    const fetchBalance = useCallback(async () => {
        if (!user) {
            setBalance(0)
            setIsLoading(false)
            return
        }
        try {
            const { data } = await supabase
                .from('users')
                .select('coin_balance')
                .eq('user_id', user.id)
                .single()
            setBalance(data?.coin_balance ?? 0)
        } catch (error) {
            console.error('Error fetching coin balance:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    // Check if a chapter is locked
    const isChapterLocked = useCallback((bookId: string, chapterNumber: number, coinPrice: number, isFree?: boolean): boolean => {
        if (coinPrice <= 0) return false
        if (isFree === true) return false
        if (isFree === undefined && chapterNumber <= FREE_CHAPTERS) return false
        if (unlockedChapters.has(`${bookId}_${chapterNumber}`)) return false
        return true
    }, [unlockedChapters])

    // Check if a PDF is locked
    const isPDFLocked = useCallback((bookId: string, coinPrice: number): boolean => {
        if (coinPrice <= 0) return false
        if (unlockedPDFs.has(bookId)) return false
        return true
    }, [unlockedPDFs])

    // Fetch unlocked content for a specific book
    const fetchUnlockedContent = useCallback(async (bookId: string) => {
        if (!user) return
        try {
            const { data } = await supabase
                .from('user_unlocked_content')
                .select('chapter_number')
                .eq('user_id', user.id)
                .eq('book_id', bookId)

            if (data) {
                setUnlockedChapters(prev => {
                    const newSet = new Set(prev)
                    data.forEach((item: any) => {
                        if (item.chapter_number !== null) {
                            newSet.add(`${bookId}_${item.chapter_number}`)
                        }
                    })
                    return newSet
                })
                setUnlockedPDFs(prev => {
                    const newSet = new Set(prev)
                    data.forEach((item: any) => {
                        if (item.chapter_number === null) {
                            newSet.add(bookId)
                        }
                    })
                    return newSet
                })
            }
        } catch (error) {
            console.error('Error fetching unlocked content:', error)
        }
    }, [user])

    // Unlock a chapter with coins
    const unlockChapter = useCallback(async (bookId: string, chapterNumber: number, coinCost: number) => {
        if (!user) return { success: false, message: 'Vui lòng đăng nhập' }

        try {
            const { data, error } = await supabase.rpc('unlock_chapter_with_coins', {
                p_user_id: user.id,
                p_book_id: bookId,
                p_chapter_number: chapterNumber,
                p_coin_cost: coinCost
            })

            if (error) throw error

            if (data?.success) {
                setUnlockedChapters(prev => new Set(prev).add(`${bookId}_${chapterNumber}`))
                if (data.new_balance !== undefined) {
                    setBalance(data.new_balance)
                } else {
                    await fetchBalance()
                }
            }

            return data
        } catch (error) {
            console.error('Error unlocking chapter:', error)
            return { success: false, message: 'Có lỗi xảy ra khi mở khóa' }
        }
    }, [user, fetchBalance])

    // Unlock a PDF with coins
    const unlockPDF = useCallback(async (bookId: string, coinCost: number) => {
        if (!user) return { success: false, message: 'Vui lòng đăng nhập' }

        try {
            const { data, error } = await supabase.rpc('unlock_pdf_with_coins', {
                p_user_id: user.id,
                p_book_id: bookId,
                p_coin_cost: coinCost
            })

            if (error) throw error

            if (data?.success) {
                setUnlockedPDFs(prev => new Set(prev).add(bookId))
                if (data.new_balance !== undefined) {
                    setBalance(data.new_balance)
                } else {
                    await fetchBalance()
                }
            }

            return data
        } catch (error) {
            console.error('Error unlocking PDF:', error)
            return { success: false, message: 'Có lỗi xảy ra khi mở khóa' }
        }
    }, [user, fetchBalance])

    return (
        <CoinContext.Provider value={{
            balance,
            isLoading,
            fetchBalance,
            isChapterLocked,
            isPDFLocked,
            fetchUnlockedContent,
            unlockChapter,
            unlockPDF,
            unlockedChapters,
            unlockedPDFs
        }}>
            {children}
        </CoinContext.Provider>
    )
}

export function useCoins() {
    const context = useContext(CoinContext)
    if (context === undefined) {
        throw new Error('useCoins must be used within a CoinProvider')
    }
    return context
}
