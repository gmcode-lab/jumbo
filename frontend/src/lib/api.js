export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options) {
  let res
  try {
    res = await fetch(`${API}${path}`, options)
  } catch {
    throw new Error('Cannot reach the backend. Is it running?')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'Request failed.')
  }
  return res.json()
}

const post = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const searchPapers = (q) => request(`/search?q=${encodeURIComponent(q)}`)

export const summarizePaper = (paper) =>
  post('/summarize', { title: paper.title, abstract: paper.abstract })

export const askPaper = (paper, question, history) =>
  post('/ask', {
    title: paper.title,
    abstract: paper.abstract,
    question,
    history,
  })