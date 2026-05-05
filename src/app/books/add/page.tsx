'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { uploadFileToSupabase } from '@/lib/storage'
import { BookPlus, ArrowLeft, Loader2, Save, ImageIcon } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Category {
    category_id: number
    name: string
}

export default function AddBookPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    const { toast } = useToast()

    // Form state
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [isbn, setIsbn] = useState('')
    const [publisher, setPublisher] = useState('')
    const [publishDate, setPublishDate] = useState('')
    const [description, setDescription] = useState('')
    const [coverImageUrl, setCoverImageUrl] = useState('')
    const [categoryId, setCategoryId] = useState<string>('')
    const [tagsInput, setTagsInput] = useState('')
    const [fileUrl, setFileUrl] = useState('')
    const [fileSize, setFileSize] = useState<string>('')
    const [fileType, setFileType] = useState('WEBNOVEL')

    // Upload states
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [isUploadingDoc, setIsUploadingDoc] = useState(false)

    // UI state
    const [categories, setCategories] = useState<Category[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)

    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('category_id, name')
                .order('name', { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (err) {
            console.error('Error fetching categories:', err)
        } finally {
            setIsLoadingCategories(false)
        }
    }, [])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        const checkAdmin = async () => {
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('user_id', user.id)
                    .single()
                
                if (data?.role === 'ADMIN' || data?.role === 'SUPER_ADMIN') {
                    setIsAdmin(true)
                    fetchCategories()
                } else {
                    toast({
                        title: "Access Denied",
                        description: "Chỉ Admin mới có quyền thêm sách",
                        variant: "destructive",
                    })
                    router.push('/books')
                }
            }
        }
        if (!authLoading) checkAdmin()
    }, [user, authLoading, router, toast])

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast({ title: 'Lỗi', description: 'Vui lòng chọn file hình ảnh hợp lệ', variant: 'destructive' })
            return
        }
        try {
            setIsUploadingCover(true)
            const url = await uploadFileToSupabase(file, { folder: 'book_covers', maxSizeMB: 5 })
            setCoverImageUrl(url)
            toast({ title: 'Thành công', description: 'Đã tải ảnh bìa lên hệ thống.' })
        } catch (error: any) {
            toast({ title: 'Lỗi tải ảnh', description: error.message, variant: 'destructive' })
        } finally {
            setIsUploadingCover(false)
            e.target.value = ''
        }
    }

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setIsUploadingDoc(true)
            const url = await uploadFileToSupabase(file, { folder: 'book_documents', maxSizeMB: 50 })
            setFileUrl(url)
            setFileSize((file.size / (1024 * 1024)).toFixed(2)) // Auto fill size
            toast({ title: 'Thành công', description: 'Đã tải tài liệu lên hệ thống.' })
        } catch (error: any) {
            toast({ title: 'Lỗi tải tệp', description: error.message, variant: 'destructive' })
        } finally {
            setIsUploadingDoc(false)
            e.target.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!title.trim()) {
            setError('Title is required')
            return
        }
        if (!author.trim()) {
            setError('Author is required')
            return
        }
        if (fileType !== 'WEBNOVEL' && !fileUrl.trim()) {
            setError('Đường dẫn file là bắt buộc đối với định dạng Tài Liệu')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
            
            const bookData = {
                organization_id: null,
                title: title.trim(),
                author: author.trim(),
                isbn: isbn.trim(),
                publisher: publisher.trim() || null,
                publish_date: publishDate || null,
                description: description.trim() || null,
                cover_image_url: coverImageUrl || null,
                category_id: categoryId ? parseInt(categoryId) : null,
                file_url: fileUrl || null,
                file_size_bytes: fileSize ? Math.round(parseFloat(fileSize) * 1024 * 1024) : null,
                file_type: fileType,
                tags: tagsArray
            }

            const { data, error: insertError } = await supabase
                .from('books')
                .insert([bookData])
                .select()
                .single()

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('A book with this ISBN already exists in your organization')
                } else {
                    throw insertError
                }
                return
            }

            toast({
                title: "Success",
                description: "Book added successfully",
            })

            router.push(`/books/${data.book_id}`)
        } catch (err: any) {
            console.error('Error adding book:', err)
            setError(err.message || 'Failed to add book. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (authLoading || (!isAdmin && user)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user || (!isAdmin && !isLoadingCategories)) {
        return null
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.push('/books')}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Catalog
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Đăng Tác Phẩm Mới</CardTitle>
                            <CardDescription>
                                Thêm sách tài liệu dạng PDF hoặc Tiểu thuyết (Truyện chữ nhiều chương)
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Format Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Định Dạng Tác Phẩm</h3>
                            <div className="space-y-2">
                                <Label htmlFor="fileType">Phân Loại *</Label>
                                <Select
                                    value={fileType}
                                    onValueChange={setFileType}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="border-primary/50 bg-primary/5 ring-primary/20">
                                        <SelectValue placeholder="Chọn định dạng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEBNOVEL" className="font-bold text-primary">Truyện Chữ</SelectItem>
                                        <SelectItem value="PDF">Tài liệu PDF (Upload file)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Thông Tin Chung</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Tựa đề tác phẩm *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Nhập tên sách..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="author">Tác giả *</Label>
                                    <Input
                                        id="author"
                                        placeholder="Nhập tên tác giả..."
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="isbn">Mã Tiêu Chuẩn (Nếu có)</Label>
                                    <Input
                                        id="isbn"
                                        placeholder="ví dụ: 978-0-..."
                                        value={isbn}
                                        onChange={(e) => setIsbn(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="category">Thể Loại</Label>
                                <Select
                                    value={categoryId}
                                    onValueChange={setCategoryId}
                                    disabled={isSubmitting || isLoadingCategories}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn thể loại" />
                                    </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.category_id}
                                                    value={category.category_id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Các Thể Loại Phụ / Tags</Label>
                                <Input
                                    id="tags"
                                    placeholder="Ví dụ: Hài hước, Trinh thám, Xuyên không (ngăn cách bằng dấu phẩy)"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Thêm bao nhiêu thẻ tùy thích, mỗi thẻ ngăn cách nhau bằng dấu phẩy.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô Tả / Trích Dẫn</Label>
                                <textarea
                                    id="description"
                                    placeholder="Viết một đoạn ngắn giới thiệu nội dung cuốn sách..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Publishing Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Thông Tin Xuất Bản</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="publisher">Nhà Xuất Bản</Label>
                                    <Input
                                        id="publisher"
                                        placeholder="Nhập tên nhà xuất bản..."
                                        value={publisher}
                                        onChange={(e) => setPublisher(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="publishDate">Ngày Xuất Bản</Label>
                                    <Input
                                        id="publishDate"
                                        type="date"
                                        value={publishDate}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Document Information - HIDE FOR WEBNOVEL */}
                        {fileType !== 'WEBNOVEL' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Thông Tin Tệp (File Chi Tiết)</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="fileUpload">Tải lên File PDF Trực Tiếp *</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            id="fileUpload"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleDocUpload}
                                            disabled={isSubmitting || isUploadingDoc}
                                        />
                                        {isUploadingDoc && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                    </div>
                                    <Label htmlFor="fileUrl" className="text-xs text-muted-foreground mt-4 block">Hoặc dán URL nếu file nằm trên server khác:</Label>
                                    <Input
                                        id="fileUrl"
                                        type="url"
                                        placeholder="https://example.com/document.pdf"
                                        value={fileUrl}
                                        onChange={(e) => setFileUrl(e.target.value)}
                                        disabled={isSubmitting}
                                        required={fileType !== 'WEBNOVEL'}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fileSize">Kích Thước File Yếu Lượng (MB)</Label>
                                        <Input
                                            id="fileSize"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="ví dụ: 2.5"
                                            value={fileSize}
                                            onChange={(e) => setFileSize(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Cover Image */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Ảnh Bìa</h3>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="coverUpload">Tải Lên Máy Tính (Tối đa 5MB)</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            id="coverUpload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverUpload}
                                            disabled={isSubmitting || isUploadingCover}
                                        />
                                        {isUploadingCover && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                    </div>

                                    <Label htmlFor="coverImageUrl" className="text-xs text-muted-foreground mt-4 block">Hoặc Dán URL Ảnh Bắn Ra Từ Nguồn Khác</Label>
                                    <Input
                                        id="coverImageUrl"
                                        type="url"
                                        placeholder="https://example.com/cover.jpg"
                                        value={coverImageUrl}
                                        onChange={(e) => setCoverImageUrl(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="flex items-center justify-center">
                                    {coverImageUrl ? (
                                        <div className="relative w-24 h-32 rounded-md overflow-hidden border">
                                            <Image
                                                src={coverImageUrl}
                                                alt="Cover preview"
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-32 rounded-md border-2 border-dashed flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/books')}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Hủy Bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-primary to-[#09ADAA]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang Đăng...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Hoàn Tất Đăng Sách
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
