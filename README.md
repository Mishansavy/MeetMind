# MeetMind

A team meeting intelligence tool. Records, transcribes, and summarizes meetings — and assigns action items automatically. Built as a college project.

---

## What's in here

```
codebase/
├── backend/     FastAPI + PostgreSQL
└── frontend/    React + Tailwind
```

**Current features**
- Registration with email verification
- Admin approval flow before users can log in
- Separate dashboards for admin and regular users
- Admin can approve, reject, and remove members

**Planned**
- Live meetings via WebRTC
- Whisper-based transcription
- AI meeting summaries and task extraction
- Email reminders via APScheduler

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

There's no signup flow for admins — set one up directly in the database:

```sql
UPDATE users
SET role = 'admin', is_email_verified = true, is_approved = true
WHERE email = 'your@email.com';
```

---

## Notes

- bcrypt is pinned to `4.0.1` — passlib breaks with v5
- The `DATABASE_URL` in `.env` uses `postgresql://`, the app converts it to `postgresql+asyncpg://` automatically
- Email verification uses Gmail SMTP with an app password, not your account password
