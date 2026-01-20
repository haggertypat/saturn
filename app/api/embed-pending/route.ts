// app/api/embed-pending/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tryEmbedEntry } from "@/app/actions/entries";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
    const { data: entries } = await supabase
        .from("entries")
        .select("id, body")
        .in("embedding_status", ["pending", "failed"]);

    for (const entry of entries ?? []) {
        // sequential on purpose (quota safety)
        await tryEmbedEntry(entry.id, entry.body);
    }

    return NextResponse.json({
        processed: entries?.length ?? 0,
    });
}
