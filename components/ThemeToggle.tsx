// components/ThemeToggle.tsx
'use client'

export function ThemeToggle() {
    function toggle() {
        const isDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.toggle('dark', !isDark)
        localStorage.setItem('theme', isDark ? 'light' : 'dark')
    }

    return (
        <button className="text-sm mr-2 cursor-pointer" onClick={toggle}>
            Dark mode
        </button>
    )
}
