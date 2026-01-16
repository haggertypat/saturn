import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import EntryForm from '@/components/EntryForm'

export default async function EditEntry({
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
            <main className="max-w-4xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-light text-gray-900 mb-6">Edit</h2>
                <EntryForm entry={entry} />
            </main>
        </div>
    )
}