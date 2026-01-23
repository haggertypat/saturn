// app/api/embed-pending/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { tryEmbedEntry } from "@/app/actions/entries";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
    const expectedSecret = process.env.EMBED_CRON_SECRET;
    if (!expectedSecret) {
        return NextResponse.json({ error: "Missing cron secret" }, { status: 500 });
    }

    const providedSecret = headers().get("x-cron-secret");
    if (providedSecret !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
