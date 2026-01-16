import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import EntryView from '@/components/EntryView'

export default async function ViewEntry({
                                            params
                                        }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: entry } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single()

    if (!entry) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-white">
            <Header user={user} />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <EntryView entry={entry} />
            </main>
        </div>
    )
}