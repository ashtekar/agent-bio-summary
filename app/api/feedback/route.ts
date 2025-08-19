import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return new NextResponse(null, { status: 204 })
    }
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const summaryId = searchParams.get('summaryId')
    const articleId = searchParams.get('articleId')
    const feedbackType = searchParams.get('feedbackType') // 'summary' or 'article'
    const feedbackValue = searchParams.get('feedbackValue') // 'up' or 'down'

    if (!recipientId || !feedbackType || !feedbackValue || (!summaryId && !articleId)) {
      return new NextResponse(null, { status: 204 })
    }

    // Only allow one feedback per recipient per summary/article per type
    const { data: existing } = await supabaseAdmin
      .from('feedback')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq(feedbackType === 'summary' ? 'summary_id' : 'article_id', feedbackType === 'summary' ? summaryId : articleId)
      .eq('feedback_type', feedbackType)
      .single()

    if (!existing) {
      await supabaseAdmin.from('feedback').insert({
        recipient_id: recipientId,
        summary_id: summaryId,
        article_id: articleId,
        feedback_type: feedbackType,
        feedback_value: feedbackValue
      })
    }
    // Always return 204 No Content for silent feedback
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    // Always return 204 No Content for silent feedback
    return new NextResponse(null, { status: 204 })
  }
}
