// app/api/embed-pending/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { tryEmbedEntry } from "@/app/actions/entries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
    const expectedSecret = process.env.EMBED_CRON_SECRET;
    const providedSecret = (await headers()).get("x-cron-secret");

    // Allow authenticated in-app use (single user dashboard button),
    // or headless cron callers that provide the shared secret.
    let isAuthenticatedUser = false;
    try {
        const supabaseAuth = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabaseAuth.auth.getUser();
        isAuthenticatedUser = !!user;
    } catch {
        isAuthenticatedUser = false;
    }

    const hasValidSecret = !!expectedSecret && providedSecret === expectedSecret;
    if (!isAuthenticatedUser && !hasValidSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: entries, error } = await supabase
        .from("entries")
        .select("id, body")
        .in("embedding_status", ["pending", "failed"]);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let failed = 0;
    for (const entry of entries ?? []) {
        // sequential on purpose (quota safety)
        try {
            await tryEmbedEntry(entry.id, entry.body);
        } catch (error) {
            failed += 1;
            console.error("Embedding failed for entry", entry.id, error);
        }
    }

    return NextResponse.json({
        processed: entries?.length ?? 0,
        failed,
    });
}
