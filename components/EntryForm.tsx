'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry } from '@/lib/types'
import TagInput from './TagInput'
import {Button} from "@/components/Button";

export default function EntryForm({ entry }: { entry?: Entry }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [title, setTitle] = useState(entry?.title || '')
    const [body, setBody] = useState(entry?.body || '')
    const [eventDatetime, setEventDatetime] = useState(
        entry?.event_datetime
            ? new Date(entry.event_datetime).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
    )
    const [tags, setTags] = useState<string[]>(entry?.tags || [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const entryData = {
            title,
            body,
            event_datetime: new Date(eventDatetime).toISOString(),
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
                router.push(`/entries/${entry.id}`)
                router.refresh()
            }
        } else {
            const { error } = await supabase
                .from('entries')
                .insert([entryData])

            if (error) {
                setError(error.message)
                setLoading(false)
            } else {
                router.push('/')
                router.refresh()
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                </label>
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
                <label htmlFor="event_datetime" className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                </label>
                <input
                    id="event_datetime"
                    type="datetime-local"
                    required
                    value={eventDatetime}
                    onChange={(e) => setEventDatetime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
            </div>

            <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                    Entry
                </label>
                <textarea
                    id="body"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base leading-relaxed min-h-[400px] resize-y"
                    placeholder="Write your entry here... (Markdown supported)"
                />
            </div>

            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                </label>
                <TagInput tags={tags} onChange={setTags} />
            </div>

            {error && (
                <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex gap-4">
                <Button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : entry ? 'Update' : 'Create'}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                    className=""
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}