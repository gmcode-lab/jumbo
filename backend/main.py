import asyncio
import os
import re
import time
import xml.etree.ElementTree as ET
from itertools import zip_longest

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Jumbo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

ARXIV_URL = "https://export.arxiv.org/api/query"
CROSSREF_URL = "https://api.crossref.org/works"
ATOM = {"a": "http://www.w3.org/2005/Atom"}
HEADERS = {"User-Agent": "Jumbo/1.0 (hackathon project)"}

API_KEY = os.getenv("NEBIUS_API_KEY", "").strip()
MODEL = os.getenv("NEBIUS_MODEL", "").strip()
AI_READY = bool(API_KEY and MODEL)

ai_client = AsyncOpenAI(
    api_key=API_KEY or "missing-key",
    base_url=os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/"),
    timeout=60,
)


# ---------- Helpers ----------
def clean(text):
    """Turn messy multi-line text into one tidy line."""
    return re.sub(r"\s+", " ", text or "").strip()


def strip_thinking(text):
    """Some models print <think>...</think>. Hide that part."""
    text = re.sub(r"<think>.*?</think>", "", text or "", flags=re.DOTALL)
    return text.strip()


def split_sentences(text):
    return [s for s in re.split(r"(?<=[.!?])\s+", text) if s]


# ---------- arXiv ----------
def parse_arxiv(xml_text):
    root = ET.fromstring(xml_text)
    papers = []
    for entry in root.findall("a:entry", ATOM):
        pdf_link = None
        for link in entry.findall("a:link", ATOM):
            if link.get("title") == "pdf":
                pdf_link = link.get("href")

        papers.append(
            {
                "id": clean(entry.findtext("a:id", default="", namespaces=ATOM)),
                "title": clean(entry.findtext("a:title", default="", namespaces=ATOM)),
                "abstract": clean(entry.findtext("a:summary", default="", namespaces=ATOM)),
                "authors": [
                    clean(a.findtext("a:name", default="", namespaces=ATOM))
                    for a in entry.findall("a:author", ATOM)
                ],
                "published": clean(entry.findtext("a:published", default="", namespaces=ATOM))[:10],
                "pdf_url": pdf_link,
                "source": "arXiv",
            }
        )
    return papers


async def fetch_arxiv(client, q, limit):
    params = {
        "search_query": f"all:{q}",
        "start": 0,
        "max_results": limit,
        "sortBy": "relevance",
    }
    response = await client.get(ARXIV_URL, params=params)
    response.raise_for_status()
    return parse_arxiv(response.text)



# ---------- Crossref ----------
def parse_crossref(data):
    papers = []

    for item in data.get("message", {}).get("items", []):
        titles = item.get("title") or []

        if not titles:
            continue

        abstract = clean(
            re.sub(r"<[^>]+>", " ", item.get("abstract", ""))
        )
        abstract = re.sub(r"^Abstract\s*", "", abstract)

        if not abstract:
            continue

        authors = []
        for author in item.get("author", []):
            name = clean(
                f"{author.get('given', '')} "
                f"{author.get('family', '')}"
            )
            if name:
                authors.append(name)

        date_parts = (
            item.get("issued", {}).get("date-parts") or [[]]
        )[0]

        published = "-".join(
            str(part).zfill(2) if index else str(part)
            for index, part in enumerate(date_parts)
        )

        doi = item.get("DOI", "")

        # Find a PDF link if Crossref provides one
        links = item.get("link") or []
        pdf_url = next(
            (
                link.get("URL")
                for link in links
                if "pdf" in link.get("content-type", "").lower()
            ),
            None,
        )

        # Use the DOI link as a fallback
        if not pdf_url and doi:
            pdf_url = f"https://doi.org/{doi}"

        papers.append(
            {
                "id": f"doi:{doi}" if doi else "",
                "title": clean(titles[0]),
                "abstract": abstract,
                "authors": authors,
                "published": published,
                "pdf_url": pdf_url,
                "source": "Crossref",
            }
        )

    return papers
