import { streamText, UIMessage, createUIMessageStreamResponse } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function getBookContext(query: string) {
  try {
    const searchTerm = query.trim().toLowerCase()

    // Search books by title, author, or description
    const { data: books, error } = await supabase
      .from('books')
      .select('book_id, title, author, publisher, publish_date, description, categories(name), tags, views_count')
      .or(
        `title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      )
      .limit(10)

    if (error) {
      console.error('Error searching books:', error)
      return null
    }

    // Also fetch categories for recommendation context
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .order('name')

    // Fetch top books for general recommendations
    const { data: topBooks } = await supabase
      .from('books')
      .select('book_id, title, author, categories(name), tags, views_count')
      .order('views_count', { ascending: false, nullsFirst: false })
      .limit(10)

    return {
      searchResults: books || [],
      categories: categories?.map((c: any) => c.name) || [],
      topBooks: topBooks || [],
    }
  } catch (error) {
    console.error('Error getting book context:', error)
    return null
  }
}

// Extract text content from UIMessage parts
function getMessageText(message: UIMessage): string {
  if (message.parts) {
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('')
  }
  return ''
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // v6 sends messages as UIMessage[] with parts
    const messages: UIMessage[] = body.messages || []

    // Extract the latest user message for book search
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')

    const lastUserText = lastUserMessage ? getMessageText(lastUserMessage) : ''

    // Get book context from database
    const bookContext = lastUserText
      ? await getBookContext(lastUserText)
      : null

    // Build context string
    let contextInfo = ''
    if (bookContext) {
      if (bookContext.searchResults.length > 0) {
        contextInfo += '\n\n📚 KẾT QUẢ TÌM KIẾM TỪ THƯ VIỆN:\n'
        bookContext.searchResults.forEach((book: any, i: number) => {
          contextInfo += `${i + 1}. "${book.title}" - Tác giả: ${book.author || 'Không rõ'}`
          if (book.categories?.name) contextInfo += ` | Thể loại: ${book.categories.name}`
          if (book.publisher) contextInfo += ` | NXB: ${book.publisher}`
          if (book.description) contextInfo += `\n   Mô tả: ${book.description.substring(0, 150)}...`
          contextInfo += '\n'
        })
      }

      if (bookContext.topBooks.length > 0) {
        contextInfo += '\n📈 SÁCH PHỔ BIẾN NHẤT:\n'
        bookContext.topBooks.forEach((book: any, i: number) => {
          contextInfo += `${i + 1}. "${book.title}" - ${book.author || 'Không rõ'} (${book.views_count || 0} lượt xem)`
          if (book.categories?.name) contextInfo += ` [${book.categories.name}]`
          contextInfo += '\n'
        })
      }

      if (bookContext.categories.length > 0) {
        contextInfo += `\n📂 CÁC THỂ LOẠI SÁCH HIỆN CÓ: ${bookContext.categories.join(', ')}\n`
      }
    }

    const systemPrompt = `Bạn là "Trợ Lý Thư Viện AI" của hệ thống Thư Viện Online - thư viện tài liệu online hàng đầu, miễn phí.

NHIỆM VỤ CỦA BẠN:
1. **Hỗ trợ tìm sách**: Giúp người dùng tìm sách phù hợp dựa trên tiêu đề, tác giả, thể loại, hoặc chủ đề họ quan tâm.
2. **Tư vấn sách**: Đề xuất sách phù hợp dựa trên sở thích, nhu cầu học tập, hoặc mục đích đọc của người dùng.
3. **Trả lời câu hỏi chung**: Trả lời các câu hỏi về cách sử dụng thư viện, tìm kiếm tài liệu, và các thông tin liên quan.

QUY TẮC:
- Luôn trả lời bằng tiếng Việt
- Thân thiện, nhiệt tình và chuyên nghiệp
- Khi giới thiệu sách, hãy cung cấp lý do tại sao cuốn sách đó phù hợp
- Nếu không tìm thấy sách phù hợp trong thư viện, hãy thông báo cho người dùng và gợi ý họ tìm kiếm với từ khóa khác
- Khi gợi ý sách, hãy đề cập rằng người dùng có thể tìm và đọc sách trên trang "Tủ Sách" của website
- Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin
- Sử dụng emoji phù hợp để làm cho câu trả lời sinh động hơn
- Nếu người dùng hỏi về các chủ đề không liên quan đến sách/thư viện, hãy trả lời lịch sự rồi hướng họ quay lại chủ đề sách

DỮ LIỆU THƯ VIỆN HIỆN TẠI:
${contextInfo || 'Không có dữ liệu tìm kiếm cụ thể cho câu hỏi này.'}

Hãy trả lời dựa trên dữ liệu thư viện ở trên khi có thể. Nếu dữ liệu tìm kiếm có sách phù hợp, hãy giới thiệu chúng cho người dùng.`

    // Convert UIMessages to CoreMessages for streamText
    const coreMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: getMessageText(m),
      }))
      .filter((m) => m.content) // skip empty messages

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: coreMessages,
    })

    return createUIMessageStreamResponse({
      stream: result.toUIMessageStream(),
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
