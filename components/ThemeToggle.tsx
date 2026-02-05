// components/ThemeToggle.tsx
'use client'

import { MoonIcon } from '@heroicons/react/24/outline'
import {Button} from "@/components/Button";

export function ThemeToggle() {
    function toggle() {
        const isDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.toggle('dark', !isDark)
        localStorage.setItem('theme', isDark ? 'light' : 'dark')
    }

    return (
        <Button
            className="cursor-pointer inline-flex items-center gap-1"
            variant="ghost"
            onClick={toggle}>
            <MoonIcon className="h-5 w-5" />
        </Button>
    )
}
