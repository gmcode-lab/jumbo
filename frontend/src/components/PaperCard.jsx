import { useState } from 'react'

export default function PaperCard({ paper, isSaved, isSelected, onInsights, onToggleSave }) {
  const [expanded, setExpanded] = useState(false)

  const badge =
    paper.source === 'arXiv'
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:bg-slate-900 dark:hover:border-indigo-500 ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-snug">{paper.title}</h2>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
          {paper.source}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {paper.authors.slice(0, 3).join(', ')}
        {paper.authors.length > 3 ? ' et al.' : ''} · {paper.published}
      </p>

      <p
        className={`mt-3 text-sm text-slate-700 dark:text-slate-300 ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {paper.abstract}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onInsights(paper)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          ✨ AI Insights
        </button>
        <button
          onClick={() => onToggleSave(paper)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            isSaved
              ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
          }`}
        >
          {isSaved ? '★ Saved' : '☆ Save'}
        </button>
        {paper.pdf_url && (
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {paper.source === 'arXiv' ? '📄 PDF' : '🔗 Publisher page'}
          </a>
        )}
      </div>
    </article>
  )
}