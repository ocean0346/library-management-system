'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { Pencil, ArrowLeft, Loader2, Save, ImageIcon } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { uploadFileToSupabase } from '@/lib/storage'

interface Category {
    category_id: number
    name: string
}

interface Book {
    book_id: number
    title: string
    author: string
    isbn: string
    publisher: string | null
    publish_date: string | null
    description: string | null
    cover_image_url: string | null
    category_id: number | null
    file_url: string | null
    file_size_bytes: number | null
    file_type: string | null
    organization_id: number
    tags?: string[]
}

export default function EditBookPage() {
    const params = useParams()
    const router = useRouter()
    const bookId = params.id as string
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
    const [fileType, setFileType] = useState('PDF')

    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [isUploadingDoc, setIsUploadingDoc] = useState(false)

    // UI state
    const [categories, setCategories] = useState<Category[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)

    const fetchBook = useCallback(async () => {
        if (!bookId) return

        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('book_id', bookId)
                .single()

            if (error) throw error

            if (!data) {
                toast({
                    title: "Error",
                    description: "Book not found",
                    variant: "destructive",
                })
                router.push('/books')
                return
            }

            const book = data as Book
            setTitle(book.title)
            setAuthor(book.author)
            setIsbn(book.isbn)
            setPublisher(book.publisher || '')
            setPublishDate(book.publish_date || '')
            setDescription(book.description || '')
            setCoverImageUrl(book.cover_image_url || '')
            setCategoryId(book.category_id?.toString() || '')
            setTagsInput((book.tags || []).join(', '))
            setFileUrl(book.file_url || '')
            setFileSize(book.file_size_bytes ? (book.file_size_bytes / (1024 * 1024)).toString() : '')
            setFileType(book.file_type || 'PDF')
        } catch (err) {
            console.error('Error fetching book:', err)
            toast({
                title: "Error",
                description: "Failed to load book details",
                variant: "destructive",
            })
            router.push('/books')
        } finally {
            setIsLoading(false)
        }
    }, [bookId, router, toast])

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
        const checkAdmin = async () => {
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('user_id', user.id)
                    .single()
                
                if (data?.role === 'ADMIN' || data?.role === 'SUPER_ADMIN') {
                    setIsAdmin(true)
                } else {
                    toast({
                        title: "Access Denied",
                        description: "Chỉ Admin mới có quyền sửa sách",
                        variant: "destructive",
                    })
                    router.push('/books')
                }
            }
        }
        
        if (!authLoading) {
            checkAdmin()
        }
    }, [user, authLoading, router, toast])

    useEffect(() => {
        if (isAdmin && bookId) {
            fetchBook()
            fetchCategories()
        }
    }, [isAdmin, bookId, fetchBook, fetchCategories])

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
        if (!fileUrl.trim()) {
            setError('File URL is required')
            return
        }

        setIsSubmitting(true)

        try {
            const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
            
            const { error: updateError } = await supabase
                .from('books')
                .update({
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
                })
                .eq('book_id', bookId)

            if (updateError) {
                if (updateError.code === '23505') {
                    setError('A book with this ISBN already exists')
                } else {
                    throw updateError
                }
                return
            }

            toast({
                title: "Success",
                description: "Book updated successfully",
            })

            router.push(`/books/${bookId}`)
        } catch (err) {
            console.error('Error updating book:', err)
            setError('Failed to update book. Please try again.')
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

    if (!user || (!isAdmin && !isLoading)) {
        return null
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.push(`/books/${bookId}`)}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Book Details
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Pencil className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Edit Book</CardTitle>
                            <CardDescription>
                                Update book information
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

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Basic Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter book title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="author">Author *</Label>
                                    <Input
                                        id="author"
                                        placeholder="Enter author name"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="isbn">ISBN</Label>
                                    <Input
                                        id="isbn"
                                        placeholder="978-0-000-00000-0"
                                        value={isbn}
                                        onChange={(e) => setIsbn(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                        disabled={isSubmitting || isLoadingCategories}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
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
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Enter book description"
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
                            <h3 className="text-lg font-medium">Publishing Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="publisher">Publisher</Label>
                                    <Input
                                        id="publisher"
                                        placeholder="Enter publisher name"
                                        value={publisher}
                                        onChange={(e) => setPublisher(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="publishDate">Publish Date</Label>
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

                        {/* Document Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Document Information</h3>

                            <div className="space-y-2">
                                <Label htmlFor="fileUpload">Upload Document File (PDF)</Label>
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
                                <Label htmlFor="fileUrl" className="text-xs text-muted-foreground mt-4 block">Or provide an external URL:</Label>
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
                                    <Label htmlFor="fileType">File Type</Label>
                                    <Select
                                        value={fileType}
                                        onValueChange={setFileType}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PDF">PDF</SelectItem>
                                            <SelectItem value="WEBNOVEL">Webnovel (Truyện chữ)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fileSize">File Size (MB)</Label>
                                    <Input
                                        id="fileSize"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g., 2.5"
                                        value={fileSize}
                                        onChange={(e) => setFileSize(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Cover Image */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Cover Image</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="coverUpload">Upload Cover Image (Max 5MB)</Label>
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
                                    <Label htmlFor="coverImageUrl" className="text-xs text-muted-foreground mt-4 block">Or provide an external URL:</Label>
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
                                onClick={() => router.push(`/books/${bookId}`)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
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
