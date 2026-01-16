import Link from 'next/link'
import type { Entry } from '@/lib/types'
import ReactMarkdown from 'react-markdown'

export default function EntryCard({ entry }: { entry: Entry }) {
    const eventDate = new Date(entry.event_datetime)
    const preview = entry.body.slice(0, 200) + (entry.body.length > 200 ? '...' : '')

    return (
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

                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{preview}</ReactMarkdown>
                </div>

                {entry.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-1"
                            >
                {tag}
              </span>
                        ))}
                    </div>
                )}
            </article>
        </Link>
    )
}