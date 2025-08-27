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
    const feedbackType = searchParams.get('feedbackType') // 'summary', 'article', or 'top10'
    const feedbackValue = searchParams.get('feedbackValue') // 'up' or 'down'

    console.log('Feedback API called with:', {
      recipientId, summaryId, articleId, feedbackType, feedbackValue
    })

    if (!recipientId || !feedbackType || !feedbackValue || (!summaryId && !articleId)) {
      console.log('Feedback API: missing required params')
      return new NextResponse('Missing required params', { status: 400 })
    }

    // Handle null values properly - convert string "null" to actual null
    const cleanArticleId = articleId === 'null' ? null : articleId
    const cleanSummaryId = summaryId === 'null' ? null : summaryId

    // Only allow one feedback per recipient per summary/article per type
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('feedback')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq(feedbackType === 'summary' || feedbackType === 'top10' ? 'summary_id' : 'article_id', feedbackType === 'summary' || feedbackType === 'top10' ? cleanSummaryId : cleanArticleId)
      .eq('feedback_type', feedbackType)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Feedback API: select error', selectError)
      return new NextResponse('DB select error', { status: 500 })
    }

    if (!existing) {
      // Get the article_ids from the summary for analytics
      let summaryArticleIds: string[] | null = null
      if (summaryId) {
        const { data: summaryData, error: summaryError } = await supabaseAdmin
          .from('daily_summaries')
          .select('article_ids')
          .eq('id', summaryId)
          .single()
        
        if (!summaryError && summaryData) {
          summaryArticleIds = summaryData.article_ids
        }
      }

      const { error: insertError } = await supabaseAdmin.from('feedback').insert({
        recipient_id: recipientId,
        summary_id: cleanSummaryId,
        article_id: cleanArticleId,
        feedback_type: feedbackType,
        feedback_value: feedbackValue,
        // Store the article_ids from the summary for analytics
        summary_article_ids: summaryArticleIds
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
    
    // Return success with flag to show comparison flow
    // Only show comparison for summary feedback and if we have a summaryId
    const shouldShowComparison = feedbackType === 'summary' && cleanSummaryId
    
    return NextResponse.json({
      success: true,
      showComparison: shouldShowComparison,
      recipientId,
      summaryId: cleanSummaryId
    })
    
  } catch (error) {
    console.error('Feedback API: unexpected error', error)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
