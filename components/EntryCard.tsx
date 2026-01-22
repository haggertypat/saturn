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
            <Link href={`/entries/${entry.id}`}>
            <article className="border border-neutral-200 dark:border-neutral-800 rounded-md
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
    )
});

EntryCard.displayName = 'EntryCard';

export default EntryCard;