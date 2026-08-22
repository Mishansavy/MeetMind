# MeetMind

A team meeting intelligence tool. Records, transcribes, and summarizes meetings, and assigns action items automatically. Built as a college project.

---

## What's in here

```
codebase/
├── backend/
│   ├── alembic/            migrations
│   ├── app/
│   │   ├── models/         SQLAlchemy tables
│   │   ├── routers/        HTTP and WebSocket endpoints
│   │   ├── schemas/        Pydantic request/response models
│   │   ├── services/       auth, email, NLP, transcription, scheduler
│   │   └── utils/          JWT and password hashing
│   ├── tests/
│   └── seed.py             creates the admin account
└── frontend/
    └── src/
        ├── api/            axios client, one module per resource
        ├── components/     shared UI, role layouts, Radix primitives
        ├── context/        auth and theme providers
        └── pages/          admin/ and user/ route views
```

**Features**
- Registration with email verification and admin approval flow
- Password login or emailed one-time code, plus password reset
- Separate dashboards for admin and regular users
- Meeting notes: paste text or upload PDF
- Task extraction from notes via spaCy NER, with urgency scoring
- Task tracker with priority, assignee, deadline, and urgency badge
- Email reminders the day before a task deadline
- Analytics: meetings per week, task completion trends, workload
- Live meetings over WebRTC with in-process WebSocket signaling
- Live captions via the browser Web Speech API
- Whisper transcription of a meeting, which auto-creates a note and its tasks
- Per-participant recordings with playback, download, and sharing by email
- Employee records and daily check-in/check-out attendance

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Radix UI |
| Backend | FastAPI, SQLAlchemy (async), asyncpg |
| Database | PostgreSQL |
| Auth | JWT via python-jose, bcrypt |
| Migrations | Alembic |
| NLP | spaCy (`en_core_web_sm`) |
| Transcription | openai-whisper (`base`) |
| Realtime | WebRTC via PeerJS, WebSocket signaling |
| Scheduling | APScheduler |
| PDF text | PyMuPDF |

---

## Getting started

### Prerequisites

- Python 3.12+
- Node 18+
- PostgreSQL running locally
- ffmpeg, required by Whisper to decode uploaded audio

On macOS: `brew install ffmpeg`. On Debian or Ubuntu: `apt install ffmpeg`.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Download the spaCy model. It is not a pip dependency, and task extraction fails without it:

```bash
python -m spacy download en_core_web_sm
```

Copy the example env and fill it in:

```bash
cp .env.example .env
```

`.env.example` lists every variable. `SECRET_KEY` signs all JWTs, so set it to something random. The `ADMIN_*` values are read only by `seed.py`. `SMTP_*` expects a Gmail app password rather than your account password.

Create the database, then start the server:

```bash
createdb meetmind
alembic upgrade head
uvicorn app.main:app --reload
```

The API is at `http://localhost:8000`, with interactive docs at `/docs`.

Startup also runs `create_all`, so a fresh database works without `alembic upgrade head`. Run the migrations anyway if you are upgrading an existing one.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and defaults to a backend on `localhost:8000`. To point it elsewhere, add `frontend/.env`:

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1
```

### Tests

```bash
cd backend
pytest
```

The suite needs the local PostgreSQL server. It creates a separate `meetmind_test` database on first run and rolls back each test, so it never touches your development data. Set `PGUSER` if your Postgres role differs from your shell username.

---

## Routes

| Path | Access |
|---|---|
| `/login` | Public |
| `/register` | Public |
| `/verify-email` | Public, email link |
| `/forgot-password` | Public |
| `/reset-password` | Public, email link |
| `/pending-approval` | Public |
| `/dashboard` | Users |
| `/dashboard/notes` | Users |
| `/dashboard/tasks` | Users |
| `/dashboard/analytics` | Users |
| `/dashboard/recordings` | Users |
| `/dashboard/join` | Any signed-in account |
| `/dashboard/room` | Any signed-in account |
| `/admin` | Admins |
| `/admin/employees` | Admins |
| `/admin/attendance` | Admins |
| `/admin/recordings` | Admins |

New sign-ups need both a verified email and admin approval before they can log in.

---

## Creating an admin account

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run the seed script. It is safe to re-run and skips the user if it already exists:

```bash
cd backend
python seed.py
```

It exits without doing anything if those two variables are unset.

---

## Running on your local network

To reach MeetMind from a phone or tablet on the same Wi-Fi:

1. Find your machine's local IP with `ipconfig getifaddr en0`.
2. Start the backend on all interfaces: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
3. Start the frontend with `npm run dev -- --host`
4. Set `VITE_API_URL` and `VITE_WS_URL` in `frontend/.env` to that IP, then restart the dev server.

Then open `http://192.168.x.x:5173` on any device on the network.

Browsers only grant camera and microphone access on `localhost` or over HTTPS, so live meetings on a plain-HTTP LAN address will be blocked. Use a tunnel such as ngrok to test on a real phone.

---

## Notes

- bcrypt is pinned to `4.0.1`. passlib breaks with v5.
- `DATABASE_URL` uses the `postgresql://` scheme. The app rewrites it to `postgresql+asyncpg://` at startup.
- The first transcription downloads the Whisper `base` weights, roughly 140 MB, and caches them in `~/.cache/whisper`.
- Recordings are written to `backend/uploads/recordings/`, which is not tracked by git. Nothing prunes that directory.
- WebSocket signaling is per-process, so running more than one worker breaks live meetings. Multi-server would need a shared pub/sub backend.
- Each participant records their own camera locally, so a meeting produces one file per participant rather than a single composited video.
