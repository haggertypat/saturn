'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import EntryCard from './EntryCard'
import type { Entry } from '@/lib/types'
import {Button} from "@/components/Button"
import {ArrowUpIcon, ArrowDownIcon, DocumentIcon, RectangleStackIcon} from '@heroicons/react/24/outline'

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

export default function EntryList({ initialViewMode, initialOrder }: EntryListProps) {
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [viewMode, setViewMode] = useState<'cards' | 'long'>(initialViewMode)
    const viewModeCookieName = 'entries-view-mode'

    const [q, setQ] = useState('')
    const debouncedQ = useDebouncedValue(q, 250)

    const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder)
    const orderCookieName = 'entries-sort-order'

    const entriesRef = useRef<Entry[]>([])
    const nextCursorRef = useRef<string | null>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const scrollPositionRef = useRef(0)

    const isFetchingRef = useRef(false)
    const hasMoreRef = useRef(true)
    const isRestoringRef = useRef(false)

    useEffect(() => {
        hasMoreRef.current = hasMore
    }, [hasMore])

    useEffect(() => {
        document.cookie = `${viewModeCookieName}=${viewMode}; path=/; max-age=2592000; samesite=lax`
    }, [viewMode, viewModeCookieName])

    useEffect(() => {
        document.cookie = `${orderCookieName}=${order}; path=/; max-age=2592000; samesite=lax`
    }, [order, orderCookieName])

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
                setHasFetched(true)
            }
        },
        []
    )

    useEffect(() => {
        const hasPendingRestore =
            typeof window !== 'undefined' &&
            sessionStorage.getItem('entries-list-restoring') &&
            sessionStorage.getItem('entries-list-state')
        if (hasPendingRestore) {
            return
        }

        entriesRef.current = []
        setEntries([])
        nextCursorRef.current = null
        setHasMore(true)
        setHasFetched(false)

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

    const saveScrollPosition = useCallback(() => {
        scrollPositionRef.current = window.scrollY
    }, [])

    useEffect(() => {
        const onScroll = () => {
            if (isRestoringRef.current) return
            saveScrollPosition()
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [saveScrollPosition])

    useEffect(() => {
        const isRestoring = sessionStorage.getItem('entries-list-restoring')
        const listStateRaw = sessionStorage.getItem('entries-list-state')
        if (!isRestoring || !listStateRaw) {
            return
        }

        const parsed = JSON.parse(listStateRaw) as {
            entries: Entry[]
            nextCursor: string | null
            hasMore: boolean
            order: 'asc' | 'desc'
            q: string
            viewMode: 'cards' | 'long'
            scrollY: number
        }

        const shouldRestore =
            parsed.order === order &&
            parsed.q === debouncedQ &&
            parsed.viewMode === viewMode

        if (!shouldRestore) {
            sessionStorage.removeItem('entries-list-restoring')
            return
        }

        isRestoringRef.current = true
        entriesRef.current = parsed.entries
        setEntries(parsed.entries)
        nextCursorRef.current = parsed.nextCursor
        setHasMore(parsed.hasMore)
        setHasFetched(true)
        setLoading(false)
        scrollPositionRef.current = parsed.scrollY

        requestAnimationFrame(() => {
            window.scrollTo({ top: scrollPositionRef.current })
            isRestoringRef.current = false
        })

        sessionStorage.removeItem('entries-list-restoring')
    }, [debouncedQ, order, viewMode])

    const persistListState = useCallback(
        (scrollY?: number) => {
            const snapshot = {
                entries: entriesRef.current,
                nextCursor: nextCursorRef.current,
                hasMore: hasMoreRef.current,
                order,
                q: debouncedQ,
                viewMode,
                scrollY: scrollY ?? scrollPositionRef.current,
            }

            sessionStorage.setItem('entries-list-state', JSON.stringify(snapshot))
        },
        [debouncedQ, order, viewMode]
    )

    const handleEntryClick = useCallback(
        (scrollY?: number) => {
            persistListState(scrollY)
            sessionStorage.setItem('entries-list-restoring', 'true')
        },
        [persistListState]
    )

    useEffect(() => {
        const handlePageHide = () => {
            persistListState(window.scrollY)
            sessionStorage.setItem('entries-list-restoring', 'true')
        }

        window.addEventListener('pagehide', handlePageHide)
        window.addEventListener('beforeunload', handlePageHide)
        return () => {
            window.removeEventListener('pagehide', handlePageHide)
            window.removeEventListener('beforeunload', handlePageHide)
        }
    }, [persistListState])

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
                            onNavigate={handleEntryClick}
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

            {!loading && hasFetched && entries.length === 0 && (
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
