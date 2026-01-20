import { createClient } from "@/lib/supabase/client";

export async function fetchTopMatches(entryId: string, limit = 4) {
    const supabase = createClient();

    const { data: entry } = await supabase
        .from("entries")
        .select("embedding")
        .eq("id", entryId)
        .single();

    if (!entry?.embedding) return [];

    const { data: matches } = await supabase.rpc("match_entries", {
        query_embedding: entry.embedding,
        match_count: limit,
    });

    if (!matches) return [];

    // matches is now [{id, similarity}, ...]
    const filteredMatches = matches.filter((m: any) => m.id !== entryId);
    const ids = filteredMatches.map((m: any) => m.id);
    const { data: fullEntries } = await supabase
        .from("entries")
        .select("*")
        .in("id", ids);

    if (!fullEntries) return [];


    // merge similarity into full entries
    return fullEntries.map((entry: any) => {
        const match = matches.find((m: any) => m.id === entry.id);
        return { ...entry, similarity: match?.similarity ?? 0 };
    });
}