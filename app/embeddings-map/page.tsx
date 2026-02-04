import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

const nodes = [
    {
        id: 'entry-01',
        title: 'Lunar Concepts',
        summary: 'Analogies between tides, focus cycles, and circadian peaks.',
        x: 12,
        y: 18,
        cluster: 'Exploration',
        tags: ['rhythm', 'biology'],
    },
    {
        id: 'entry-02',
        title: 'Sustainability Notes',
        summary: 'Urban planning ideas pulled from nature-first zoning.',
        x: 38,
        y: 14,
        cluster: 'Exploration',
        tags: ['cities', 'systems'],
    },
    {
        id: 'entry-03',
        title: 'Customer Interviews',
        summary: 'Patterns from onboarding sessions and recurring questions.',
        x: 65,
        y: 18,
        cluster: 'Research',
        tags: ['product', 'insights'],
    },
    {
        id: 'entry-04',
        title: 'Prototype Sketches',
        summary: 'Whiteboard flows showing new navigation ideas.',
        x: 82,
        y: 36,
        cluster: 'Research',
        tags: ['ux', 'flow'],
    },
    {
        id: 'entry-05',
        title: 'Signal vs Noise',
        summary: 'Separating action items from ambient chatter.',
        x: 18,
        y: 52,
        cluster: 'Operations',
        tags: ['process', 'focus'],
    },
    {
        id: 'entry-06',
        title: 'Roadmap Threads',
        summary: 'How themes group into quarters and shared bets.',
        x: 46,
        y: 48,
        cluster: 'Operations',
        tags: ['planning', 'strategy'],
    },
    {
        id: 'entry-07',
        title: 'Content Experiments',
        summary: 'Testing new formats across publishing channels.',
        x: 71,
        y: 56,
        cluster: 'Activation',
        tags: ['growth', 'voice'],
    },
    {
        id: 'entry-08',
        title: 'Partnership Ideas',
        summary: 'Shared audience overlaps and co-marketing topics.',
        x: 30,
        y: 78,
        cluster: 'Activation',
        tags: ['partners', 'reach'],
    },
    {
        id: 'entry-09',
        title: 'Pricing Research',
        summary: 'Elasticity insights pulled from surveys.',
        x: 60,
        y: 80,
        cluster: 'Activation',
        tags: ['revenue', 'ops'],
    },
]

const links = [
    ['entry-01', 'entry-02'],
    ['entry-02', 'entry-03'],
    ['entry-03', 'entry-04'],
    ['entry-02', 'entry-06'],
    ['entry-05', 'entry-06'],
    ['entry-06', 'entry-07'],
    ['entry-07', 'entry-09'],
    ['entry-08', 'entry-09'],
    ['entry-05', 'entry-08'],
]

const clusterStyles: Record<string, string> = {
    Exploration: 'border-amber-200/70 bg-amber-50/80 text-amber-900',
    Research: 'border-sky-200/70 bg-sky-50/80 text-sky-900',
    Operations: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-900',
    Activation: 'border-violet-200/70 bg-violet-50/80 text-violet-900',
}

export default async function EmbeddingsMapPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50/60">
            <Header />
            <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                <section className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        Embedding Topology View
                    </p>
                    <h2 className="text-3xl font-semibold text-slate-900">
                        Explore how related entries cluster across semantic distance
                    </h2>
                    <p className="text-slate-600 max-w-2xl">
                        This map uses embedding similarity to pull smaller entry cards together.
                        Cards closer in space share stronger semantic relationships, while faint
                        connectors highlight the strongest edges in the network.
                    </p>
                </section>

                <section className="relative h-[640px] w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_55%)]" />
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {links.map(([sourceId, targetId]) => {
                            const source = nodes.find((node) => node.id === sourceId)
                            const target = nodes.find((node) => node.id === targetId)

                            if (!source || !target) {
                                return null
                            }

                            return (
                                <line
                                    key={`${sourceId}-${targetId}`}
                                    x1={source.x}
                                    y1={source.y}
                                    x2={target.x}
                                    y2={target.y}
                                    stroke="rgba(148, 163, 184, 0.35)"
                                    strokeWidth="0.4"
                                />
                            )
                        })}
                    </svg>

                    {nodes.map((node) => (
                        <article
                            key={node.id}
                            className="absolute w-56 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                            <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur ${clusterStyles[node.cluster]}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                                            {node.cluster}
                                        </p>
                                        <h3 className="text-lg font-semibold text-slate-900">{node.title}</h3>
                                    </div>
                                    <span className="h-3 w-3 rounded-full bg-white/80 ring-2 ring-slate-200" />
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{node.summary}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {node.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-xs font-medium text-slate-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-700">Embedding clusters</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Each cluster groups entries that share semantic themes based on their embedding vectors.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-700">Edge strength</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Lines visualize the strongest nearest-neighbor relationships to avoid a crowded graph.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-700">Interaction ideas</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Future states could add drag, zoom, and live updates as new entries appear.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    )
}
