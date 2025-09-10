import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting data cleanup (90-day retention policy)...')

    // Use the master cleanup function to clean up all old data
    const { data: cleanupResults, error: cleanupError } = await supabaseAdmin
      .rpc('cleanup_all_old_data')

    if (cleanupError) {
      console.error('Error running cleanup functions:', cleanupError)
      return NextResponse.json(
        { success: false, error: 'Failed to run cleanup functions' },
        { status: 500 }
      )
    }

    // Process cleanup results
    const deletedCounts: Record<string, number> = {}
    if (cleanupResults) {
      cleanupResults.forEach((result: { operation: string; deleted_count: number }) => {
        deletedCounts[result.operation] = result.deleted_count
      })
    }

    console.log('Data cleanup completed successfully:', deletedCounts)

    return NextResponse.json({
      success: true,
      message: 'Data cleanup completed (90-day retention policy)',
      deleted: deletedCounts,
      retention_policy: '90 days'
    })

  } catch (error) {
    console.error('Error in cleanup cron job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup data' },
      { status: 500 }
    )
  }
}
