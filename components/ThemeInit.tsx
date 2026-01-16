// components/ThemeInit.tsx
'use client'

import { useEffect } from 'react'

export function ThemeInit() {
    useEffect(() => {
        const saved = localStorage.getItem('theme')
        if (saved === 'dark') {
            document.documentElement.classList.add('dark')
        }
    }, [])

    return null
}
