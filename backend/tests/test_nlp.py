"""Tests for nlp_service. Pure functions, no DB or network."""

from datetime import date, timedelta

from app.services.nlp_service import extract_tasks_ner, urgency_score
from app.models.task import TaskPriority


class TestUrgencyScore:
    def test_no_deadline_returns_low_base(self):
        score = urgency_score(None, 0)
        assert score == 0.05

    def test_overdue_task_clamps_to_one(self):
        yesterday = date.today() - timedelta(days=1)
        assert urgency_score(yesterday, 0) == 1.0

    def test_due_today_clamps_to_one(self):
        assert urgency_score(date.today(), 0) == 1.0

    def test_due_tomorrow_scores_one(self):
        tomorrow = date.today() + timedelta(days=1)
        score = urgency_score(tomorrow, 0)
        assert score == 1.0

    def test_due_in_10_days_scores_point_one(self):
        future = date.today() + timedelta(days=10)
        score = urgency_score(future, 0)
        assert abs(score - 0.1) < 0.001

    def test_workload_increases_score(self):
        future = date.today() + timedelta(days=10)
        low = urgency_score(future, 0)
        high = urgency_score(future, 5)
        assert high > low

    def test_score_never_exceeds_one(self):
        future = date.today() + timedelta(days=1)
        # Even with a huge workload the score must stay at 1.0.
        assert urgency_score(future, 1000) == 1.0

    def test_result_rounded_to_four_decimals(self):
        future = date.today() + timedelta(days=7)
        score = urgency_score(future, 3)
        assert score == round(score, 4)


class TestExtractTasksNer:
    def test_extracts_action_item_sentence(self):
        text = "Alice will send the report by Friday."
        results = extract_tasks_ner(text)
        assert len(results) == 1
        assert "Alice" in results[0].title or "send" in results[0].title.lower()

    def test_non_action_sentence_ignored(self):
        text = "The weather is nice today. We had a great lunch."
        results = extract_tasks_ner(text)
        assert results == []

    def test_high_priority_detected(self):
        text = "This is urgent, John must fix the bug immediately."
        results = extract_tasks_ner(text)
        assert len(results) >= 1
        assert results[0].priority == TaskPriority.high

    def test_low_priority_detected(self):
        text = "Eventually we should update the documentation."
        results = extract_tasks_ner(text)
        assert len(results) >= 1
        assert results[0].priority == TaskPriority.low

    def test_default_priority_is_medium(self):
        text = "Bob should review the pull request."
        results = extract_tasks_ner(text)
        assert results[0].priority == TaskPriority.medium

    def test_duplicate_lines_deduplicated(self):
        text = "Alice will fix the bug. Alice will fix the bug."
        results = extract_tasks_ner(text)
        assert len(results) == 1

    def test_empty_text_returns_empty_list(self):
        assert extract_tasks_ner("") == []

    def test_very_short_line_skipped(self):
        # Lines under 10 chars are filtered by _clean().
        text = "will do"
        results = extract_tasks_ner(text)
        assert results == []

    def test_header_line_skipped(self):
        # Lines ending with ":" are headers, not tasks.
        text = "Action items:"
        results = extract_tasks_ner(text)
        assert results == []
