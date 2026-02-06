import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AiToolsPanel from "@/components/AiToolsPanel";

export default async function AiToolsPage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: entries, error } = await supabase
        .from("entries")
        .select("id, title, event_date, body, embedding_status")
        .order("event_date", { ascending: false });

    if (error) {
        throw new Error(`Failed to load entries: ${error.message}`);
    }

    return (
        <div className="min-h-screen">
            <Header />
            <main className="max-w-4xl mx-auto py-10 px-4 space-y-4">
                <div>
                    <h1 className="text-2xl font-semibold">Embeddings &amp; AI tools</h1>
                    <p className="text-sm text-neutral-500">
                        Placeholder page for embedding and AI workflows.
                    </p>
                </div>
                <AiToolsPanel initialEntries={entries ?? []} />
            </main>
        </div>
    );
}
