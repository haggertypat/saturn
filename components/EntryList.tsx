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
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-light text-gray-900">Entries</h2>
                <Link
                    href="/entries/new"
                    className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800"
                >
                    New Entry
                </Link>
            </div>

            {entries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
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