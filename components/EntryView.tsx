"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Entry } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {Button} from "@/components/Button";
import { fetchTopMatches } from "@/lib/entries";
import EntryCard from "@/components/EntryCard";
import {EntryWithSimilarity} from "@/lib/entries";
import {PencilIcon, AdjustmentsHorizontalIcon} from '@heroicons/react/24/outline'
import StarredBadge from '@/components/StarredBadge'

function EmbeddingBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        complete: "bg-neutral-100 text-neutral-800",
        pending: "bg-neutral-100 text-neutral-800",
        failed: "bg-neutral-100 text-neutral-800",
    };

    return (
        <div>
            <span className="text-xs px-2 py-1">Embedding status: </span>
            <span
                className={`text-xs px-2 py-1 rounded ${map[status] ?? "bg-gray-100"}`}
            >
                {status}
            </span>
        </div>
    )
}

function EmbedControls({
                           entryId,
                           body,
                           status,
                       }: {
    entryId: string;
    body: string;
    status: Entry["embedding_status"];
}) {
    //const [running, setRunning] = useState(false);

    // async function rerunEmbedding() {
    //     setRunning(true);
    //
    //     try {
    //         const res = await fetch("/api/embed-entry", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ id: entryId, body: body }),
    //         });
    //         if (!res.ok) {
    //             const payload = await res.json().catch(() => null);
    //             const message = payload?.error ?? "Failed to rerun embedding.";
    //             throw new Error(message);
    //         }
    //     } catch (error) {
    //         const message =
    //             error instanceof Error ? error.message : "Failed to rerun embedding.";
    //         alert(message);
    //     } finally {
    //         setRunning(false);
    //     }
    // }

    return (
        <div className="flex items-center gap-2">
            <EmbeddingBadge status={status} />

            {/*<Button*/}
            {/*    onClick={rerunEmbedding}*/}
            {/*    variant="ghost"*/}
            {/*    disabled={running}*/}
            {/*    className="text-xs"*/}
            {/*>*/}
            {/*    {running ? "Embedding…" : "Re-run"}*/}
            {/*</Button>*/}

            {/*<Button*/}
            {/*    variant="ghost"*/}
            {/*    className="text-xs"*/}
            {/*    onClick={() => {*/}
            {/*        const secret = process.env.NEXT_PUBLIC_EMBED_CRON_SECRET;*/}
            {/*        if (!secret) {*/}
            {/*            alert("Missing NEXT_PUBLIC_EMBED_CRON_SECRET.");*/}
            {/*            return;*/}
            {/*        }*/}
            {/*        fetch("/api/embed-pending", {*/}
            {/*            method: "POST",*/}
            {/*            headers: { "x-cron-secret": secret },*/}
            {/*        });*/}
            {/*    }}*/}
            {/*>*/}
            {/*    Embed all pending*/}
            {/*</Button>*/}
        </div>
    );
}

export function RelatedEntries({ entryId }: { entryId: string }) {
    const [matches, setMatches] = useState<EntryWithSimilarity[]>([]);
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
                    <EntryCard
                        key={m.id}
                        entry={m}
                        onDelete={(id) => setMatches((prev) => prev.filter((item) => item.id !== id))}
                    />
                ))}
            </div>
        </section>
    );
}

export default function EntryView({ entry }: { entry: Entry }) {
    const router = useRouter()
    const supabase = createClient()
    const [deleting, setDeleting] = useState(false)
    const [settingsVisible, setSettingsVisible] = useState(false);

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

    const [currentEntry, setCurrentEntry] = useState(entry);

    useEffect(() => {
        // Only poll if we expect a change
        if (currentEntry.embedding_status === "complete") return;

        let cancelled = false;

        const poll = async () => {
            const res = await fetch(`/api/entries/${currentEntry.id}`);
            const updated = await res.json();
            console.log("polled entry", {
                status: updated.embedding_status,
                hasEmbedding: !!updated.embedding,
            });
            console.log(updated)
            if (cancelled) return;

            setCurrentEntry(updated);

            if (updated.embedding_status !== "complete") {
                setTimeout(poll, 1500);
            }
        };

        poll();

        return () => {
            cancelled = true;
        };
    }, [currentEntry.id, currentEntry.embedding_status]);


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
            <div className="mb-2">
                <div>
                    <div className="flex justify-between items-center group">
                        <div>
                            <h1 className="entry-title">
                                {entry.title ?? 'Untitled'}
                            </h1>
                            {entry.category && (
                                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                    {entry.category}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Button
                                href={`/entries/${entry.id}/edit`}
                                variant="secondary"
                                className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <PencilIcon className="h-4 w-4" /> Edit
                            </Button>
                        </div>
                    </div>

                    <time className="text-sm">
                        {eventDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mt-6">

                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.body}
                </ReactMarkdown>
            </div>

            <div className="flex items-center justify-end mt-6 gap-4 pt-6 border-t border-gray-200">
                { settingsVisible && (
                    <EmbedControls entryId={currentEntry.id} body={currentEntry.body} status={currentEntry.embedding_status}></EmbedControls>
                )}
                { settingsVisible && (
                    <Button
                        href={`/entries/${entry.id}/edit`}
                        variant="secondary"
                        className="inline-flex items-center gap-1"
                    >
                        <PencilIcon className="h-4 w-4" /> Edit
                    </Button>
                )}
                { settingsVisible && (
                    <Button
                        onClick={handleDelete}
                        disabled={deleting}
                        variant="secondary"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                )}
                <AdjustmentsHorizontalIcon
                    className="h-5 w-5 cursor-pointer"
                    onClick={() => setSettingsVisible(v => !v)} />
                <StarredBadge
                    entryId={entry.id}
                    initialStarred={entry.starred}
                />

            </div>

            {currentEntry.embedding_status === "complete" &&
                currentEntry.embedding != null && (
                    <RelatedEntries entryId={currentEntry.id} />
            )}
        </article>
    )
}
