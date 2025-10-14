import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Admin endpoint for debugging webhook events
 * Shows recent webhook events and their processing status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const eventType = searchParams.get('event_type')
    const showFailedOnly = searchParams.get('failed_only') === 'true'
    
    // Build query
    let query = supabase
      .from('dodo_webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    
    if (showFailedOnly) {
      query = query.eq('processed', false)
    }
    
    const { data: events, error } = await query
    
    if (error) {
      console.error('[WebhookDebug] Error fetching events:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch webhook events',
        details: error 
      }, { status: 500 })
    }
    
    // Group events by status
    const stats = {
      total: events?.length || 0,
      processed: events?.filter((e: any) => e.processed === true).length || 0,
      failed: events?.filter((e: any) => e.processed === false && e.error_message).length || 0,
      pending: events?.filter((e: any) => e.processed === false && !e.error_message).length || 0,
    }
    
    // Group by event type
    const eventTypeCounts = events?.reduce((acc: any, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {})
    
    return NextResponse.json({
      stats,
      eventTypeCounts,
      events: events?.map((event: any) => ({
        id: event.id,
        event_id: event.event_id,
        event_type: event.event_type,
        processed: event.processed,
        error_message: event.error_message,
        created_at: event.created_at,
        data: event.data
      }))
    })
    
  } catch (error) {
    console.error('[WebhookDebug] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Retry a failed webhook event
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { event_id } = body
    
    if (!event_id) {
      return NextResponse.json({ 
        error: 'Missing event_id' 
      }, { status: 400 })
    }
    
    // Get the event
    const { data: event, error } = await supabase
      .from('dodo_webhook_events')
      .select('*')
      .eq('event_id', event_id)
      .single()
    
    if (error || !event) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
    }
    
    // Mark as unprocessed to allow retry
    const { error: updateError } = await supabase
      .from('dodo_webhook_events')
      .update({ 
        processed: false,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', event_id)
    
    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update event',
        details: updateError 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Event marked for retry. It will be reprocessed on next webhook delivery or you can manually process it.',
      event_id
    })
    
  } catch (error) {
    console.error('[WebhookDebug] Retry error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

