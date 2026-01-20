// lib/entries.ts
import {createClient} from "@/lib/supabase/client";

export async function fetchTopMatches(entryId: string, limit = 3) {
    const supabase = createClient()

    // fetch the entry embedding first
    const { data: entry, error: entryError } = await supabase
        .from("entries")
        .select("id, embedding")
        .eq("id", entryId)
        .single();

    if (entryError || !entry?.embedding) return [];

    // call your SQL function
    const { data: matches, error: matchError } = await supabase
        .rpc("match_entries", {
            query_embedding: entry.embedding,
            match_count: limit,
        });

    if (matchError) {
        console.error("Error fetching matches:", matchError);
        return [];
    }

    // filter out the current entry
    const filteredMatches = matches.filter((m: any) => m.id !== entryId);
    const ids = filteredMatches.map(m => m.id)
    const { data: entries } = await supabase
        .from('entries')
        .select('*')
        .in('id', ids)
    return entries

}
