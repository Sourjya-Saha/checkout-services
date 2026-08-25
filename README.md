# Checkout Service (`checkout-service`)

A lightweight e-commerce checkout microservice with a Next.js frontend, Python FastAPI backend, and Supabase (PostgreSQL) database. Designed as a realistic incident target for autonomous AI incident-response agents like **SentinelOps**.

---

## Architecture Overview

```
checkout-service/
├── backend/          # FastAPI Python application
│   ├── app/          # App modules (routes, payment processor, database models)
│   ├── tests/        # Pytest test suite reproducing the incident
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # Next.js 14 App Router (TypeScript + Tailwind CSS)
│   ├── app/          # Checkout page with live error visualization
│   └── .env.local.example
├── supabase/
│   └── schema.sql    # PostgreSQL schema for Supabase
└── README.md
```

---

## Setup & Running

### 1. Database Setup (Supabase)
1. Open your Supabase Project SQL Editor.
2. Paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Copy environment variables and set credentials if available:
cp .env.example .env

# Run backend service
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the checkout app.

---

## Running Automated Verification Tests

```bash
cd backend
pytest -v -s
```

---

## Incident & Regression Details

- **Target Behavior**: Logged-in checkouts process successfully (200 OK).
- **Incident State**: Guest checkouts fail with `500 Internal Server Error` due to an unhandled `TypeError` in currency formatting metadata lookup (`payment_processor.py`).
