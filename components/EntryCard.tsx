import Link from 'next/link'
import type { Entry } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import { forwardRef } from 'react';

interface EntryCardProps {
    entry: Entry;
}

const EntryCard = forwardRef<HTMLDivElement, EntryCardProps>(({ entry }, ref) => {
    const [year, month, day] = entry.event_date.split('-')
    const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const preview = entry.body.slice(0, 200) + (entry.body.length > 200 ? '...' : '')

    return (
        <div ref={ref}> {/* observer attached here */}
            <Link href={`/entries/${entry.id}`}>
            <article className="border border-gray-200 p-6 mb-1.5 hover:border-gray-400 transition-colors cursor-pointer">
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