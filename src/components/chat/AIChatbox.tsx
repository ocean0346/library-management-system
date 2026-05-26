'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Minus,
} from 'lucide-react'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant' as const,
  content:
    'Xin chào! 👋 Tôi là Trợ Lý Thư Viện AI. Tôi có thể giúp bạn:\n\n📚 **Tìm kiếm sách** theo tên, tác giả hoặc thể loại\n💡 **Tư vấn sách** phù hợp với sở thích của bạn\n❓ **Trả lời câu hỏi** về thư viện\n\nBạn cần tôi giúp gì?',
  parts: [
    {
      type: 'text' as const,
      text: 'Xin chào! 👋 Tôi là Trợ Lý Thư Viện AI. Tôi có thể giúp bạn:\n\n📚 **Tìm kiếm sách** theo tên, tác giả hoặc thể loại\n💡 **Tư vấn sách** phù hợp với sở thích của bạn\n❓ **Trả lời câu hỏi** về thư viện\n\nBạn cần tôi giúp gì?',
    },
  ],
}

const QUICK_QUESTIONS = [
  { label: '📚 Sách phổ biến', text: 'Cho tôi xem những cuốn sách phổ biến nhất' },
  { label: '🔍 Tìm sách', text: 'Tôi muốn tìm sách về lập trình' },
  { label: '💡 Gợi ý sách', text: 'Gợi ý cho tôi một cuốn sách hay để đọc' },
]

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [localInput, setLocalInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: [WELCOME_MESSAGE],
    onError: (err) => {
      console.error('Chat error:', err)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const doSend = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return
      const msg = text.trim()
      setLocalInput('')
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
      sendMessage({ text: msg })
    },
    [isLoading, sendMessage]
  )

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      doSend(localInput)
    },
    [localInput, doSend]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        doSend(localInput)
      }
    },
    [localInput, doSend]
  )

  const handleReset = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setLocalInput('')
  }, [setMessages])

  const handleQuickQuestion = useCallback(
    (text: string) => {
      doSend(text)
    },
    [doSend]
  )

  // Format message content with basic markdown
  const formatMessage = useCallback((content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
  }, [])

  // Extract text content from message (handles both string content and parts)
  const getMessageContent = useCallback((message: any): string => {
    if (typeof message.content === 'string' && message.content) {
      return message.content
    }
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('')
    }
    return ''
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Floating Button */}
      <button
        id="ai-chatbox-toggle"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setIsMinimized(false)
        }}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-500 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Mở trợ lý AI"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#02FF73] to-[#09ADAA] blur-lg opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" />

          {/* Button */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-[#02FF73] to-[#09ADAA] shadow-lg shadow-[#02FF73]/25 hover:shadow-[#02FF73]/40 hover:scale-110 transition-all duration-300">
            <MessageCircle className="w-6 h-6 text-black" />
          </div>

          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce" />
        </div>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-75 opacity-0 translate-y-8 pointer-events-none'
        }`}
        style={{ width: isMinimized ? '320px' : '400px' }}
      >
        <div
          className={`flex flex-col bg-background border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-[60px]' : 'h-[560px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#02FF73]/10 to-[#09ADAA]/10 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#02FF73] to-[#09ADAA]">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-none">Trợ Lý Thư Viện AI</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block w-1 h-1 bg-[#02FF73] rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="inline-block w-1 h-1 bg-[#02FF73] rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="inline-block w-1 h-1 bg-[#02FF73] rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                      <span className="ml-1">Đang suy nghĩ...</span>
                    </span>
                  ) : (
                    'Powered by Gemini AI'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                title="Cuộc trò chuyện mới"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
                {messages.map((message, index) => {
                  const content = getMessageContent(message)
                  const role = message.role as string
                  if (!content) return null

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2.5 animate-fade-in ${
                        role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${
                          role === 'assistant'
                            ? 'bg-gradient-to-br from-[#02FF73] to-[#09ADAA]'
                            : 'bg-primary/20'
                        }`}
                      >
                        {role === 'assistant' ? (
                          <Bot className="w-4 h-4 text-black" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          role === 'user'
                            ? 'bg-gradient-to-r from-[#02FF73] to-[#09ADAA] text-black rounded-br-md'
                            : 'bg-muted/60 text-foreground rounded-bl-md border border-border/30'
                        }`}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(content),
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 animate-fade-in">
                    <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#02FF73] to-[#09ADAA]">
                      <Bot className="w-4 h-4 text-black" />
                    </div>
                    <div className="bg-muted/60 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1.5">
                        <span
                          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error display */}
                {error && !isLoading && (
                  <div className="flex gap-2.5 animate-fade-in">
                    <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                      <Bot className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm bg-red-500/10 border border-red-500/20 text-red-600">
                      ⚠️ Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau giây lát.
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions - only show at start */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickQuestion(q.text)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 hover:bg-[#02FF73]/10 hover:border-[#02FF73]/30 text-muted-foreground hover:text-foreground transition-all duration-200"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-border/50 p-3">
                <form
                  onSubmit={handleFormSubmit}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={localInput}
                      onChange={(e) => setLocalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Hỏi về sách, tìm tài liệu..."
                      rows={1}
                      className="w-full resize-none rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#02FF73]/30 focus:border-[#02FF73]/50 transition-all max-h-24 overflow-y-auto"
                      style={{
                        height: 'auto',
                        minHeight: '40px',
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = `${Math.min(target.scrollHeight, 96)}px`
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!localInput.trim() || isLoading}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-[#02FF73] to-[#09ADAA] text-black shadow-md shadow-[#02FF73]/20 hover:shadow-[#02FF73]/40 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                  AI có thể mắc sai lầm. Hãy kiểm tra lại thông tin quan trọng.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
