'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export default function Header({ user }: { user: User }) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl">
                    <Link
                        href="/">Saturn</Link>
                </h1>
                <div className="flex items-right">
                    <Link
                        href="/entries/new"
                        className="text-sm mr-2"
                    >
                        New
                    </Link>

                    <ThemeToggle />

                    <button
                        onClick={handleLogout}
                        className="text-sm cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    )
}