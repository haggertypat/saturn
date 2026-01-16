'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
    tags: string[]
    onChange: (tags: string[]) => void
}

export default function TagInput({ tags, onChange }: TagInputProps) {
    const [input, setInput] = useState('')

    const addTag = (tag: string) => {
        const trimmed = tag.trim()
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed])
        }
        setInput('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab' || e.key === ' ') {
            e.preventDefault()
            addTag(input)
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1))
        }
    }

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove))
    }

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm"
                    >
            {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-500 hover:text-gray-700"
                        >
              ×
            </button>
          </span>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => input && addTag(input)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Type tags and press space, tab, or comma"
            />
        </div>
    )
}