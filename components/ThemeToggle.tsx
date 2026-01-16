// components/ThemeToggle.tsx
'use client'

export function ThemeToggle() {
    function toggle() {
        const isDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.toggle('dark', !isDark)
        localStorage.setItem('theme', isDark ? 'light' : 'dark')
    }

    return (
        <button onClick={toggle}>
            Dark mode
        </button>
    )
}
