'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry } from '@/lib/types'
import TagInput from './TagInput'
import { Button } from "@/components/Button"

export default function EntryForm({ entry }: { entry?: Entry }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    const storageKey = entry ? `entry-draft-${entry.id}` : 'entry-draft-new'

    // Initialize state from localStorage or entry
    const getInitialState = () => {
        if (typeof window === 'undefined') return { title: '', body: '', eventDate: '', tags: [] }

        const saved = localStorage.getItem(storageKey)
        if (saved && !entry) {
            try {
                return JSON.parse(saved)
            } catch {
                return { title: '', body: '', eventDate: '', tags: [] }
            }
        }

        return {
            title: entry?.title || '',
            body: entry?.body || '',
            eventDate: entry?.event_date || new Date().toISOString().slice(0, 10),
            tags: entry?.tags || []
        }
    }

    const initialState = getInitialState()
    const [title, setTitle] = useState(initialState.title)
    const [body, setBody] = useState(initialState.body)
    const [eventDate, setEventDate] = useState(initialState.eventDate)
    const [tags, setTags] = useState<string[]>(initialState.tags)

    // Auto-save to localStorage
    useEffect(() => {
        const draft = { title, body, eventDate, tags }
        localStorage.setItem(storageKey, JSON.stringify(draft))
        setLastSaved(new Date())
    }, [title, body, eventDate, tags, storageKey])

    const clearDraft = () => {
        localStorage.removeItem(storageKey)
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
            const { error } = await supabase
                .from('entries')
                .update(entryData)
                .eq('id', entry.id)

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
                clearDraft()
                router.push(`/entries/${data.id}`)
                router.refresh()
            }
        }
    }

    const hasDraft = title || body || tags.length > 0

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {hasDraft && lastSaved && (
                <div className="text-sm text-gray-500">
                    Auto-saved {lastSaved.toLocaleTimeString()}
                </div>
            )}

            <div className="float-right">
                <input
                    id="event_date"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
            </div>

            <div>
                <input
                    id="title"
                    type="text"
                    required
                    maxLength={250}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg"
                    placeholder="Entry title"
                />
            </div>

            <div>
                <textarea
                    id="body"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base leading-relaxed min-h-[400px] resize-y"
                    placeholder="Write your entry..."
                />
            </div>


            {/*<div>*/}
            {/*    <TagInput tags={tags} onChange={setTags} />*/}
            {/*</div>*/}

            {error && (
                <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex gap-4 items-center">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : entry ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
                {hasDraft && !entry && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            if (confirm('Are you sure you want to discard this draft?')) {
                                clearDraft()
                                setTitle('')
                                setBody('')
                                setEventDate(new Date().toISOString().slice(0, 10))
                                setTags([])
                            }
                        }}
                    >
                        Discard Draft
                    </Button>
                )}
            </div>
        </form>
    )
}