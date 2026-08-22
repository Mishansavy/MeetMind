# Contributing to MeetMind

## Before you start

Contributions require agreeing to the [Contributor License Agreement](CLA.md).
MeetMind ships under AGPL-3.0 and is also offered under separate commercial
terms, which the owner can only do while holding sufficient rights over the
whole codebase. You keep the copyright in your work.

You agree by ticking the CLA box in the pull request template. If you would
rather not, open an issue describing the change instead.

## Setting up

See [README](README.md#getting-started). The two steps people miss are ffmpeg
and the spaCy model, and the backend will not start without either.

## Making a change

Branch off `main`. Keep pull requests to one concern, and say what you changed
and why in the description.

Run the checks before you open it:

```bash
cd backend && pytest
cd frontend && npm run build
```

Both must pass. The test suite needs a local PostgreSQL server and creates its
own `meetmind_test` database.

## Style

Match the surrounding code. A few conventions that are not obvious:

- Comments are short, one line, and explain why rather than what. No block
  comments describing what a function does step by step.
- Frontend uses 4-space indentation, plain JavaScript, no TypeScript.
- Backend follows the existing router, service, schema, model split. Business
  logic belongs in `services/`, not in route handlers.
- Stage explicit paths when committing. The repo root carries untracked build
  artefacts that `git add -A` will sweep in.

## Reporting bugs

Include what you did, what happened, and what you expected. For anything
involving live meetings, say which browsers were on each end, since WebRTC
behaviour varies.

## Security

Do not open a public issue for a security problem. Contact the owner directly.
