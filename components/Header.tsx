'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

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
                <h1 className="text-2xl font-light text-gray-900">Journal</h1>
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    Sign Out
                </button>
            </div>
        </header>
    )
}