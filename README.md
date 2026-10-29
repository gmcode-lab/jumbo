# 🐘 Jumbo: AI Research Assistant

**Research made readable, powered by open-source NVIDIA Nemotron models.**

Built for the **Nebius x NVIDIA Global AI Hackathon** by me.

---

## The problem

Millions of research papers are published every year. Even experts cannot read them all, and for students and curious people the language is hard to follow. Choosing *which* paper deserves your time is slow and frustrating.

## The solution

**Jumbo** is an AI research assistant that helps anyone **discover** papers and **understand** them in plain English. Search a topic, click one button, and get a beginner-friendly breakdown. Then keep the conversation going by asking the paper follow-up questions.

---

## AI provider note

Jumbo's AI runs on **NVIDIA Nemotron** (`MODEL-ID`) through NVIDIA's hosted OpenAI-compatible API. The backend was built for the Nebius Token Factory API format and works with it unchanged: set `NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/`, add a Token Factory key, and choose a model ID. We could not finish Nebius billing setup before the deadline, so the submitted build uses NVIDIA's endpoint.

---

## Features

- 🔍 **Dual-source search:** queries **arXiv** (preprints) and **Crossref** (published journals) *at the same time* and merges the results into one list.
- ✨ **AI Insights drawer:** a right-side panel with a one-sentence **TL;DR**, **key ideas**, **why it matters**, and a **difficulty rating**.
- 💬 **Ask Jumbo:** chat with any paper. Answers are grounded in the paper's abstract, and Jumbo says so when the abstract does not contain the answer.
- ⭐ **Saved library:** bookmark papers; they persist in the browser with no account needed.
- 🕘 **Search history** with one-click re-run, plus trending topic chips.
- 🎛️ **Filters and sorting:** filter by source (All, arXiv, Crossref) and sort by relevance or newest.
- 🌗 **Light and dark mode** with a one-click switch that remembers your choice.
- 🧪 **Demo mode:** a clearly labelled mode with sample papers and sample AI text, for UI testing without an API key.
- 🛟 **Graceful fallback:** if no AI key is configured, the backend returns clearly labelled extracts instead of crashing.
- ⚡ **Search cache:** repeat searches within 10 minutes are instant.
- ⌨️ **Keyboard shortcut:** press `/` anywhere to jump to the search box.

---

## Tech stack

| Layer | Technology | Why we used it |
|---|---|---|
| Frontend framework | **React** | Component-based UI and simple state handling |
| Build tool | **Vite** | Very fast dev server and builds |
| Styling | **Tailwind CSS v4** | Fast, consistent light and dark themes |
| Backend framework | **Python 3.10+ and FastAPI** | Quick async APIs with an automatic `/docs` page |
| Server | **Uvicorn** | ASGI server that runs FastAPI |
| HTTP client | **httpx** | Async calls to arXiv and Crossref |
| Data validation | **Pydantic** | Typed request bodies |
| Config | **python-dotenv** | Keeps secrets in `.env`, out of the code |
| AI inference | **NVIDIA hosted API** (build.nvidia.com) | Free, OpenAI-compatible endpoint for open models |
| Alternative provider | **Nebius Token Factory** (supported) | Same format; switch by changing 3 environment variables |
| AI client | **openai** Python SDK (`AsyncOpenAI`) | One SDK that works with any OpenAI-compatible provider |
| Model | **NVIDIA Nemotron** (`MODEL-ID`) | Summaries and follow-up answers |
| Paper data | **arXiv API** and **Crossref REST API** | Free, public scholarly metadata |
| Version control | **Git and GitHub** | Source hosting |
| Frontend hosting | **Vercel** | Free hosting with a public URL |
| Backend hosting | **Render** | Free Python web service |

**Languages:** Python, JavaScript (JSX), CSS (Tailwind), Markdown

---

## Architecture

```
 Browser (React + Tailwind, hosted on Vercel)
        |
        |  HTTPS / JSON
        v
 FastAPI backend (hosted on Render)
        |-- GET  /search     --> arXiv API + Crossref API (in parallel)
        |-- POST /summarize  --> NVIDIA Nemotron via OpenAI-compatible API
        |-- POST /ask        --> NVIDIA Nemotron via OpenAI-compatible API
        '-- GET  /health     --> status and AI mode
```

### How a request flows

1. The user types a topic; React calls `GET /search?q=...`.
2. The backend asks **arXiv** and **Crossref** at the same time, cleans both replies, removes duplicate titles, and interleaves the results.
3. The user clicks **AI Insights**; React sends the paper's title and abstract to `POST /summarize`.
4. The backend wraps them in a strict system prompt and calls the Nemotron model through the OpenAI-compatible API.
5. The answer is parsed into styled sections (TL;DR, key ideas, why it matters, difficulty) in the drawer.
6. Follow-up questions go to `POST /ask` with the last six messages as memory.

---

## API reference

| Method | Endpoint | Purpose | Body or params |
|---|---|---|---|
| GET | `/` | Liveness message | none |
| GET | `/health` | Status, `ai_mode` (`nebius` means a key is configured; `fallback` means no key), model name | none |
| GET | `/search` | Search arXiv and Crossref | `q` (required), `max_results` (default 12, max 30) |
| POST | `/summarize` | Beginner-friendly breakdown of a paper | `{ title, abstract }` |
| POST | `/ask` | Follow-up question about one paper | `{ title, abstract, question, history[] }` |

Interactive docs are available at `/docs` when the backend is running.

---

## How the AI is used

All AI features run on **NVIDIA Nemotron** (`MODEL-ID`), served by NVIDIA's hosted API at build.nvidia.com and called through the standard OpenAI-compatible interface. The backend reads three environment variables, so it works with **any** OpenAI-compatible provider, including **Nebius Token Factory**:

```python
from openai import AsyncOpenAI

ai_client = AsyncOpenAI(
    api_key=API_KEY,    # your provider's key
    base_url=BASE_URL,  # https://integrate.api.nvidia.com/v1 for NVIDIA
)

completion = await ai_client.chat.completions.create(
    model=MODEL,        # e.g. MODEL-ID
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Title: {title}\n\nAbstract: {abstract}"},
    ],
    temperature=0.3,
    m
