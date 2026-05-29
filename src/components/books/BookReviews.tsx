'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MessageSquare, Trash2, Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
type Review = {
    review_id: string
    user_id: string
    rating: number
    comment: string
    created_at: string
    users: { full_name: string }
}
export default function BookReviews({ bookId, isAdmin }: { bookId: string; isAdmin: boolean }) {
    const { user } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
    const [reviews, setReviews] = useState<Review[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Check if user already reviewed
    const hasReviewed = reviews.some(r => r.user_id === user?.id)
    const fetchReviews = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    users (full_name)
                `)
                .eq('book_id', bookId)
                .order('created_at', { ascending: false })
            if (error) throw error
            setReviews(data as any || [])
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setIsLoading(false)
        }
    }, [bookId])
    useEffect(() => {
        if (bookId) fetchReviews()
    }, [bookId, fetchReviews])
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để đánh giá.", variant: "destructive" })
            return
        }
        if (!comment.trim()) return
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    book_id: bookId,
                    user_id: user.id,
                    rating,
                    comment: comment.trim()
                })
            if (error) throw error
            toast({ title: "Đã gửi đánh giá", description: "Cảm ơn bạn đã chia sẻ cảm nhận!" })
            setComment('')
            setRating(5)
            fetchReviews()
        } catch (error: any) {
            if (error.code === '23505') {
                toast({ title: "Đánh giá thất bại", description: "Bạn đã từng đánh giá sách này rồi.", variant: "destructive" })
            } else {
                toast({ title: "Lỗi", description: "Không thể thêm đánh giá.", variant: "destructive" })
            }
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleDelete = async (reviewId: string) => {
        if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('review_id', reviewId)
            if (error) throw error
            toast({ title: "Đã xóa", description: "Bình luận đã bị xóa khỏi hệ thống." })
            setReviews(prev => prev.filter(r => r.review_id !== reviewId))
        } catch (error) {
            toast({ title: "Lỗi", description: "Xóa thất bại.", variant: "destructive" })
        }
    }
    return (
        <Card className="mt-8 border-t-4 border-t-primary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Đánh Giá Từ Độc Giả ({reviews.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {}
                {user && hasReviewed ? (
                    <div className="mb-8 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground border">
                        Bạn đã đánh giá cuốn sách này rồi. Cảm ơn bạn!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mb-8 bg-muted/30 p-4 sm:p-6 rounded-xl border border-border/50 shadow-sm relative">
                        {!user && (
                            <div 
                                className="absolute inset-0 z-10 cursor-pointer" 
                                onClick={() => {
                                    toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để bình luận." })
                                    router.push(`/login?redirect=/books/${bookId}`)
                                }}
                            />
                        )}
                        <h4 className="font-semibold mb-3">Thêm đánh giá của bạn</h4>
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`focus:outline-none transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    <Star className="h-6 w-6 fill-current" />
                                </button>
                            ))}
                        </div>
                        <Textarea 
                            placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                            className="min-h-[100px] mb-4 bg-background"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting || !comment.trim()}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                Gửi Đánh Giá
                            </Button>
                        </div>
                    </form>
                )}
                {}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl border-muted-foreground/20">
                            <Star className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.review_id} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group relative pr-10">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 border-2 border-primary/20 rounded-full flex items-center justify-center bg-primary/5 text-primary font-bold">
                                        {review.users?.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{review.users?.full_name || 'Khách Vãng Lai'}</span>
                                            <span className="text-xs text-muted-foreground">• {new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-foreground/90 mt-2 leading-relaxed">
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                                {}
                                {(isAdmin || user?.id === review.user_id) && (
                                    <button 
                                        onClick={() => handleDelete(review.review_id)}
                                        className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-destructive hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                        title="Xóa bình luận"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
