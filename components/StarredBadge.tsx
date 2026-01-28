'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { createClient } from '@/lib/supabase/client'

type StarredBadgeProps = {
    entryId: string
    initialStarred: boolean
    className?: string
    onChange?: (starred: boolean) => void
}

const starredState = new Map<string, boolean>()
const starredListeners = new Map<string, Set<(value: boolean) => void>>()

const getStarredValue = (entryId: string, fallback: boolean) => {
    if (!starredState.has(entryId)) {
        starredState.set(entryId, fallback)
    }

    return starredState.get(entryId) ?? fallback
}

const setStarredValue = (entryId: string, value: boolean) => {
    starredState.set(entryId, value)
    starredListeners.get(entryId)?.forEach((listener) => listener(value))
}

const subscribeToStarred = (entryId: string, listener: (value: boolean) => void) => {
    let listeners = starredListeners.get(entryId)
    if (!listeners) {
        listeners = new Set()
        starredListeners.set(entryId, listeners)
    }

    listeners.add(listener)

    return () => {
        listeners?.delete(listener)
        if (listeners && listeners.size === 0) {
            starredListeners.delete(entryId)
        }
    }
}

const useStarredValue = (entryId: string, initialStarred: boolean) => {
    return useSyncExternalStore(
        (listener) => subscribeToStarred(entryId, () => listener()),
        () => getStarredValue(entryId, initialStarred),
        () => getStarredValue(entryId, initialStarred),
    )
}

export default function StarredBadge({
    entryId,
    initialStarred,
    onChange,
}: StarredBadgeProps) {
    const supabase = createClient()
    const starred = useStarredValue(entryId, initialStarred)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const currentValue = getStarredValue(entryId, initialStarred)
        if (currentValue !== initialStarred) {
            setStarredValue(entryId, initialStarred)
        }
    }, [entryId, initialStarred])

    const toggleStar = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()

        if (isSaving) return

        const nextValue = !starred
        setStarredValue(entryId, nextValue)
        setIsSaving(true)

        const { error } = await supabase
            .from('entries')
            .update({ starred: nextValue })
            .eq('id', entryId)

        if (error) {
            setStarredValue(entryId, !nextValue)
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
            className="cursor-pointer"
        >
            {starred ? (
                <StarSolidIcon className="h-5 w-5" />
            ) : (
                <StarOutlineIcon className="h-5 w-5" />
            )}
        </button>
    )
}
