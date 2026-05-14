'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Quote,
    ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo,
    Redo,
    RemoveFormatting,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadFileToSupabase } from '@/lib/storage'
import { useToast } from '@/hooks/use-toast'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    if (!editor) {
        return null
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast({ title: 'Lỗi định dạng', description: 'Vui lòng chọn file hình ảnh!', variant: 'destructive'})
            return
        }

        try {
            setIsUploading(true)
            const url = await uploadFileToSupabase(file, { folder: 'chapter_images', maxSizeMB: 5 })
            editor.chain().focus().setImage({ src: url }).run()
        } catch (error: any) {
            toast({ title: 'Tải ảnh thất bại', description: error.message, variant: 'destructive'})
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/40 rounded-t-md">
            <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                title="In đậm (Ctrl+B)"
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                title="In nghiêng (Ctrl+I)"
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('underline')}
                onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                title="Gạch chân (Ctrl+U)"
            >
                <UnderlineIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                title="Gạch ngang"
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Tiêu đề 1"
            >
                <Heading1 className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Tiêu đề 2"
            >
                <Heading2 className="h-4 w-4" />
            </Toggle>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'left' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                title="Căn trái"
            >
                <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'center' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                title="Căn giữa"
            >
                <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'right' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                title="Căn phải"
            >
                <AlignRight className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'justify' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
                title="Căn đều"
            >
                <AlignJustify className="h-4 w-4" />
            </Toggle>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <Toggle
                size="sm"
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                title="Danh sách không chấm"
            >
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                title="Danh sách theo thứ tự"
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('blockquote')}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                title="Trích dẫn"
            >
                <Quote className="h-4 w-4" />
            </Toggle>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <input 
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <Button
                variant="ghost"
                size="sm"
                onClick={triggerUpload}
                disabled={isUploading}
                className="hover:bg-accent hover:text-accent-foreground px-2.5 h-8 relative"
                title="Chèn ảnh từ máy tính"
            >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </Button>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="hover:bg-accent hover:text-accent-foreground px-2.5 h-8"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="hover:bg-accent hover:text-accent-foreground px-2.5 h-8"
            >
                <Redo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                className="hover:bg-accent hover:text-accent-foreground px-2.5 h-8"
                title="Xóa định dạng"
            >
                <RemoveFormatting className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-md max-w-full my-4 shadow-sm mx-auto',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'justify'
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-5 py-4 bg-background rounded-b-md text-base leading-loose prose-p:mb-5 prose-headings:font-display prose-img:block',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Handle paste: convert clipboard content to proper paragraphs
    useEffect(() => {
        if (!editor) return

        const editorElement = editor.view.dom

        const buildParagraphsFromText = (rawText: string): string => {
            const cleanText = rawText.replace(/\t/g, ' ').replace(/ {2,}/g, ' ')

            // Case 1: Has double newlines → clear paragraph breaks
            if (cleanText.includes('\n\n')) {
                return cleanText
                    .split(/\n\s*\n/)
                    .map(block => {
                        const joined = block.split(/\n/).map(l => l.trim()).filter(Boolean).join(' ')
                        return joined ? `<p>${joined}</p>` : ''
                    })
                    .filter(Boolean)
                    .join('')
            }

            // Case 2: Only single newlines (PDF/ebook word-wrap)
            // "Short line" heuristic: the last line of a paragraph is usually
            // shorter than other lines because it doesn't fill the full width.
            const lines = cleanText.split(/\n/).map(l => l.trim()).filter(Boolean)
            if (lines.length <= 1) return lines[0] ? `<p>${lines[0]}</p>` : ''

            // Calculate max line length — full-width lines are this long
            // A paragraph's last line is shorter because it doesn't fill the width
            const maxLen = Math.max(...lines.map(l => l.length))
            const shortThreshold = maxLen * 0.85

            const result: string[] = []
            let current = lines[0]

            for (let i = 1; i < lines.length; i++) {
                const prevLine = lines[i - 1]
                const isShortLine = prevLine.length < shortThreshold
                const endsWithPunctuation = /[.!?»"':]$/.test(prevLine)

                if (isShortLine && endsWithPunctuation) {
                    // Short line + ends with punctuation = end of paragraph
                    result.push(current.trim())
                    current = lines[i]
                } else {
                    // Normal word-wrap, join with space
                    current += ' ' + lines[i]
                }
            }
            if (current.trim()) result.push(current.trim())

            return result.map(p => `<p>${p}</p>`).join('')
        }

        const handlePaste = (e: ClipboardEvent) => {
            const html = e.clipboardData?.getData('text/html')
            const text = e.clipboardData?.getData('text/plain')
            let paragraphs = ''

            if (html) {
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = html
                tempDiv.querySelectorAll('style, script, meta, link').forEach(el => el.remove())
                const hasBlocks = tempDiv.querySelector('p, div, h1, h2, h3, h4, h5, h6, li, blockquote')

                if (hasBlocks) {
                    const blocks: string[] = []
                    const walk = (node: Node) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const t = node.textContent?.trim()
                            if (t) {
                                if (blocks.length === 0) blocks.push('')
                                blocks[blocks.length - 1] += (blocks[blocks.length - 1] ? ' ' : '') + t
                            }
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            const tag = (node as HTMLElement).tagName.toLowerCase()
                            if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tag)) {
                                if (blocks.length > 0 && blocks[blocks.length - 1] !== '') blocks.push('')
                                node.childNodes.forEach(walk)
                                blocks.push('')
                            } else if (tag === 'br') {
                                blocks.push('')
                            } else {
                                node.childNodes.forEach(walk)
                            }
                        }
                    }
                    tempDiv.childNodes.forEach(walk)
                    paragraphs = blocks.map(b => b.trim()).filter(Boolean).map(b => `<p>${b}</p>`).join('')
                } else if (text) {
                    paragraphs = buildParagraphsFromText(text)
                }
            } else if (text && text.includes('\n')) {
                paragraphs = buildParagraphsFromText(text)
            }

            if (paragraphs) {
                e.preventDefault()
                e.stopPropagation()
                editor.commands.insertContent(paragraphs)
            }
        }

        editorElement.addEventListener('paste', handlePaste, true)
        return () => editorElement.removeEventListener('paste', handlePaste, true)
    }, [editor])

    // Sync external content changes into the editor (e.g. when fetching to Edit chapter)
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
        editor.commands.setContent(content)
    }

    return (
        <div className="border border-input rounded-md shadow-sm overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-primary transition-shadow bg-background">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto max-h-[600px] min-h-[400px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
