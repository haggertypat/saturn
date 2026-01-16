import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EntryList from '@/components/EntryList'
import Header from '@/components/Header'

export default async function Home() {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: entries } = await supabase
        .from('entries')
        .select('*')
        .order('event_datetime', { ascending: false })

    return (
        <div className="min-h-screen bg-white">
            <Header user={user} />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <EntryList initialEntries={entries || []} />
            </main>
        </div>
    )
}