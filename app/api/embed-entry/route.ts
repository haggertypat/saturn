// app/api/embed-entry/route.ts
import { NextResponse } from "next/server";
import { tryEmbedEntry } from "@/app/actions/entries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, body } = await req.json();

    // do not throw — background job
    try {
        await tryEmbedEntry(id, body);
    } catch {}

    return NextResponse.json({ ok: true });
}
