'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState } from 'react'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { createClient } from '@/lib/supabase/client'

type StarredBadgeProps = {
    entryId: string
    initialStarred: boolean
    className?: string
    onChange?: (starred: boolean) => void
}

export default function StarredBadge({
    entryId,
    initialStarred,
    className = '',
    onChange,
}: StarredBadgeProps) {
    const supabase = createClient()
    const [starred, setStarred] = useState(initialStarred)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setStarred(initialStarred)
    }, [initialStarred])

    const toggleStar = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()

        if (isSaving) return

        const nextValue = !starred
        setStarred(nextValue)
        setIsSaving(true)

        const { error } = await supabase
            .from('entries')
            .update({ starred: nextValue })
            .eq('id', entryId)

        if (error) {
            setStarred(!nextValue)
            alert('Failed to update starred')
        } else {
            onChange?.(nextValue)
        }

        setIsSaving(false)
    }

    return (
        <button
            type="button"
            onClick={toggleStar}
            aria-pressed={starred}
            className={`inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-xs font-medium transition-colors ${
                starred
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            } ${className}`}
        >
            {starred ? (
                <StarSolidIcon className="h-4 w-4" />
            ) : (
                <StarOutlineIcon className="h-4 w-4" />
            )}
            <span>{starred ? 'Starred' : 'Star'}</span>
        </button>
    )
}
