"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Entry } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {buttonStyles} from "@/lib/styles";
import {Button} from "@/components/Button";
import { fetchTopMatches } from "@/lib/entries";
import EntryCard from "@/components/EntryCard";

function EmbeddingBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        complete: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        failed: "bg-red-100 text-red-800",
    };

    return (
        <span
            className={`text-xs px-2 py-1 rounded ${map[status] ?? "bg-gray-100"}`}
        >
      {status}
    </span>
    );
}

function EmbedControls({ entry }: { entry: any }) {
    const [status, setStatus] = useState(entry.embedding_status);
    const [running, setRunning] = useState(false);

    async function rerunEmbedding() {
        setRunning(true);
        setStatus("pending");

        try {
            await fetch("/api/embed-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: entry.id,
                    body: entry.body,
                }),
            });

            // optimistic success
            setStatus("complete");
        } catch {
            setStatus("failed");
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <EmbeddingBadge status={status} />

            <Button
                onClick={rerunEmbedding}
                variant="ghost"
                disabled={running}
                className="text-xs"
            >
                {running ? "Embedding…" : "Re-run embedding"}
            </Button>

            <Button
                variant="ghost"
                className="text-xs"
                onClick={() => fetch("/api/embed-pending", { method: "POST" })}
            >
                Embed all pending
            </Button>
        </div>
    );
}


export function RelatedEntries({ entryId }: { entryId: string }) {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false; // prevent state update if component unmounts

        async function loadMatches() {
            setLoading(true);
            try {
                const results = await fetchTopMatches(entryId, 4);
                if (!cancelled) setMatches(results); // safely update state
            } catch (err) {
                console.error("Failed to fetch matches:", err);
                if (!cancelled) setMatches([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadMatches();

        return () => {
            cancelled = true; // cleanup on unmount
        };
    }, [entryId]);

    if (loading) return <p>Loading related entries…</p>;
    if (!matches.length) return null;

    return (
        <section className="mt-8">
            <h2 className="text-lg font-bold mb-2">Similar Entries</h2>
            <div>
                {matches.map((m) => (
                    <EntryCard key={m.id} entry={m} />
                ))}
            </div>
        </section>
    );
}

export default function EntryView({ entry }: { entry: Entry }) {
    const router = useRouter()
    const supabase = createClient()
    const [deleting, setDeleting] = useState(false)

    const parts = entry.event_date.split('-')

    if (parts.length !== 3) {
        throw new Error(`Invalid event_date: ${entry.event_date}`)
    }

    const [year, month, day] = parts

    const eventDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    )
    
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return
        }

        setDeleting(true)
        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', entry.id)

        if (!error) {
            router.push('/')
            router.refresh()
        } else {
            setDeleting(false)
            alert('Failed to delete entry')
        }
    }

    return (

        <article className="">
            <div className=" mb-2">
                <div>
                    <h1 className="entry-title">
                        {entry.title}
                    </h1>


                    <time className="text-sm">
                        {eventDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                </div>
            </div>

            {/*{entry.tags.length > 0 && (*/}
            {/*    <div className="flex flex-wrap gap-2 mb-2">*/}
            {/*        {entry.tags.map((tag) => (*/}
            {/*            <span*/}
            {/*                key={tag}*/}
            {/*                className="text-xs px-2 py-1 bg-gray-100 text-gray-700"*/}
            {/*            >*/}
            {/*  {tag}*/}
            {/*</span>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}

            <div className="prose dark:prose-invert max-w-none mt-6">

                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.body}
                </ReactMarkdown>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
                <Link
                    href={`/entries/${entry.id}/edit`}
                    className={buttonStyles.secondary}
                >
                    Edit
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={buttonStyles.secondary}
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>

            {/*<EmbedControls entry={entry}></EmbedControls>*/}

            <RelatedEntries entryId={entry.id} />
        </article>
    )
}