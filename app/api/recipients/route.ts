import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('email_recipients')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching recipients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/recipients called')
    
    if (!supabaseAdmin) {
      console.error('Supabase admin not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, email } = body

    if (!name || !email) {
      console.error('Missing name or email:', { name, email })
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    console.log('Attempting to insert recipient:', { name, email })
    
    const { data, error } = await supabaseAdmin
      .from('email_recipients')
      .insert([{ name, email }])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Successfully created recipient:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating recipient:', error)
    return NextResponse.json(
      { error: 'Failed to create recipient', details: error },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { id, name, email, is_active } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabaseAdmin
      .from('email_recipients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating recipient:', error)
    return NextResponse.json(
      { error: 'Failed to update recipient' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('email_recipients')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recipient:', error)
    return NextResponse.json(
      { error: 'Failed to delete recipient' },
      { status: 500 }
    )
  }
}
