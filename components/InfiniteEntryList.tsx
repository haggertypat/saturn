'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import EntryCard from './EntryCard'
import type { Entry } from '@/lib/types'
import {Button} from "@/components/Button"

function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs)
        return () => clearTimeout(t)
    }, [value, delayMs])
    return debounced
}

type EntriesResponse = {
    data: Entry[]
    nextCursor: string | null
}

export default function EntryList() {
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const [q, setQ] = useState('')
    const debouncedQ = useDebouncedValue(q, 250)

    const [order, setOrder] = useState<'asc' | 'desc'>('desc')

    const entriesRef = useRef<Entry[]>([])
    const nextCursorRef = useRef<string | null>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    const isFetchingRef = useRef(false)
    const hasMoreRef = useRef(true)

    useEffect(() => {
        hasMoreRef.current = hasMore
    }, [hasMore])

    const fetchEntries = useCallback(
        async (opts: { cursor?: string | null; q?: string; order: 'asc' | 'desc' }) => {
            const cursor = opts.cursor ?? null
            const query = (opts.q ?? '').trim()
            const ord = opts.order

            if (isFetchingRef.current) return
            if (cursor && !hasMoreRef.current) return

            isFetchingRef.current = true
            setLoading(true)

            try {
                const params = new URLSearchParams()
                params.set('order', ord)
                if (cursor) params.set('cursor', cursor)
                if (query) params.set('q', query)

                const res = await fetch(`/api/entries?${params.toString()}`)
                const json: EntriesResponse = await res.json()
                const { data, nextCursor } = json

                const newEntries = data.filter(d => !entriesRef.current.some(e => e.id === d.id))
                entriesRef.current = [...entriesRef.current, ...newEntries]
                setEntries(entriesRef.current)

                nextCursorRef.current = nextCursor
                setHasMore(!!nextCursor)
            } catch (err) {
                console.error(err)
            } finally {
                isFetchingRef.current = false
                setLoading(false)
            }
        },
        []
    )

    // This is the key useEffect change:
    // reset + fetch whenever query OR order changes
    useEffect(() => {
        entriesRef.current = []
        setEntries([])
        nextCursorRef.current = null
        setHasMore(true)

        if (observerRef.current) observerRef.current.disconnect()

        fetchEntries({ cursor: null, q: debouncedQ, order })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ, order])

    const lastEntryRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) observerRef.current.disconnect()
            if (!node) return
            if (!nextCursorRef.current) return

            observerRef.current = new IntersectionObserver(
                (observed) => {
                    const first = observed[0]
                    if (!first?.isIntersecting) return
                    if (!nextCursorRef.current) return
                    if (isFetchingRef.current) return

                    fetchEntries({ cursor: nextCursorRef.current, q: debouncedQ, order })
                },
                { rootMargin: '200px' }
            )

            observerRef.current.observe(node)
        },
        [fetchEntries, debouncedQ, order]
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search entries…"
                    className="flex-1 rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600
                     placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />

                <Button
                    onClick={() => setOrder(o => (o === 'desc' ? 'asc' : 'desc'))}
                    title="Toggle date order"
                    variant="secondary"
                >
                    {order === 'desc' ? 'Newest' : 'Oldest'}
                </Button>
            </div>

            {entries.map((entry, i) => {
                const isLast = i === entries.length - 1
                const shouldObserveLast = isLast && !!nextCursorRef.current
                return (
                    <EntryCard
                        key={entry.id}
                        ref={shouldObserveLast ? lastEntryRef : null}
                        entry={entry}
                    />
                )
            })}

            {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-md bg-gray-100 p-4 dark:bg-neutral-900" />
                ))}

            {!loading && entries.length === 0 && (
                <p className="text-center text-gray-400">
                    {debouncedQ.trim() ? 'No results' : 'No entries'}
                </p>
            )}

            {!loading && entries.length > 0 && !hasMore && (
                <p className="text-center text-gray-400">
                    {debouncedQ.trim() ? 'No more results' : 'No more entries'}
                </p>
            )}
        </div>
    )
}
