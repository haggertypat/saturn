'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry } from '@/lib/types'
import { Button } from '@/components/Button'
import ZenEditor from './ZenEditor'
import {ArrowsPointingOutIcon} from "@heroicons/react/24/outline";

type DraftPayload = {
    title: string
    body: string
    eventDate: string
    tags: string[]
    updatedAt: number
    baseHash?: string // only for edit drafts
}

function hashEntryFields(e: {
    title: string
    body: string
    eventDate: string
    tags: string[]
}) {
    return JSON.stringify([
        e.title,
        e.body,
        e.eventDate,
        [...e.tags].sort(),
    ])
}

export default function EntryForm({ entry }: { entry?: Entry }) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isZenMode, setIsZenMode] = useState(false)

    // Hydration-safe: start with base values (from entry / defaults), then hydrate drafts in useEffect
    const base = useMemo(() => {
        return {
            title: entry?.title || '',
            body: entry?.body || '',
            eventDate: entry?.event_date || new Date().toISOString().slice(0, 10),
            tags: (entry?.tags || []) as string[],
        }
    }, [entry])

    const baseHash = useMemo(() => hashEntryFields(base), [base])

    const [mounted, setMounted] = useState(false)
    const [title, setTitle] = useState(base.title)
    const [body, setBody] = useState(base.body)
    const [eventDate, setEventDate] = useState(base.eventDate)
    const [tags, setTags] = useState<string[]>(base.tags)

    // Keep form in sync when switching between new/edit or when entry loads
    useEffect(() => {
        setTitle(base.title)
        setBody(base.body)
        setEventDate(base.eventDate)
        setTags(base.tags)
    }, [base])

    const draftKeyNew = 'entry-draft-new'
    const draftKeyEdit = entry ? `entry-edit-draft-${entry.id}` : null
    const storageKey = entry ? draftKeyEdit! : draftKeyNew

    // Load draft after mount
    useEffect(() => {
        setMounted(true)

        const raw = localStorage.getItem(storageKey)
        if (!raw) return

        let saved: DraftPayload | null = null
        try {
            saved = JSON.parse(raw)
        } catch {
            return
        }
        if (!saved) return

        // New entry: always restore if present
        if (!entry) {
            setTitle(saved.title ?? '')
            setBody(saved.body ?? '')
            setEventDate(saved.eventDate ?? new Date().toISOString().slice(0, 10))
            setTags(Array.isArray(saved.tags) ? saved.tags : [])
            setLastSaved(new Date(saved.updatedAt || Date.now()))
            return
        }

        // Edit entry: only restore if it was based on the same DB version
        if (saved.baseHash && saved.baseHash === baseHash) {
            const draftFields = {
                title: saved.title ?? base.title,
                body: saved.body ?? base.body,
                eventDate: saved.eventDate ?? base.eventDate,
                tags: Array.isArray(saved.tags) ? saved.tags : base.tags,
            }
            // Only apply if it actually differs from DB values
            if (hashEntryFields(draftFields) !== baseHash) {
                setTitle(draftFields.title)
                setBody(draftFields.body)
                setEventDate(draftFields.eventDate)
                setTags(draftFields.tags)
                setLastSaved(new Date(saved.updatedAt || Date.now()))
            } else {
                localStorage.removeItem(storageKey)
            }
        } else {
            // DB changed since draft was made; drop it (or you could keep it)
            localStorage.removeItem(storageKey)
        }
    }, [storageKey, entry, baseHash, base])

    // Derived flags
    const currentFields = useMemo(
        () => ({ title, body, eventDate, tags }),
        [title, body, eventDate, tags]
    )
    const currentHash = useMemo(() => hashEntryFields(currentFields), [currentFields])

    const hasUnsavedChanges = entry
        ? currentHash !== baseHash
        : (title.trim() || body.trim() || tags.length > 0)

    // Warn on tab close / reload / hard navigation when there are unsaved changes
    useEffect(() => {
        if (!mounted || !hasUnsavedChanges) return

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Required for Chrome/Safari
            e.preventDefault()
            e.returnValue = ''
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [mounted, hasUnsavedChanges])

    // Auto-save draft (debounced)
    useEffect(() => {
        if (!mounted) return

        // For edit: only store when there are unsaved changes
        // For new: store when non-empty
        if (!hasUnsavedChanges) {
            localStorage.removeItem(storageKey)
            return
        }

        const timer = setTimeout(() => {
            const payload: DraftPayload = {
                ...currentFields,
                updatedAt: Date.now(),
                ...(entry ? { baseHash } : {}),
            }
            localStorage.setItem(storageKey, JSON.stringify(payload))
            setLastSaved(new Date(payload.updatedAt))
        }, 500)

        return () => clearTimeout(timer)
    }, [mounted, hasUnsavedChanges, currentFields, storageKey, entry, baseHash])

    const clearDraft = () => localStorage.removeItem(storageKey)

    const resetToBase = () => {
        setTitle(base.title)
        setBody(base.body)
        setEventDate(base.eventDate)
        setTags(base.tags)
    }

    const resetToEmpty = () => {
        setTitle('')
        setBody('')
        setEventDate(new Date().toISOString().slice(0, 10))
        setTags([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const entryData = {
            title,
            body,
            event_date: new Date(eventDate).toISOString(),
            tags,
        }

        if (entry) {
            const { error } = await supabase.from('entries').update(entryData).eq('id', entry.id)

            if (error) {
                setError(error.message)
                setLoading(false)
            } else {
                clearDraft()
                router.push(`/entries/${entry.id}`)
                router.refresh()
            }
        } else {
            const { data, error } = await supabase
                .from('entries')
                .insert([entryData])
                .select()
                .single()

            if (error) {
                setError(error.message)
                setLoading(false)
            } else {
                fetch('/api/embed-entry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: data.id, body: entryData.body }),
                })

                clearDraft()
                router.push(`/entries/${data.id}`)
                router.refresh()
            }
        }
    }

    if (isZenMode) {
        return <ZenEditor value={body} onChange={setBody} onExit={() => setIsZenMode(false)} />
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6">
                <input
                    id="title"
                    type="text"
                    required
                    maxLength={250}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="
                        entry-title
                        bg-transparent
                        border-none
                        outline-none
                        p-0
                        w-full
                        text-neutral-900 dark:text-neutral-100
                        placeholder:text-gray-400 dark:placeholder:text-neutral-500
                        "
                />
            </div>
            <div className="flex justify-between">
                <div>
                    <input
                        id="event_date"
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="pl-3 pr-0 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <Button type="button" variant="ghost" onClick={() => setIsZenMode(true)}>
                        <ArrowsPointingOutIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div>
                <textarea
                    id="body"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none rounded-md focus:ring-1 focus:ring-neutral-500 focus:border-transparent
                     text-base leading-relaxed min-h-[425px] resize-none"
                    placeholder="Write your entry..."
                />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex gap-4 justify-end">
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : entry ? 'Update' : 'Create'}
                </Button>

                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
            <div className="flex gap-4 justify-end items-center">
                {mounted && hasUnsavedChanges && lastSaved && (
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                        Auto-saved {lastSaved.toLocaleTimeString()}
                    </div>
                )}
                {mounted && hasUnsavedChanges && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-sm mr-2 text-gray-400 dark:text-gray-500"
                        onClick={() => {
                            const msg = entry
                                ? 'Discard unsaved changes and revert to the saved entry?'
                                : 'Discard this draft?'
                            if (!confirm(msg)) return

                            clearDraft()
                            if (entry) {
                                resetToBase()
                            } else {
                                resetToEmpty()
                            }
                        }}
                    >
                        {entry ? 'Discard changes' : 'Discard draft'}
                    </Button>
                )}
            </div>
        </form>
    )
}
