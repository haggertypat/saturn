export interface Entry {
    id: string
    title: string
    body: string
    event_date: string
    created_at: string
    updated_at: string
    tags: string[]
    embedding_status: string
    embedding: number
}

// Partial match returned by the SQL RPC
export type RelatedEntryMatchPartial = {
    id: string;
    body: string;
    similarity: number;
};

// Full entry with similarity attached
export type RelatedEntryFull = {
    id: string;
    title: string;
    body: string;
    event_date: string;
    tags: string[];
    similarity: number; // preserved from RPC
};