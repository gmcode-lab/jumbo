import { useEffect, useMemo, useRef, useState } from 'react'
import PaperCard from './components/PaperCard.jsx'
import InsightsDrawer from './components/InsightsDrawer.jsx'
import { searchPapers } from './lib/api.js'
import { SAMPLE_PAPERS, TRENDING } from './lib/demo.js'

// Read a saved value from the browser's notepad (safe if missing or broken)
function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return value ?? fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('jumbo-theme') || 'dark')
  const [demoMode, setDemoMode] = useState(() => load('jumbo-demo', false))
  const [saved, setSaved] = useState(() => load('jumbo-saved', []))
  const [history, setHistory] = useState(() => load('jumbo-history', []))

  const [view, setView] = useState('search') // search | saved | history
  const [query, setQuery] = useState('')
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const [sourceFilter, setSourceFilter] = useState('All')
  const [sort, setSort] = useState('relevance')
  const [selected, setSelected] = useState(null)

  const searchRef = useRef(null)

  // Save settings to the browser whenever they change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('jumbo-theme', theme)
  }, [theme])
  useEffect(() => localStorage.setItem('jumbo-demo', JSON.stringify(demoMode)), [demoMode])
  useEffect(() => localStorage.setItem('jumbo-saved', JSON.stringify(saved)), [saved])
  useEffect(() => localStorage.setItem('jumbo-history', JSON.stringify(history)), [history])

  // Press "/" anywhere to jump to the search box
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isSaved = (paper) => saved.some((p) => p.id === paper.id)
  const toggleSave = (paper) =>
    setSaved((cur) =>
      cur.some((p) => p.id === paper.id) ? cur.filter((p) => p.id !== paper.id) : [paper, ...cur]
    )

  const runSearch = async (text) => {
    const q = text.trim()
    if (!q) return

    setQuery(q)
    setView('search')
    setSearched(true)
    setLoading(true)
    setError('')
    setSourceFilter('All')
    setHistory((cur) => [q, ...cur.filter((h) => h !== q)].slice(0, 10))

    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 600))
        setPapers(SAMPLE_PAPERS)
      } else {
        const data = await searchPapers(q)
        setPapers(data.papers)
      }
    } catch (err) {
      setError(err.message)
      setPapers([])
    } finally {
      setLoading(false)
    }
  }

  const list = view === 'saved' ? saved : papers
  const visible = useMemo(() => {
    let result = sourceFilter === 'All' ? list : list.filter((p) => p.source === sourceFilter)
    if (sort === 'newest') {
      result = [...result].sort((a, b) => b.published.localeCompare(a.published))
    }
    return result
  }, [list, sourceFilter, sort])

  const navClass = (active) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
      active
        ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`

  const chipClass = (active) =>
    `rounded-full border px-3 py-1 text-xs ${
      active
        ? 'border-indigo-500 bg-indigo-600 text-white'
        : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
    }`

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">🐘 Jumbo</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">AI research assistant</p>

        <nav className="mt-8 space-y-2">
          <button onClick={() => setView('search')} className={navClass(view === 'search')}>
            <span>🔍 Search</span>
          </button>
          <button onClick={() => setView('saved')} className={navClass(view === 'saved')}>
            <span>⭐ Saved</span>
            {saved.length > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {saved.length}
              </span>
            )}
          </button>
          <button onClick={() => setView('history')} className={navClass(view === 'history')}>
            <span>🕘 History</span>
          </button>
        </nav>

        <label className="mt-auto flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
          <span>
            <span className="block font-medium">Demo mode</span>
            <span className="text-slate-500 dark:text-slate-400">Fake AI, no key needed</span>
          </span>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              runSearch(query)
            }}
            className="flex items-center gap-3"
          >
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search research papers... (press "/" to focus)'
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Switch light/dark mode"
              className="rounded-lg border border-slate-300 px-3 py-2 text-lg hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </form>

          {/* Mobile tabs + demo switch */}
          <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
            <button onClick={() => setView('search')} className={chipClass(view === 'search')}>🔍 Search</button>
            <button onClick={() => setView('saved')} className={chipClass(view === 'saved')}>⭐ Saved ({saved.length})</button>
            <button onClick={() => setView('history')} className={chipClass(view === 'history')}>🕘 History</button>
            <button onClick={() => setDemoMode(!demoMode)} className={chipClass(demoMode)}>
              {demoMode ? 'Demo: ON' : 'Demo: OFF'}
            </button>
          </div>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto p-6">
          {demoMode && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              Demo mode is ON: sample papers and fake AI answers. Turn it off once your Nebius key works.
            </div>
          )}

          {/* HISTORY VIEW */}
          {view === 'history' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  🕘 Recent searches
                </h2>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="mt-16 text-center text-sm text-slate-500 dark:text-slate-400">
                  No searches yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button key={h} onClick={() => runSearch(h)} className={chipClass(false)}>
                      🔍 {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEARCH + SAVED VIEWS */}
          {view !== 'history' && (
            <>
              {view === 'saved' && (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  ⭐ Saved papers ({saved.length})
                </h2>
              )}

              {/* Filters */}
              {list.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {['All', 'arXiv', 'Crossref'].map((s) => (
                    <button key={s} onClick={() => setSourceFilter(s)} className={chipClass(sourceFilter === s)}>
                      {s}
                    </button>
                  ))}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="ml-auto rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="newest">Sort: Newest</option>
                  </select>
                </div>
              )}

              {view === 'search' && error && (
                <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  <p>{error}</p>
                  <button
                    onClick={() => setDemoMode(true)}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Use Demo mode instead
                  </button>
                </div>
              )}

              {view === 'search' && !searched && !loading && (
                <div className="mt-16 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-5xl">🐘</p>
                  <p className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                    What do you want to learn about?
                  </p>
                  <p className="mt-1 text-sm">Try one of these:</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {TRENDING.map((t) => (
                      <button key={t} onClick={() => runSearch(t)} className={chipClass(false)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {view === 'search' && loading &&
                [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}

              {view === 'search' && searched && !loading && !error && visible.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No papers found. Try another topic or filter.
                </p>
              )}

              {view === 'saved' && saved.length === 0 && (
                <div className="mt-16 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-4xl">⭐</p>
                  <p className="mt-2 text-sm">Nothing saved yet. Press "Save" on a paper to keep it here.</p>
                </div>
              )}

              {!(view === 'search' && loading) &&
                visible.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isSaved={isSaved(paper)}
                    isSelected={selected?.id === paper.id}
                    onInsights={setSelected}
                    onToggleSave={toggleSave}
                  />
                ))}
            </>
          )}
        </section>
      </main>

      {/* Right-side drawer. "key" resets it for each new paper */}
      {selected && (
        <InsightsDrawer
          key={selected.id}
          paper={selected}
          demoMode={demoMode}
          onClose={() => setSelected(null)}
          onEnableDemo={() => setDemoMode(true)}
        />
      )}
    </div>
  )
}