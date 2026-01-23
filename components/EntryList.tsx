'use client'

import { useState } from 'react'
import type { Entry } from '@/lib/types'
import EntryCard from './EntryCard'

export default function EntryList({ initialEntries }: { initialEntries: Entry[] }) {
    const [entries, setEntries] = useState<Entry[]>(initialEntries)

    return (
        <div className="space-y-6">

            {entries.length === 0 ? (
                <div className="text-center py-12">
                    <p>No entries yet. Create your first entry to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <EntryCard
                            key={entry.id}
                            entry={entry}
                            onDelete={(id) => setEntries((prev) => prev.filter((item) => item.id !== id))}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
