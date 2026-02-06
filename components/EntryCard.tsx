'use client'

import Link from 'next/link'
import type { Entry } from '@/lib/types'
import { forwardRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StarredBadge from '@/components/StarredBadge'

function stripMarkdownFromPreview(text: string): string {
    return text
        .split('\n')
        .map((line) =>
            line
                .replace(/^\s{0,3}#{2,}\s*/g, '')
                .replace(/^\s{0,3}>\s?/g, '')
                .replace(/^\s{0,3}-{3,}\s*$/g, '')
        )
        .join('\n')
}

interface EntryCardProps {
    entry: Entry;
    onDelete?: (id: string) => void;
    viewMode?: 'cards' | 'long';
}

const EntryCard = forwardRef<HTMLDivElement, EntryCardProps>(({ entry, onDelete, viewMode = 'cards' }, ref) => {
    const router = useRouter()
    const supabase = createClient()
    const [isDeleting, setIsDeleting] = useState(false)
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

    const isLongForm = viewMode === 'long'
    const preview = entry.body.slice(0, 200) + (entry.body.length > 200 ? '...' : '')
    const body = isLongForm ? entry.body : preview
    const cleanBody = stripMarkdownFromPreview(body)

    return (
        <div ref={ref}> {/* observer attached here */}
            <div className="group relative">
                <div className="absolute right-3 bottom-3 z-10 flex gap-2 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
                    <StarredBadge
                        entryId={entry.id}
                        initialStarred={entry.starred}
                    />
                    <button
                        type="button"
                        className="cursor-pointer rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-500"
                        aria-label="Edit entry"
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            router.push(`/entries/${entry.id}/edit`)
                        }}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="cursor-pointer rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-500"
                        aria-label="Delete entry"
                        disabled={isDeleting}
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            if (isDeleting) return
                            if (!confirm('Are you sure you want to delete this entry?')) {
                                return
                            }

                            setIsDeleting(true)
                            supabase
                                .from('entries')
                                .delete()
                                .eq('id', entry.id)
                                .then(({ error }) => {
                                    if (error) {
                                        setIsDeleting(false)
                                        alert('Failed to delete entry')
                                        return
                                    }

                                    onDelete?.(entry.id)
                                    if (!onDelete) {
                                        router.push('/')
                                        router.refresh()
                                    }
                                })
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
                <Link href={`/entries/${entry.id}`}>
                    <article
                        className={
                            isLongForm
                                ? "cursor-pointer py-6"
                                : "border border-neutral-200 dark:border-neutral-600 rounded-md p-6 mb-1.5 hover:border-neutral-400 dark:hover:border-neutral-400 transition-colors cursor-pointer"
                        }
                    >
                        <div className={`flex justify-between items-start ${isLongForm ? 'mb-4' : 'mb-2'}`}>
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium ">{entry.title ?? 'Untitled'}</h3>
                            </div>
                            <div className="flex gap-3 items-center text-sm">
                                <time>
                                    {eventDate.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </time>

                                {entry.category && (
                                    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                        {entry.category}
                                    </p>
                                )}

                                {entry.starred && (
                                    <StarredBadge
                                        entryId={entry.id}
                                        initialStarred={entry.starred}
                                    />
                                )}

                            </div>
                        </div>

                        <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                            {cleanBody}
                        </div>
                    </article>
                </Link>
            </div>
        </div>
    )
});

EntryCard.displayName = 'EntryCard';

export default EntryCard;
