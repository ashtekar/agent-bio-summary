import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured', env: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }},
        { status: 500 }
      )
    }

    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('email_recipients')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      data: data
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { error: 'Database test failed', details: error },
      { status: 500 }
    )
  }
}
