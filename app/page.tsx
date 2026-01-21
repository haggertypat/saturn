import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import InfiniteEntryList from "@/components/InfiniteEntryList";

export default async function Home() {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            <Header />
            <main className="max-w-2xl mx-auto py-10 px-4">
                <InfiniteEntryList />
            </main>
        </div>
    )
}