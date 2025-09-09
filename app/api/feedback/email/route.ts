import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.log('Email Feedback API: supabaseAdmin not configured')
      return new NextResponse('Supabase not configured', { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const summaryId = searchParams.get('summaryId')
    const articleId = searchParams.get('articleId')
    const feedbackType = searchParams.get('feedbackType') // 'summary', 'article', or 'top10'
    const feedbackValue = searchParams.get('feedbackValue') // 'up' or 'down'

    console.log('Email Feedback API called with:', {
      recipientId, summaryId, articleId, feedbackType, feedbackValue
    })

    // Validate required parameters
    if (!recipientId || !feedbackType || !feedbackValue || (!summaryId && !articleId)) {
      console.log('Email Feedback API: missing required params')
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Handle null values properly - convert string "null" to actual null
    const cleanArticleId = articleId === 'null' ? null : articleId
    const cleanSummaryId = summaryId === 'null' ? null : summaryId

    // Check if feedback already exists
    const { data: existingFeedback } = await supabaseAdmin
      .from('feedback')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('summary_id', cleanSummaryId)
      .eq('article_id', cleanArticleId)
      .eq('feedback_type', feedbackType)
      .single()

    if (!existingFeedback) {
      // Insert new feedback
      const { error: insertError } = await supabaseAdmin
        .from('feedback')
        .insert({
          recipient_id: recipientId,
          summary_id: cleanSummaryId,
          article_id: cleanArticleId,
          feedback_type: feedbackType,
          feedback_value: feedbackValue
        })

      if (insertError) {
        console.error('Email Feedback API: insert error', insertError)
        return NextResponse.json(
          { error: 'Failed to record feedback' },
          { status: 500 }
        )
      }
      
      console.log('Email Feedback API: feedback recorded successfully')
    } else {
      console.log('Email Feedback API: feedback already exists')
    }
    
    // Return success with flag to show comparison flow
    // Show comparison for summary and top10 feedback types when we have a summaryId
    const shouldShowComparison = (feedbackType === 'summary' || feedbackType === 'top10') && cleanSummaryId
    
    return NextResponse.json({
      success: true,
      showComparison: shouldShowComparison,
      recipientId,
      summaryId: cleanSummaryId,
      message: 'Feedback recorded successfully'
    })
    
  } catch (error) {
    console.error('Email Feedback API: unexpected error', error)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
