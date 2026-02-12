'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import EntryCard from './EntryCard'
import type { Entry } from '@/lib/types'
import {Button} from "@/components/Button"
import {ArrowUpIcon, ArrowDownIcon, DocumentIcon, RectangleStackIcon, StarIcon} from '@heroicons/react/24/outline'

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

type EntryListProps = {
    initialViewMode: 'cards' | 'long'
    initialOrder: 'asc' | 'desc'
}

type PersistedListState = {
    q?: string
    starredOnly?: boolean
    order?: 'asc' | 'desc'
    viewMode?: 'cards' | 'long'
    scrollY?: number
}

const LIST_STATE_KEY = 'entries-list-state'

function readPersistedListState(): PersistedListState | null {
    if (typeof window === 'undefined') return null
    const raw = window.sessionStorage.getItem(LIST_STATE_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as PersistedListState
    } catch {
        return null
    }
}

function writePersistedListState(patch: PersistedListState) {
    if (typeof window === 'undefined') return
    const raw = window.sessionStorage.getItem(LIST_STATE_KEY)
    let current: PersistedListState = {}
    if (raw) {
        try {
            current = JSON.parse(raw) as PersistedListState
        } catch {
            current = {}
        }
    }
    const next = { ...current, ...patch }
    window.sessionStorage.setItem(LIST_STATE_KEY, JSON.stringify(next))
}

