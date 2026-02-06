"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";

type EntryEmbeddingItem = {
    id: string;
    title: string | null;
    event_date: string;
    body: string;
    embedding_status: string;
};

export default function AiToolsPanel({
    initialEntries,
}: {
    initialEntries: EntryEmbeddingItem[];
}) {
    const [entries, setEntries] = useState(initialEntries);
    const [showPending, setShowPending] = useState(false);
    const [showFailed, setShowFailed] = useState(false);
    const [rerunningId, setRerunningId] = useState<string | null>(null);
    const [embeddingPending, setEmbeddingPending] = useState(false);

    const filteredEntries = useMemo(() => {
        if (!showPending && !showFailed) return entries;

        const allowed = new Set<string>();
        if (showPending) allowed.add("pending");
        if (showFailed) allowed.add("failed");

        return entries.filter((entry) => allowed.has(entry.embedding_status));
    }, [entries, showPending, showFailed]);

    async function refreshEntryStatus(id: string) {
        const res = await fetch(`/api/entries/${id}`);
        if (!res.ok) return;
        const updated = await res.json();

        setEntries((current) =>
            current.map((entry) =>
                entry.id === id
                    ? { ...entry, embedding_status: updated.embedding_status }
                    : entry
            )
        );
    }

    async function rerunEmbedding(entryId: string, body: string) {
        setRerunningId(entryId);
        try {
            const res = await fetch("/api/embed-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: entryId, body }),
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                throw new Error(payload?.error ?? "Failed to rerun embedding.");
            }

            await refreshEntryStatus(entryId);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to rerun embedding.");
        } finally {
            setRerunningId(null);
        }
    }

    async function runPendingEmbeddings() {
        const secret = process.env.NEXT_PUBLIC_EMBED_CRON_SECRET;
        if (!secret) {
            alert("Missing NEXT_PUBLIC_EMBED_CRON_SECRET.");
            return;
        }

        setEmbeddingPending(true);
        try {
            const res = await fetch("/api/embed-pending", {
                method: "POST",
                headers: { "x-cron-secret": secret },
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                throw new Error(payload?.error ?? "Failed to run pending embeddings.");
            }

            await Promise.all(entries.map((entry) => refreshEntryStatus(entry.id)));
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to run pending embeddings."
            );
        } finally {
            setEmbeddingPending(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showPending}
                            onChange={(event) => setShowPending(event.target.checked)}
                        />
                        Pending
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showFailed}
                            onChange={(event) => setShowFailed(event.target.checked)}
                        />
                        Failed
                    </label>
                </div>

                <Button
                    variant="secondary"
                    onClick={runPendingEmbeddings}
                    disabled={embeddingPending}
                    className="text-sm"
                >
                    {embeddingPending ? "Re-running…" : "Re-run failed and pending"}
                </Button>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredEntries.map((entry) => (
                    <div
                        key={entry.id}
                        className="p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="text-sm min-w-0">
                            <Link
                                href={`/entries/${entry.id}`}
                                className="font-medium hover:underline"
                            >
                                {entry.title ?? "Untitled"}
                            </Link>
                            <span className="text-neutral-500"> · {entry.event_date}</span>
                            <span className="text-neutral-500"> · {entry.embedding_status}</span>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-xs self-start md:self-auto"
                            disabled={rerunningId === entry.id}
                            onClick={() => rerunEmbedding(entry.id, entry.body)}
                        >
                            {rerunningId === entry.id ? "Embedding…" : "Re-run embedding"}
                        </Button>
                    </div>
                ))}
                {filteredEntries.length === 0 && (
                    <div className="p-4 text-sm text-neutral-500">No matching entries.</div>
                )}
            </div>
        </div>
    );
}
