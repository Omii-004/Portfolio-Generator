# PortfoliAI - AI-Powered Portfolio Generator

PortfoliAI is a full-stack application that transforms resumes and portfolios using generative AI. It extracts skills and project highlights from uploaded PDFs and generates customized, developer-friendly portfolio websites across multiple themes.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Three.js / React Three Fiber
- **Backend:** FastAPI, Python, SQLAlchemy (SQLite), JWT Authentication, Passlib (Bcrypt)
- **AI Engine:** Google Gemini API (`google-genai`)

---

## 📂 Project Structure

```
portfolio-generator/
├── backend/
│   ├── routers/            # API endpoints (auth, resume, portfolio, feedback, user)
│   ├── services/           # LLM parser and business logic
│   ├── templates/          # Portfolio theme templates
│   ├── tests/              # Backend tests (pytest)
│   ├── auth.py             # JWT token handling & bcrypt security
│   ├── database.py         # SQLAlchemy engine & session setup
│   ├── main.py             # FastAPI entry point
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic models
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Backend environment variables template
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # Auth & Theme React contexts
│   │   ├── pages/          # Application views & dashboards
│   │   ├── api.js          # Centralized API client
│   │   ├── App.jsx         # App router
│   │   └── main.jsx        # Frontend entry point
│   ├── package.json        # Node dependencies & build scripts
│   └── .env.example        # Frontend environment variables template
├── .gitignore              # Unified root git ignore rules
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python:** 3.10 or higher
- **Node.js:** 18 or higher (with npm)
- **Gemini API Key:** Obtain one from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Setup

1. Open your terminal in the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `SECRET_KEY`: A secure random string for JWT hashing.

5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will run at `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

---

### 2. Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up your `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173`.

---

## 🧪 Running Tests

To run the backend test suite:
```bash
cd backend
pytest tests
```
