import Header from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type YearCount = {
  year: string
  count: number
}

type CategoryCount = {
  category: string
  count: number
}

function formatCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function StatsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ count: totalEntries }, { count: totalStarred }, { data: lightweightEntries }] = await Promise.all([
    supabase.from('entries').select('id', { count: 'exact', head: true }),
    supabase.from('entries').select('id', { count: 'exact', head: true }).eq('starred', true),
    supabase.from('entries').select('event_date, category, tags'),
  ])

  const entries = lightweightEntries ?? []

  const entriesPerYear = entries.reduce<Record<string, number>>((acc, entry) => {
    const year = new Date(entry.event_date).getUTCFullYear().toString()
    acc[year] = (acc[year] ?? 0) + 1
    return acc
  }, {})

  const sortedEntriesPerYear: YearCount[] = Object.entries(entriesPerYear)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(b.year) - Number(a.year))

  const entriesByCategory = entries.reduce<Record<string, number>>((acc, entry) => {
    const category = entry.category ?? 'uncategorized'
    acc[category] = (acc[category] ?? 0) + 1
    return acc
  }, {})

  const sortedEntriesByCategory: CategoryCount[] = Object.entries(entriesByCategory)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const tagsFrequency = entries.reduce<Record<string, number>>((acc, entry) => {
    for (const tag of entry.tags ?? []) {
      const normalizedTag = tag.trim().toLowerCase()
      if (!normalizedTag) continue
      acc[normalizedTag] = (acc[normalizedTag] ?? 0) + 1
    }
    return acc
  }, {})

  const topTags = Object.entries(tagsFrequency)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const currentYear = new Date().getUTCFullYear().toString()
  const entriesThisYear = entriesPerYear[currentYear] ?? 0

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <h2 className="text-3xl font-medium">Stats</h2>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total entries</p>
            <p className="text-2xl mt-1">{totalEntries ?? 0}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total starred entries</p>
            <p className="text-2xl mt-1">{totalStarred ?? 0}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Entries this year</p>
            <p className="text-2xl mt-1">{entriesThisYear}</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <h3 className="text-lg mb-3">Entries per year</h3>
            {sortedEntriesPerYear.length === 0 ? (
              <p className="text-neutral-600 dark:text-neutral-400">No entries yet.</p>
            ) : (
              <ul className="space-y-2">
                {sortedEntriesPerYear.map((item) => (
                  <li key={item.year} className="flex justify-between">
                    <span>{item.year}</span>
                    <span className="tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <h3 className="text-lg mb-3">Entries by category</h3>
            {sortedEntriesByCategory.length === 0 ? (
              <p className="text-neutral-600 dark:text-neutral-400">No entries yet.</p>
            ) : (
              <ul className="space-y-2">
                {sortedEntriesByCategory.map((item) => (
                  <li key={item.category} className="flex justify-between gap-4">
                    <span>{formatCategory(item.category)}</span>
                    <span className="tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/*<section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">*/}
        {/*  <h3 className="text-lg mb-3">Top tags</h3>*/}
        {/*  {topTags.length === 0 ? (*/}
        {/*    <p className="text-neutral-600 dark:text-neutral-400">No tags yet.</p>*/}
        {/*  ) : (*/}
        {/*    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">*/}
        {/*      {topTags.map((item) => (*/}
        {/*        <li key={item.tag} className="flex justify-between gap-2">*/}
        {/*          <span>#{item.tag}</span>*/}
        {/*          <span className="tabular-nums">{item.count}</span>*/}
        {/*        </li>*/}
        {/*      ))}*/}
        {/*    </ul>*/}
        {/*  )}*/}
        {/*</section>*/}
      </main>
    </div>
  )
}
