export interface Entry {
    id: string
    title: string
    body: string
    event_date: string
    created_at: string
    updated_at: string
    tags: string[]
}

export type RelatedEntryMatch = {
    id: string;
    body: string;
    similarity: number;   // 0 to 1, as returned by the vector match
};