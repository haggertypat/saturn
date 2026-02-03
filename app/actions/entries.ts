"use server";

import { createClient } from "@supabase/supabase-js";
import { embedText } from "@/lib/embeddings";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Best-effort enrichment
 * Safe to call multiple times
 */
export async function tryEmbedEntry(entryId: string, body: string) {
    try {
        const embedding = await embedText(body);

        const { error } = await supabase
            .from("entries")
            .update({
                embedding,
                embedding_status: "complete",
                embedding_error: null,
            })
            .eq("id", entryId);
        if (error) {
            throw new Error(`Failed to update embedding: ${error.message}`);
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        const { error } = await supabase
            .from("entries")
            .update({
                embedding_status: "failed",
                embedding_error: err.message ?? "embedding failed",
            })
            .eq("id", entryId);
        if (error) {
            throw new Error(`Failed to persist embedding error: ${error.message}`);
        }
        throw err;
    }
}
