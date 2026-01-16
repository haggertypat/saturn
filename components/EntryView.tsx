'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Entry } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function EntryView({ entry }: { entry: Entry }) {
    const router = useRouter()
    const supabase = createClient()
    const [deleting, setDeleting] = useState(false)

    const eventDate = new Date(entry.event_datetime)

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
        <article className="prose prose-layout dark:prose-invert">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl mb-2">
                        {entry.title}
                    </h1>
                    <time className="text-sm">
                        {eventDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </time>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/entries/${entry.id}/edit`}
                        className="px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 border border-red-300 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>

            {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
                        >
              {tag}
            </span>
                    ))}
                </div>
            )}

            <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.body}
                </ReactMarkdown>
            </div>

            <div className="pt-6 border-t border-gray-200">
                <Link
                    href="/"
                    className="text-sm"
                >
                    ← Back
                </Link>
            </div>
        </article>
    )
}