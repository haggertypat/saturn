import Link from 'next/link'
import type { Entry } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import { forwardRef } from 'react';

interface EntryCardProps {
    entry: Entry;
}

const EntryCard = forwardRef<HTMLDivElement, EntryCardProps>(({ entry }, ref) => {
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

    const preview = entry.body.slice(0, 200) + (entry.body.length > 200 ? '...' : '')

    return (
        <div ref={ref}> {/* observer attached here */}
            <div className="group relative">
                <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
                    <button
                        type="button"
                        className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-500"
                        aria-label="Edit entry"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-sm hover:border-red-300 hover:text-red-700 dark:border-red-500/60 dark:bg-neutral-900 dark:text-red-300 dark:hover:border-red-400"
                        aria-label="Delete entry"
                    >
                        Delete
                    </button>
                </div>
                <Link href={`/entries/${entry.id}`}>
                    <article className="border border-neutral-200 dark:border-neutral-600 rounded-md
                        p-6 mb-1.5 hover:border-neutral-400 dark:hover:border-neutral-400 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium ">{entry.title}</h3>
                            <time className="text-sm">
                                {eventDate.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </time>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{preview}</ReactMarkdown>
                        </div>
                    </article>
                </Link>
            </div>
        </div>
    )
});

EntryCard.displayName = 'EntryCard';

export default EntryCard;
