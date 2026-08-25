# SentinelOps: Autonomous Incident Response Agent

**SentinelOps** is an autonomous AI incident response agent built on TrueForge that detects, investigates, sandboxes, remediates, and verifies production microservice outages with human-in-the-loop approvals, automated **Qodo** code reviews, and persistent incident memory stored in **Supabase**.

---

## Target Service: `checkout-service`

`checkout-service` is a realistic e-commerce microservice featuring:
- **Backend:** Python + FastAPI (with live PostgreSQL/Supabase connector)
- **Database:** Supabase PostgreSQL (`orders`, `order_items`, `users`, `incidents`)
- **Frontend & Command Center:** Next.js 14 App Router + Tailwind CSS
- **Seeded Incident:** Unhandled `TypeError: 'NoneType' object is not subscriptable` in `payment_processor.py:32` specifically during guest checkout.

---

## 1. System Architecture

```
SentinelOps (TrueForge Agent)
 ├── Skills: incident-runbook (Parallel Subagents) & rollback-playbook
 ├── Sandbox: Daytona Isolated Linux Environment
 ├── MCP Connectors: GitHub MCP + Supabase / PostgreSQL MCP
 └── Human Approval Gate: Interactive Approval before PR / DB write
          │
          ▼
Target Microservice (checkout-service)
 ├── Backend (FastAPI on :8000)
 ├── Frontend (Next.js on :3000)
 ├── Command Center UI (/incidents)
 └── Supabase DB (Persistent Incident Memory)
```

---

## 2. Quickstart & Local Setup

### Database Setup (Supabase)
Run the SQL definitions in [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8000 --reload
```

### Frontend & Command Center (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
- **Checkout App:** [http://localhost:3000](http://localhost:3000)
- **Incident Command Center:** [http://localhost:3000/incidents](http://localhost:3000/incidents)

---

## 3. Qodo Code Review Evidence

> **Hackathon Requirement Compliance:** Every substantive change goes through a GitHub Pull Request reviewed by Qodo before it is merged.

### PR Review Audit Trail

| PR Reference | Status | Qodo Findings | Action Taken |
| :--- | :--- | :--- | :--- |
| **PR #1 (Fix Guest Checkout Symbol)** | Closed / Replaced | 0 High Findings, 1 Medium (type fallback) | Improved fallback logic in candidate patch |
| **PR #2 (Autonomous Forward-Fix)** | Reviewed & Approved | 0 High Findings, Clean Patch | Verified in Daytona Sandbox & Approved by Human Commander |

### Summary of Qodo Feedback & Resolution:
1. **Initial Review:** Qodo verified the patch diff in `payment_processor.py` removing the unconditional subscript of `currency_info["symbol"]`.
2. **Automated Analysis:** Qodo confirmed that fallback to `DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("symbol", "$")` completely resolved the `NoneType` exception without introducing regressions to registered users.
3. **Follow-up Review:** Clean bill of health with zero High-severity vulnerabilities.

---

## 4. Persistent Memory & Cross-Session Recall (Supabase)

SentinelOps stores structured incident records in the Supabase **`incidents`** table upon resolution:
- **Incident ID:** `INC-20260825-checkout`
- **Root Cause:** `payment_processor.py:32` accessed `currency_info['symbol']` without a None check.
- **Evidence:** Correlated git diff (`beda01a`), backend logs (`TypeError`), and database orders telemetry (`is_guest=true` 500 error spike).
- **Verification:** Sandboxed execution in Daytona reproducing the bug on the regression commit and passing on the patch commit.

When queried in a brand new TrueForge session (*"What happened with the guest checkout incident?"*), SentinelOps queries `incidents` via the database connector and explains the incident history without hallucinating.

---

## 5. AI Disclosure Note

Per Rule 12 of the Hackathon guidelines:
- **AI Models & Tools Used:** Claude 3.5 Sonnet, GPT-4o / GPT-5, and Google Antigravity were used for scaffolding, pair programming, and runbook prompt engineering.
- All code, database schemas, and autonomous agent workflows were verified in live environments.
