import re
from typing import Optional

from app.schemas.task import ExtractedTaskPreview
from app.models.task import TaskPriority

# Sentence boundary split — handles ., !, ? followed by whitespace/end
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")

# Action keywords that signal a task
_ACTION_RE = re.compile(
    r"\b(will|should|must|needs?\s+to|assigned\s+to|action\s+item|to[- ]do|follow[- ]up)\b",
    re.IGNORECASE,
)

# Simple urgency hints in text
_HIGH_RE = re.compile(r"\b(urgent|asap|immediately|critical|today)\b", re.IGNORECASE)
_LOW_RE = re.compile(r"\b(eventually|someday|nice[- ]to[- ]have|low priority)\b", re.IGNORECASE)


def _priority_from_text(sentence: str) -> TaskPriority:
    if _HIGH_RE.search(sentence):
        return TaskPriority.high
    if _LOW_RE.search(sentence):
        return TaskPriority.low
    return TaskPriority.medium


def _clean(sentence: str) -> Optional[str]:
    s = sentence.strip()
    # Skip very short or header-like lines
    if len(s) < 10 or s.endswith(":"):
        return None
    # Capitalise first letter
    return s[0].upper() + s[1:] if s else None


def extract_tasks_rule_based(text: str) -> list[ExtractedTaskPreview]:
    sentences = _SENTENCE_RE.split(text)
    # Also split on newlines so bullet-point notes work
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
        results.append(
            ExtractedTaskPreview(
                title=title,
                priority=_priority_from_text(line),
            )
        )

    return results