export default function EntryList({ initialViewMode, initialOrder }: EntryListProps) {
    const persisted = typeof window !== 'undefined' ? readPersistedListState() : null
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [viewMode, setViewMode] = useState<'cards' | 'long'>(() => {
        if (persisted?.viewMode === 'cards' || persisted?.viewMode === 'long') {
            return persisted.viewMode
        }
        return initialViewMode
    })

    const [order, setOrder] = useState<'asc' | 'desc'>(() => {
        if (persisted?.order === 'asc' || persisted?.order === 'desc') {
            return persisted.order
        }
        return initialOrder
    })

    const [q, setQ] = useState(() => persisted?.q ?? '')
    const [starredOnly, setStarredOnly] = useState(() => persisted?.starredOnly ?? false)
    const debouncedQ = useDebouncedValue(q, 250)

    const entriesRef = useRef<Entry[]>([])
    const nextCursorRef = useRef<string | null>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    const savedScrollRef = useRef<number | null>(null)
    const restoredScrollRef = useRef(false)

    const isFetchingRef = useRef(false)
    const hasMoreRef = useRef(true)

    useEffect(() => {
        hasMoreRef.current = hasMore
    }, [hasMore])

    // Keep the snapshot in sessionStorage up to date as the list UI changes.
    useEffect(() => {
        writePersistedListState({ q })
    }, [q])

    useEffect(() => {
        writePersistedListState({ starredOnly })
    }, [starredOnly])

    useEffect(() => {
        writePersistedListState({ order })
    }, [order])

    useEffect(() => {
        writePersistedListState({ viewMode })
    }, [viewMode])

    // Persist scroll position while the user browses the list so that when they
    // navigate into an entry and then come back (via back button or Header link),
    // we can restore them to the same spot.
    useEffect(() => {
        if (typeof window === 'undefined') return
        const persisted = readPersistedListState()
        if (persisted?.scrollY != null && typeof persisted.scrollY === 'number') {
            savedScrollRef.current = persisted.scrollY
        }

        const handleScroll = () => {
            const y = window.scrollY
            const current = readPersistedListState()

            // When navigating away to an entry page (or back to the list),
            // the browser often scrolls to 0, which would overwrite our
            // previously saved deep scroll position. If we already have a
            // non-zero saved scrollY, ignore these "jump to top" events
            // to preserve the last meaningful position.
            if (y === 0 && current?.scrollY && current.scrollY > 0) {
                return
            }

            writePersistedListState({ scrollY: y })
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const fetchEntries = useCallback(
        async (opts: { cursor?: string | null; q?: string; order: 'asc' | 'desc'; starredOnly?: boolean }) => {
            const cursor = opts.cursor ?? null
            const query = (opts.q ?? '').trim()
            const ord = opts.order
            const starred = opts.starredOnly ?? false

            if (isFetchingRef.current) return
            if (cursor && !hasMoreRef.current) return

            isFetchingRef.current = true
            setLoading(true)

            try {
                const params = new URLSearchParams()
                params.set('order', ord)
                if (cursor) params.set('cursor', cursor)
                if (query) params.set('q', query)
                if (starred) params.set('starred', 'true')

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

    // reset + fetch whenever query, order, or starred filter changes
    useEffect(() => {
        entriesRef.current = []
        setEntries([])
        nextCursorRef.current = null
        setHasMore(true)

        if (observerRef.current) observerRef.current.disconnect()

        fetchEntries({ cursor: null, q: debouncedQ, order, starredOnly })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ, order, starredOnly])

    // Disable browser scroll restoration and prevent Next.js/browser from doing
    // scroll restoration, since we handle it ourselves.
    useEffect(() => {
        if (typeof window === 'undefined') return

        // Disable browser's automatic scroll restoration
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }

        if (savedScrollRef.current == null) return

        // Immediately prevent any automatic scroll restoration by forcing scroll to 0
        // if we have a saved position. We'll restore it ourselves after content loads.
        window.scrollTo({ top: 0, behavior: 'auto' })
    }, [])

    // Restore any saved scroll position from a previous visit to this list.
    //
    // If the saved scroll position is deeper than the currently rendered
    // document height, we proactively fetch additional pages (using the
    // infinite-scroll cursor) until either:
    // - we've loaded enough content to reach the target scroll offset, or
    // - there are no more pages.
    //
    // This effect only runs once: when entries.length transitions from 0 to >0
    // and we have a saved scroll position to restore.
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (restoredScrollRef.current) return

        const target = savedScrollRef.current

        // Nothing to restore.
        if (target == null) {
            restoredScrollRef.current = true
            return
        }

        // Wait until at least one page of entries has rendered so the document
        // has some scrollable height before we start preloading.
        if (entries.length === 0) {
            return
        }

        // Mark as restoring immediately to prevent re-runs during preloading.
        // This ensures we only scroll once, after all preloading completes.
        restoredScrollRef.current = true

        const loadAndScroll = async () => {
            const maxExtraPagesToLoad = 10

            for (let i = 0; i < maxExtraPagesToLoad; i++) {
                const maxScroll =
                    document.documentElement.scrollHeight - window.innerHeight

                // If we already have enough content (or there is nowhere to scroll),
                // stop preloading.
                if (maxScroll >= target || maxScroll <= 0) {
                    break
                }

                if (!nextCursorRef.current || !hasMoreRef.current) {
                    break
                }

                // Trigger the next page load synchronously (bypassing the
                // IntersectionObserver, which won't fire while we're at the top).
                await fetchEntries({
                    cursor: nextCursorRef.current,
                    q: debouncedQ,
                    order,
                    starredOnly,
                })
            }

            // Wait for DOM to update after all fetches complete, then scroll once.
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

            const maxScrollAfterLoad =
                document.documentElement.scrollHeight - window.innerHeight
            const clampedTarget = Math.max(
                0,
                Math.min(target, maxScrollAfterLoad)
            )
            window.scrollTo({ top: clampedTarget, behavior: 'auto' })
        }

        // Fire and forget; we don't care about awaiting in the effect.
        void loadAndScroll()
        // Only run when entries.length transitions from 0 to >0 (first page loaded).
        // The restoredScrollRef guard ensures we only run once even if entries.length changes again.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries.length > 0 ? 'ready' : 'waiting'])

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

                    fetchEntries({ cursor: nextCursorRef.current, q: debouncedQ, order, starredOnly })
                },
                { rootMargin: '200px' }
            )

            observerRef.current.observe(node)
        },
        [fetchEntries, debouncedQ, order, starredOnly]
    )

    return (
        <div className={`flex flex-col ${viewMode === 'cards' ? 'gap-4' : 'gap-0'}`}>
            <div className="flex flex-wrap gap-2">
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
                    {order === 'desc' ? (
                        <ArrowDownIcon className="h-4 w-4" />
                    ) : (
                        <ArrowUpIcon className="h-4 w-4" />
                    )}
                </Button>
                <Button
                    onClick={() => setStarredOnly((current) => !current)}
                    title="Toggle starred entries only"
                    variant="secondary"
                    aria-pressed={starredOnly}
                >
                    <StarIcon className={`h-4 w-4 ${starredOnly ? 'fill-current' : ''}`} />
                </Button>

                <Button
                    onClick={() => setViewMode((mode) => (mode === 'cards' ? 'long' : 'cards'))}
                    title="Toggle view mode"
                    variant="secondary"
                >
                    {viewMode === 'cards' ? (
                        <RectangleStackIcon className="h-4 w-4" />
                    ) : (
                        <DocumentIcon className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <div className={` ${viewMode === 'cards' ? '' : 'mt-4'}`}>
                {entries.map((entry, i) => {
                    const isLast = i === entries.length - 1
                    const shouldObserveLast = isLast && !!nextCursorRef.current
                    return (
                        <EntryCard
                            key={entry.id}
                            ref={shouldObserveLast ? lastEntryRef : null}
                            entry={entry}
                            viewMode={viewMode}
                            onDelete={(id) => {
                                entriesRef.current = entriesRef.current.filter((item) => item.id !== id)
                                setEntries(entriesRef.current)
                            }}
                        />
                    )
                })}
            </div>

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
