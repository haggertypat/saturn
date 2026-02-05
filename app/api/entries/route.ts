import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const LIMIT = 10;

export async function GET(req: Request) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor"); // encoded JSON string
    const qRaw = url.searchParams.get("q") ?? "";
    const q = qRaw.trim();
    const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const starredOnly = url.searchParams.get('starred') === 'true'

    let query = supabase
        .from("entries")
        .select("*")
        .order('event_date', { ascending: order === 'asc' })
        .limit(LIMIT);

    if (q.length > 0) {
        // Basic substring match (case-insensitive)
        query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    }

    if (starredOnly) {
        query = query.eq('starred', true);
    }

    if (cursor) {
        // cursor is JSON: {"event_date":"...","id":"..."}
        let c: { event_date: string; id: string };
        try {
            c = JSON.parse(cursor);
        } catch {
            return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
        }

        // Fetch rows "after" the cursor in our (event_date desc, id desc) ordering:
        // (event_date < c.event_date) OR (event_date = c.event_date AND id < c.id)
        query =
            order === 'asc'
                ? query.or(
                    `event_date.gt.${c.event_date},and(event_date.eq.${c.event_date},id.gt.${c.id})`
                )
                : query.or(
                    `event_date.lt.${c.event_date},and(event_date.eq.${c.event_date},id.lt.${c.id})`
                )
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const last = data?.[data.length - 1];
    const nextCursor =
        last ? JSON.stringify({ event_date: last.event_date, id: last.id }) : null;

    return NextResponse.json({ data, nextCursor });
}
