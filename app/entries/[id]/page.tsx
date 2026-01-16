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
        <div className="min-h-screen">
            <Header user={user} />
            <main className="mx-auto max-w-2xl px-6 py-16">
                <EntryView entry={entry} />
            </main>
        </div>
    )
}