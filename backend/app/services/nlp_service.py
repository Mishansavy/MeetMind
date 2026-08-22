import re
from datetime import date, datetime
from typing import Optional

import spacy

from app.models.task import TaskPriority
from app.schemas.task import ExtractedTaskPreview

# spaCy model loaded once at import time, reloading per request would add ~300ms latency.
_nlp = spacy.load("en_core_web_sm")

# Sentence boundary split on .!? followed by whitespace.
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")

# Lines matching any of these verbs are treated as action items.
# "needs? to" covers both "need to" and "needs to".
_ACTION_RE = re.compile(
    r"\b(will|(?:i|we|you|he|she|they)'ll|should|must|needs?\s+to|assigned\s+to|action\s+item|to[- ]do|follow[- ]up)\b",
    re.IGNORECASE,
)

# Keyword-based priority signals, high beats low, anything else is medium.
_HIGH_RE = re.compile(r"\b(urgent|asap|immediately|critical|today)\b", re.IGNORECASE)
_LOW_RE = re.compile(r"\b(eventually|someday|nice[- ]to[- ]have|low priority)\b", re.IGNORECASE)

# Fallback date extraction when spaCy's DATE entity misses relative phrases like "by Friday".
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
    # Skip header lines (end with ":") and fragments too short to be a real task.
    if len(s) < 10 or s.endswith(":"):
        return None
    return s[0].upper() + s[1:]


def urgency_score(deadline: Optional[date], workload_count: int) -> float:
    """Compute a 0–1 urgency score for a task.

    Combines two signals:
    - Deadline proximity: derived from Earliest Deadline First (EDF) scheduling theory.
      score = 1/days_remaining, so a task due tomorrow scores 1.0 and one due in 10 days
      scores 0.1. Overdue tasks are clamped to 1.0. No deadline → 0.05 (low urgency).
    - Workload factor: a 10% penalty per existing incomplete task, inspired by the Time
      Criticality component of the WSJF (Weighted Shortest Job First) framework from the
      Scaled Agile Framework. Accounts for the fact that urgency compounds under load.

    Result is clamped to 1.0 and rounded to 4 decimal places.
    """
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
    """Extract action items from free-form meeting text using spaCy NER.

    Strategy:
    1. Split text into sentences, then further by newlines (handles bullet notes).
    2. Keep only lines that contain action-verb phrases (the _ACTION_RE filter).
    3. For each candidate line, run spaCy NER to pick up PERSON (assignee) and
       DATE/TIME (deadline hint). Fall back to a regex for date phrases spaCy misses.
    4. Deduplicate by normalised title to handle repeated sentences in transcripts.
    """
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

        doc = _nlp(line)
        assignee: Optional[str] = None
        deadline_raw: Optional[str] = None

        for ent in doc.ents:
            if ent.label_ == "PERSON" and assignee is None:
                assignee = ent.text.strip()
            elif ent.label_ in ("DATE", "TIME") and deadline_raw is None:
                deadline_raw = ent.text.strip()

        # spaCy sometimes misses short relative phrases, this regex catches "by Friday" etc.
        if deadline_raw is None:
            m = _DATE_PHRASE_RE.search(line)
            if m:
                deadline_raw = m.group(2).strip()

        results.append(
            ExtractedTaskPreview(
                title=title,
                assignee_name=assignee,
                priority=_priority(line),
                deadline_raw=deadline_raw,
            )
        )

    return results
