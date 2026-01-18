'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Entry } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {buttonStyles} from "@/lib/styles";

export default function EntryView({ entry }: { entry: Entry }) {
    const router = useRouter()
    const supabase = createClient()
    const [deleting, setDeleting] = useState(false)

    const [year, month, day] = entry.event_date.split('-')
    const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

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

        <article className="">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h1 className="text-3xl">
                        {entry.title}
                    </h1>
                    <time className="text-sm">
                        {eventDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/entries/${entry.id}/edit`}
                        className={buttonStyles.secondary}
                    >
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={buttonStyles.secondary}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>

            {/*{entry.tags.length > 0 && (*/}
            {/*    <div className="flex flex-wrap gap-2 mb-2">*/}
            {/*        {entry.tags.map((tag) => (*/}
            {/*            <span*/}
            {/*                key={tag}*/}
            {/*                className="text-xs px-2 py-1 bg-gray-100 text-gray-700"*/}
            {/*            >*/}
            {/*  {tag}*/}
            {/*</span>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}

            <div className="prose dark:prose-invert max-w-none mt-6">

                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.body}
                </ReactMarkdown>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200">
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