'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { PlusCircleIcon, ArrowRightStartOnRectangleIcon, ShareIcon } from '@heroicons/react/24/outline'
import {Button} from "@/components/Button";


export default function Header() {
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
                    <Button
                        href="/entries/new"
                        variant="ghost"
                        className="inline-flex items-center gap-1"
                    >
                        <PlusCircleIcon className="h-5 w-5" /> New
                    </Button>

                    <Button
                        href="/embeddings-map"
                        variant="ghost"
                        className="inline-flex items-center gap-1"
                    >
                        <ShareIcon className="h-5 w-5" /> Map
                    </Button>

                    <ThemeToggle />

                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="inline-flex items-center gap-1"
                    >
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5" /> Sign Out
                    </Button>
                </div>
            </div>
        </header>
    )
}
