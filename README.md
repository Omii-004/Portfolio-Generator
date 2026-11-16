# PortfoliAI — AI-Powered Portfolio Generator

PortfoliAI is a full-stack web app that turns a resume PDF into a structured, editable profile and generates themed portfolio pages using Google Gemini.

## Features

- **Authentication** — signup/login with JWT-based auth
- **Resume upload & parsing** — PDF upload parsed into structured data via Gemini
- **Review & edit** — review extracted details before generating a portfolio
- **Portfolio generation** — AI-generated portfolio content with multiple themes/templates
- **Preview** — live preview of generated portfolio
- **Profile & feedback** — user profile management and feedback submission

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Tailwind CSS, Axios, Three.js / React Three Fiber, Lucide React |
| Backend | FastAPI, SQLAlchemy, Pydantic, Uvicorn, JWT (PyJWT), Passlib/Bcrypt |
| AI / Parsing | Google Gemini (`google-genai`), PyPDF2 |
| Database | SQLite (default) |

## Project Structure

```text
portfolio-generator/
├── backend/
│   ├── routers/         # auth, resume, portfolio, feedback, user routes
│   ├── services/        # LLM/parsing and business logic
│   ├── templates/       # Portfolio theme templates
│   ├── tests/           # Backend tests (pytest)
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # DB engine/session
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Auth/JWT utilities
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── context/     # Auth/theme context
│   │   ├── pages/       # Landing, Auth, Upload, Review, Preview, Profile, Feedback
│   │   ├── api.js       # API client
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+ and npm
- **Google Gemini API key** — [Google AI Studio](https://aistudio.google.com/)

## Getting Started

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```powershell
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source venv/bin/activate
```

Install dependencies and configure environment:

```bash
pip install -r requirements.txt
cp .env.example .env
```

Update `backend/.env` with your values, then start the server:

```bash
uvicorn main:app --reload --port 8000
```

- API: `http://localhost:8000`
- Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env   # optional if using default API URL
npm run dev
```

- App: `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key (required for AI features) | — |
| `SECRET_KEY` | Secret for JWT signing | — |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./portfolio.db` |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example |
| --- | --- | --- |
| `VITE_API` | Backend API base URL | `http://localhost:8000` |

## API Overview

Base URL: `http://localhost:8000`

| Area | Prefix | Purpose |
| --- | --- | --- |
| Auth | `/auth` | Signup, login, authentication |
| Resume | `/resume` | Resume upload and parsing |
| Portfolio | `/portfolio` | Portfolio generation and retrieval |
| Feedback | `/feedback` | User feedback |
| User | `/user` | User/profile operations |

For the full, up-to-date contract, see the interactive docs at `/docs`.

## Available Scripts

### Frontend (`frontend/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend (`backend/`)

| Command | Description |
| --- | --- |
| `uvicorn main:app --reload --port 8000` | Run development server |
| `pytest tests` | Run backend tests |

## Development Notes

- The backend auto-creates database tables on startup (`models.Base.metadata.create_all`).
- Default database is a local SQLite file (`backend/portfolio.db`) unless `DATABASE_URL` is overridden.
- CORS is controlled via `FRONTEND_ORIGIN`; update it when deploying the frontend to a different host.

