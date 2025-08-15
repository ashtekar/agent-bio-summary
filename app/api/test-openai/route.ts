import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get the model from system settings
    let selectedModel = 'gpt-4o-mini' // default
    if (supabaseAdmin) {
      const { data: systemSettings, error: systemError } = await supabaseAdmin
        .from('system_settings')
        .select('openai_model')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!systemError && systemSettings?.openai_model) {
        selectedModel = systemSettings.openai_model
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    console.log('Testing OpenAI API with model:', selectedModel)

    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Say "Hello, this is a test!"'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content
    console.log('OpenAI response:', response)
    console.log('Content:', content)
    console.log('Content length:', content?.length || 0)

    return NextResponse.json({
      success: true,
      content,
      contentLength: content?.length || 0,
      fullResponse: response
    })

  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
