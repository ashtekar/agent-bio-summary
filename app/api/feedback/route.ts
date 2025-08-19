import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.log('Feedback API: supabaseAdmin not configured')
      return new NextResponse('Supabase not configured', { status: 500 })
    }
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const summaryId = searchParams.get('summaryId')
    const articleId = searchParams.get('articleId')
    const feedbackType = searchParams.get('feedbackType') // 'summary' or 'article'
    const feedbackValue = searchParams.get('feedbackValue') // 'up' or 'down'

    console.log('Feedback API called with:', {
      recipientId, summaryId, articleId, feedbackType, feedbackValue
    })

    if (!recipientId || !feedbackType || !feedbackValue || (!summaryId && !articleId)) {
      console.log('Feedback API: missing required params')
      return new NextResponse('Missing required params', { status: 400 })
    }

    // Only allow one feedback per recipient per summary/article per type
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('feedback')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq(feedbackType === 'summary' ? 'summary_id' : 'article_id', feedbackType === 'summary' ? summaryId : articleId)
      .eq('feedback_type', feedbackType)
      .single()

    if (selectError) {
      console.error('Feedback API: select error', selectError)
    }

    if (!existing) {
      const { error: insertError } = await supabaseAdmin.from('feedback').insert({
        recipient_id: recipientId,
        summary_id: summaryId,
        article_id: articleId,
        feedback_type: feedbackType,
        feedback_value: feedbackValue
      })
      if (insertError) {
        console.error('Feedback API: insert error', insertError)
        return new NextResponse('DB insert error', { status: 500 })
      } else {
        console.log('Feedback API: feedback inserted')
      }
    } else {
      console.log('Feedback API: feedback already exists')
    }
    // Always return 204 No Content for silent feedback
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Feedback API: unexpected error', error)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
