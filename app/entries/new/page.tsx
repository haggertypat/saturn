import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EntryForm from '@/components/EntryForm'
import Header from '@/components/Header'

export default async function NewEntry() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <EntryForm />
            </main>
        </div>
    )
}