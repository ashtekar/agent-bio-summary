import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    console.log('Testing OpenAI API with simple prompt...')

    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano-2025-08-07',
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
      max_completion_tokens: 100
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
