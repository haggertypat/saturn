import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import InfiniteEntryList from "@/components/InfiniteEntryList";
import { cookies } from 'next/headers'

export default async function Home() {
    const supabase = await createServerSupabaseClient()
    const cookieStore = await cookies()
    const viewModeCookie = cookieStore.get('entries-view-mode')?.value
    const initialViewMode =
        viewModeCookie === 'long' || viewModeCookie === 'cards' ? viewModeCookie : 'cards'

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            <Header />
            <main className="max-w-2xl mx-auto py-10 px-4">
                <InfiniteEntryList initialViewMode={initialViewMode} />
            </main>
        </div>
    )
}
