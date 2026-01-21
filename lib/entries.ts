import { createClient } from "@/lib/supabase/client";
import type { Entry } from '@/lib/types'

type MatchResult = {
    id: string;
    similarity: number;
};

export type EntryWithSimilarity = Entry & {
    similarity: number;
};

export async function fetchTopMatches(entryId: string, limit = 4): Promise<EntryWithSimilarity[]> {
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

    const filteredMatches = (matches as MatchResult[]).filter((m) => m.id !== entryId);
    const ids = filteredMatches.map((m) => m.id);

    const { data: fullEntries } = await supabase
        .from("entries")
        .select("*")
        .in("id", ids);

    if (!fullEntries) return [];

    return (fullEntries as Entry[]).map((entry) => {
        const match = filteredMatches.find((m) => m.id === entry.id);
        return { ...entry, similarity: match?.similarity ?? 0 };
    });
}