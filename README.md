# MeetMind

A team meeting intelligence tool. Records, transcribes, and summarizes meetings — and assigns action items automatically. Built as a college project.

---

## What's in here

```
codebase/
├── backend/     FastAPI + PostgreSQL
└── frontend/    React + Tailwind
```

**Features**
- Registration with email verification and admin approval flow
- Separate dashboards for admin and regular users
- Meeting notes — paste text or upload PDF
- Task extraction from notes via spaCy NLP (NER + urgency scoring)
- Task tracker with priority, assignee, deadline, and urgency badge
- Automated email reminders 24h before task deadlines (APScheduler)
- Analytics dashboard — meetings per week, task completion trends
- Live meetings via WebRTC + PeerJS with in-process WebSocket signaling
- Admin can approve, reject, and remove members

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy (async), asyncpg |
| Database | PostgreSQL |
| Auth | JWT via python-jose, bcrypt |
| Migrations | Alembic |

---

## Getting started

### Prerequisites

- Python 3.12+
- Node 18+
- PostgreSQL running locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy the example env and fill it in:

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/meetmind
SECRET_KEY=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

Run migrations, then start:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`. Docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Routes

| Path | Access |
|---|---|
| `/login` | Public |
| `/register` | Public |
| `/verify-email` | Public (email link) |
| `/pending-approval` | Public |
| `/dashboard` | Logged-in users only |
| `/admin` | Admins only |

---

## Creating an admin account

Use the seed script — it creates the default admin and is safe to re-run (skips existing users):

```bash
cd backend
python seed.py
```

To add more admins, edit the `ADMINS` list in `backend/seed.py` before running.

---

## Notes

- bcrypt is pinned to `4.0.1` — passlib breaks with v5
- The `DATABASE_URL` in `.env` uses `postgresql://`, the app converts it to `postgresql+asyncpg://` automatically
- Email verification uses Gmail SMTP with an app password, not your account password
