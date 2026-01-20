import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
    const supabase = await createServerSupabaseClient()

    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor')
    const limit = 10

    let query = supabase
        .from('entries')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(limit)

    if (cursor) {
        query = query.lt('event_date', cursor) // fetch older entries
    }

    const { data, error } = await query

    if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const nextCursor = data.length ? data[data.length - 1].event_date : null

    return NextResponse.json({ data, nextCursor })
}
