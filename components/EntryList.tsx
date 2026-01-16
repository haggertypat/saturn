'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Entry } from '@/lib/types'
import EntryCard from './EntryCard'
import Link from 'next/link'

export default function EntryList({ initialEntries }: { initialEntries: Entry[] }) {
    const [entries] = useState<Entry[]>(initialEntries)
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-end">
                <Link
                    href="/entries/new"
                    className="px-4 py-2"
                >
                    New
                </Link>
            </div>

            {entries.length === 0 ? (
                <div className="text-center py-12">
                    <p>No entries yet. Create your first entry to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    )
}