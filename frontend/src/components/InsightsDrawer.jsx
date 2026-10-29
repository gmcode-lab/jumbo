import { useEffect, useRef, useState } from 'react'
import { askPaper, summarizePaper } from '../lib/api.js'
import { demoAnswer, demoSummary } from '../lib/demo.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const SUGGESTIONS = ["Explain it like I'm 12", 'What method did they use?', 'What are the limitations?']

// Split the AI text into labelled sections (falls back to plain text if it can't)
function parseSummary(text) {
  const clean = text.replace(/\*\*/g, '')
  const pattern =
    /(TL;DR|Key Ideas|Why It Matters|Difficulty)\s*:\s*([\s\S]*?)(?=\n\s*(?:TL;DR|Key Ideas|Why It Matters|Difficulty)\s*:|$)/gi
  return [...clean.matchAll(pattern)].map((m) => ({
    label: m[1].toLowerCase(),
    body: m[2].trim(),
  }))
}

function Summary({ text }) {
  const sections = parseSummary(text)
  if (sections.length === 0) {
    return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
  }

  return (
    <div className="space-y-3">
      {sections.map((s) => {
        if (s.label === 'tl;dr') {
          return (
            <div
              key={s.label}
              className="rounded-lg bg-indigo-50 p-3 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wide">TL;DR</p>
              <p className="mt-1 leading-relaxed">{s.body}</p>
            </div>
          )
        }
        if (s.label === 'key ideas') {
          const items = s.body.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
          return (
            <div key={s.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Key ideas
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )
        }
        if (s.label === 'difficulty') {
          return (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Difficulty
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                {s.body}
              </span>
            </div>
          )
        }
        return (
          <div key={s.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Why it matters
            </p>
            <p className="mt-1 leading-relaxed">{s.body}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function InsightsDrawer({ paper, demoMode, onClose, onEnableDemo }) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chat, setChat] = useState([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [copied, setCopied] = useState(false)
  const endRef = useRef(null)

  // Load the summary whenever the paper (or demo mode) changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setSummary('')

    const job = demoMode
      ? delay(800).then(() => demoSummary(paper))
      : summarizePaper(paper).then((data) => data.summary)

    job
      .then((text) => !cancelled && setSummary(text))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [paper, demoMode])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, asking, summary])

  const send = async (text) => {
    const q = text.trim()
    if (!q || asking || !summary) return

    const history = chat
    setChat([...history, { role: 'user', content: q }])
    setQuestion('')
    setAsking(true)

    try {
      let answer
      if (demoMode) {
        await delay(800)
        answer = demoAnswer(q)
      } else {
        const data = await askPaper(paper, q, history)
        answer = data.answer
      }
      setChat((c) => [...c, { role: 'assistant', content: answer }])
    } catch (err) {
      setChat((c) => [...c, { role: 'assistant', content: `⚠️ ${err.message}` }])
    } finally {
      setAsking(false)
    }
  }

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-20 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-[28rem] lg:static lg:shadow-none">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            ✨ AI Insights {demoMode && <span className="ml-1 text-amber-600">· Demo</span>}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug">{paper.title}</h3>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm text-slate-700 dark:text-slate-300">
        {loading && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Jumbo is reading the paper...
            </p>
            <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {error && (
          <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p>{error}</p>
            {!demoMode && (
              <button
                onClick={onEnableDemo}
                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
              >
                Switch to Demo mode
              </button>
            )}
          </div>
        )}

        {summary && (
          <>
            <Summary text={summary} />
            <button
              onClick={copySummary}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {copied ? '✓ Copied' : '📋 Copy summary'}
            </button>
          </>
        )}

        {summary && chat.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-indigo-300 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {chat.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {asking && (
          <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Jumbo is thinking...
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(question)
        }}
        className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!summary}
          placeholder={summary ? 'Ask Jumbo about this paper...' : 'Waiting for summary...'}
          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={!summary || asking || !question.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {demoMode
          ? 'Demo mode: sample answers, no AI key needed.'
          : 'Generated by an open-source model on Nebius Token Factory.'}
      </div>
    </aside>
  )
}