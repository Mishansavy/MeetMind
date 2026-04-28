import re
from datetime import date, datetime
from typing import Optional

import spacy

from app.models.task import TaskPriority
from app.schemas.task import ExtractedTaskPreview

# Load once at module level — avoids per-request overhead
_nlp = spacy.load("en_core_web_sm")

_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")
_ACTION_RE = re.compile(
    r"\b(will|should|must|needs?\s+to|assigned\s+to|action\s+item|to[- ]do|follow[- ]up)\b",
    re.IGNORECASE,
)
_HIGH_RE = re.compile(r"\b(urgent|asap|immediately|critical|today)\b", re.IGNORECASE)
_LOW_RE = re.compile(r"\b(eventually|someday|nice[- ]to[- ]have|low priority)\b", re.IGNORECASE)

# Rough date phrase patterns for deadline_raw extraction when spaCy DATE misses
_DATE_PHRASE_RE = re.compile(
    r"\b(by|before|due|on|until)\s+([A-Za-z0-9 ,]+(?:st|nd|rd|th)?(?:\s+\d{4})?)",
    re.IGNORECASE,
)


def _priority(sentence: str) -> TaskPriority:
    if _HIGH_RE.search(sentence):
        return TaskPriority.high
    if _LOW_RE.search(sentence):
        return TaskPriority.low
    return TaskPriority.medium


def _clean(s: str) -> Optional[str]:
    s = s.strip()
    if len(s) < 10 or s.endswith(":"):
        return None
    return s[0].upper() + s[1:]


def urgency_score(deadline: Optional[date], workload_count: int) -> float:
    if deadline is None:
        base = 0.05
    else:
        days = (deadline - date.today()).days
        if days <= 0:
            base = 1.0
        else:
            base = min(1.0, 1.0 / days)
    score = base * (1 + workload_count * 0.1)
    return round(min(score, 1.0), 4)


def extract_tasks_ner(text: str) -> list[ExtractedTaskPreview]:
    # Split into candidate lines
    sentences = _SENTENCE_RE.split(text)
    lines: list[str] = []
    for s in sentences:
        lines.extend(s.splitlines())

    results: list[ExtractedTaskPreview] = []
    seen: set[str] = set()

    for line in lines:
        if not _ACTION_RE.search(line):
            continue
        title = _clean(line)
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())

        # Run NER on the sentence to find assignee and date
        doc = _nlp(line)
        assignee: Optional[str] = None
        deadline_raw: Optional[str] = None

        for ent in doc.ents:
            if ent.label_ == "PERSON" and assignee is None:
                assignee = ent.text.strip()
            elif ent.label_ in ("DATE", "TIME") and deadline_raw is None:
                deadline_raw = ent.text.strip()

        # Fallback: regex date phrase
        if deadline_raw is None:
            m = _DATE_PHRASE_RE.search(line)
            if m:
                deadline_raw = m.group(2).strip()

        results.append(
            ExtractedTaskPreview(
                title=title,
                assignee_name=assignee,
                priority=_priority(line),
                # deadline_raw surfaced to frontend; actual date parsing is Phase 3 display only
            )
        )

    return results


# Keep the rule-based version available — router uses extract_tasks_ner now
def extract_tasks_rule_based(text: str) -> list[ExtractedTaskPreview]:
    return extract_tasks_ner(text)
