'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import EntryCard from './EntryCard'
import type { Entry } from '@/lib/types'

export default function EntryList() {
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const nextCursorRef = useRef<string | null>(null)
    const observerRef = useRef<IntersectionObserver>()
    const entriesRef = useRef<Entry[]>([])

    const fetchEntries = async (cursor?: string) => {
        if (loading || !hasMore) return
        setLoading(true)

        try {
            const res = await fetch(`/api/entries?cursor=${cursor || ''}`)
            const { data, nextCursor } = await res.json()

            // Deduplicate just in case
            const newEntries = data.filter(d => !entriesRef.current.some(e => e.id === d.id))

            // Update ref
            entriesRef.current = [...entriesRef.current, ...newEntries]

            // Update state
            setEntries(entriesRef.current)

            nextCursorRef.current = nextCursor
            setHasMore(!!nextCursor)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (entriesRef.current.length === 0) {
            fetchEntries()
        } else {
            setEntries(entriesRef.current) // restore previous entries
        }
    }, [])

    const lastEntryRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loading) return
            if (observerRef.current) observerRef.current.disconnect()

            if (node) {
                observerRef.current = new IntersectionObserver(
                    (entries) => {
                        if (entries[0].isIntersecting && hasMore) {
                            fetchEntries(nextCursorRef.current!)
                        }
                    },
                    { rootMargin: '200px' }
                )
                observerRef.current.observe(node)
            }
        },
        [loading, hasMore]
    )

    return (
        <div className="flex flex-col gap-4">
            {entries.map((entry, i) => {
                const isLast = i === entries.length - 1
                return (
                    <EntryCard
                        key={entry.id}
                        ref={isLast ? lastEntryRef : null}
                        entry={entry}
                    />
                )
            })}

            {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 bg-gray-100 animate-pulse rounded-md h-20" />
                ))}

            {!hasMore && !loading && (
                <p className="text-center text-gray-400">No more entries</p>
            )}
        </div>
    )
}
