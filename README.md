# Northgate eKYC Analyst Assist

Regulatory-grade corporate eKYC and Beneficial Ownership (UBO) verification prototype for institutional compliance analysts and Money Laundering Reporting Officers (MLRO).

---

## Repository Layout

```
analystassist/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application, CORS, and REST endpoints
│   │   ├── models.py        # SQLAlchemy 2.0 tables (Case, Field, SourceLine, UboHolding, AuditEvent, SubmissionStaging)
│   │   ├── schemas.py       # Pydantic v2 DTOs and validation schemas
│   │   ├── orchestrator.py  # Deterministic routing rules, verbatim citation verification, guardrail checks
│   │   ├── ingest.py        # Document text to numbered pages and lines with citation resolver
│   │   ├── llm.py           # Google Gemini adapter behind Protocol interface, with MockLLMAdapter fallback
│   │   ├── ubo.py           # Deterministic multi-layer UBO arithmetic using Decimal
│   │   ├── guardrail.py     # Hard deterministic checks blocking autonomous risk ratings and clearance terms
│   │   ├── audit.py         # Append-only audit writer with ORM-level update/delete rejection
│   │   └── seed.py          # Four synthetic KYC benchmark cases
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_all.py      # Core requirements test suite (verbatim, UBO math, guardrail, sign-off, audit, fallback)
│   │   └── test_dod.py      # Definition of Done verification for all 4 benchmark cases
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── screens/         # Screens mirroring Stitch designs
│   │   │   ├── CaseQueueScreen.tsx            # Case queue home with filters, SLA tracking, state tabs
│   │   │   ├── CaseReviewWorkspaceScreen.tsx  # Split view: source viewer, field table, guardrails, MLRO sign
│   │   │   ├── OwnershipStructureScreen.tsx   # Visual UBO holding-chain diagrams & math breakdowns
│   │   │   ├── ExceptionReviewScreen.tsx      # Side-by-side comparison of conflicting citations & nominee traps
│   │   │   ├── AuditTrailScreen.tsx           # Read-only append-only immutable event log
│   │   │   └── PilotAnalyticsScreen.tsx       # Pilot value metrics vs 180-minute manual baseline
│   │   ├── logic/
│   │   │   ├── signLogic.ts                   # Pure status logic governing sign-off enablement
│   │   │   └── signLogic.test.ts              # Vitest test suite for sign-off status logic
│   │   ├── api.ts           # Central API client module reading VITE_API_URL
│   │   ├── types.ts         # TypeScript data models
│   │   ├── App.tsx          # Shell layout, persistent navigation, and active case state
│   │   ├── main.tsx         # React root mounting
│   │   ├── index.css        # Pure CSS design system matching Stitch specifications
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── pytest.ini               # Pytest configuration with pythonpath set
├── .env.example             # Environment variable templates
├── .gitignore               # Ignores .env, virtualenvs, databases, node_modules
└── README.md
```

---

## Setup & Run Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload
```

*Note: The backend operates with `GEMINI_API_KEY` unset by automatically utilizing the deterministic `MockLLMAdapter`. To enable live Gemini scanning, set `GEMINI_API_KEY` in your environment or in a `.env` file.*

### 2. Frontend Setup & Run

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

### 3. Running Tests

#### Backend Tests (pytest)
```bash
# Run pytest from project root or backend directory:
pytest backend/tests
# Or with virtual environment python:
.\backend\.venv\Scripts\pytest backend\tests
```

#### Frontend Tests (Vitest)
```bash
# Run vitest in frontend directory:
cd frontend
npm test
```

---

## Containerization & Google Cloud Run Deployment

The application features an enterprise-grade multi-stage container architecture and automated CI/CD pipeline deploying to Google Cloud Run.

### 1. Multi-Stage Dockerfile (`/Dockerfile`)
- **Stage 1 (Frontend Builder)**: `node:22-alpine` runs `npm ci` and `npm run build` to compile the React TypeScript frontend into production assets.
- **Stage 2 (FastAPI Runtime)**: `python:3.12-slim` pulls `uv` binary from `ghcr.io/astral-sh/uv:latest`, installs backend dependencies directly into system Python via `uv pip install --system --no-cache -r pyproject.toml`, copies `./app` and compiled frontend `./frontend_dist`, exposes port `8080`, and executes dynamic entrypoint `CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]`.

### 2. Single Page Application (SPA) Serving
FastAPI serves the client-side Single Page Application directly in unified production mode:
- Mounts `/assets` to `FRONTEND_DIST_DIR / "assets"`.
- Provides `/api/health` health smoke test endpoint.
- Fallback route `@app.get("/{full_path:path}", include_in_schema=False)` serves files from `FRONTEND_DIST_DIR` or falls back to `index.html`, returning HTTP 404 for unmatched `/api/*` endpoints.

### 3. Automated GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
- **Test Job**: Runs on `ubuntu-latest`, provisions Python 3.12 via `astral-sh/setup-uv@v5`, executes `uv sync --extra dev` and `uv run pytest -v`, sets up Node.js 20, and runs `npm run build`.
- **Deploy Job**: Triggers on `main` push, authenticates via `google-github-actions/auth@v2` with secret `GCP_SA_KEY`, configures Google Cloud Artifact Registry, builds AMD64 container image (`--platform linux/amd64`), pushes image, deploys to Cloud Run with `--allow-unauthenticated` and dynamic port handling, and executes smoke tests on `/api/health` and `/`.

### 4. Setting up GCP Prerequisites
Helper scripts are included in `scripts/`:
- **Bash / Linux / macOS / Cloud Shell**:
  ```bash
  export PROJECT_ID="<your-gcp-project-id>"
  chmod +x scripts/setup-gcp.sh
  ./scripts/setup-gcp.sh
  ```
- **PowerShell**:
  ```powershell
  .\scripts\setup-gcp.ps1 -ProjectId "<your-gcp-project-id>"
  ```
The script enables required APIs (`run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`, `iam.googleapis.com`), creates the Artifact Registry repo `northgate-chase-repo`, creates service account `github-actions-deployer` with roles `roles/run.admin`, `roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser`, and generates `sa-key.json` to be stored as the GitHub secret `GCP_SA_KEY`.

---

## Four Seeded KYC Benchmark Cases

The system initializes with four synthetic benchmark cases on startup:

1. **Case 1: Apex Logistics Ltd (`CASE-2024-8841`)**
   - **Verification**: Three statutory fields (Legal Entity Name, Beneficial Owner & Holding, Director / Controller Identity) all scored at **96% or higher** (98%, 97%, 96%).
   - **Status**: Ready for review; 75.0% direct ordinary voting shares held by John Sterling.
2. **Case 2: Meridian Green LLP (`CASE-2024-8839`)**
   - **Verification**: Explicitly names **Elena Vance** as the Corporate Controller under Designated Managing Partner Clause 8.2 with sole operational control and casting vote, independent of the 50/50 capital split with Marcus Thorne.
3. **Case 3: Veloce FinTech AG (`CASE-2024-8835`)**
   - **Verification**: Demonstrates multi-tier ownership calculation: Henrik Lindqvist holds 100% of Lindqvist Holding SE, which holds 70.0% of Veloce FinTech AG. Deterministic Decimal arithmetic computes:
     $$\text{Effective Holding} = 100\% \times 70.0\% = 70.0\%$$
   - **Status**: Signed with MLRO risk rating set to Low.
4. **Case 4: Nautilus Offshore BVI (`CASE-2024-8820`)**
   - **Verification**: Flags the nominee director trap at **54% confidence** (Michael Sterling under 2018 nominee agreement) and detects conflicting unverified bearer share certificates (62% confidence).
   - **Status**: Exception flagged, routing directly to the Exception Review screen.

---

## Decisions

1. **Database & ORM**: SQLAlchemy 2.0 with SQLite by default (`sqlite:///./analystassist.db`), configured via the `DATABASE_URL` environment variable. Moving to PostgreSQL requires changing only the connection string URL without altering schema definitions or queries.
2. **Append-Only Audit Guarantee**: The `AuditEvent` table has no update or delete API endpoints. In addition, SQLAlchemy ORM listeners on `before_update` and `before_delete` raise `AppendOnlyAuditViolation`, strictly preventing modifications at the ORM layer.
3. **Zero Autonomous Output & Core Banking Isolation**: The `/cases/{id}/sign` endpoint writes exclusively to the internal `SubmissionStaging` table. It does not invoke any external core banking APIs, enforcing the institutional requirement that AI proposals remain strictly non-authoritative until signed by an MLRO.
4. **Deterministic UBO Arithmetic**: Ownership chains are evaluated using Python's `Decimal` type with exact multiplication along holding links. LLMs are prohibited from performing mathematical calculations.
5. **Deterministic Verbatim Citation Verification**: Before candidate fields reach the analyst, code checks that `quoted_span` appears verbatim at the cited page and line number. Failing candidates are dropped and logged to audit.
6. **Guardrail Enforcement**: Hard deterministic barrier running before the draft reaches the analyst. Hard stops occur if the payload contains a `risk_rating` field, if risk classification language ("Low", "Medium", "High", "Prohibited") appears in a risk context, or if banned clearance terms ("approved", "suspicious", "clearance", "high risk") appear.
7. **Sign-off Readiness Gate**: The `sign_case` endpoint and frontend sign button remain disabled until every field has received an explicit human determination (`accepted`, `edited`, `rejected`) and the MLRO role has selected a risk tier from `['Low', 'Medium', 'High', 'Prohibited']`.
8. **Frontend Implementation**: Built using TypeScript, React 18, and Vite with pure CSS styling matching the design tokens and layout of the Stitch mockups. No external UI widget libraries were introduced.
9. **Pilot Metrics Calculation**: Computed directly from the append-only `AuditEvent` table, measuring average minutes per file against the 180-minute manual review baseline assumption, field correction rate, and citation click-through rate.
10. **Multi-Stage Container Architecture**: A two-stage Dockerfile (`node:22-alpine` for frontend compilation, `python:3.12-slim` for runtime with Astral `uv`) creates a minimal, hardened container containing both the backend API and compiled frontend assets.
11. **Stateless Cloud Run SQLite Storage**: Configured via `CHASEZERO_DB_PATH=/tmp/chasezero.db`, ensuring that SQLite database operations execute against Cloud Run's writable `/tmp` memory-backed filesystem while maintaining PostgreSQL migration compatibility via `DATABASE_URL`.
12. **Dynamic Port Binding & SPA Fallback**: Cloud Run dynamically supplies `$PORT`. The entrypoint command `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}` binds dynamically, while FastAPI handles `/assets`, `/api/health`, and client-side SPA fallback routes to `index.html`.

---

## Known Gaps

1. **Core Banking Live Dispatch**: Sign-off commits to `submission_staging`. Live webhook/REST dispatch to downstream core banking engines is stubbed to preserve the isolated sandbox governance boundary.
2. **SSO / OIDC Provider Integration**: Bank SSO is simulated with active analyst (`Sarah Jenkins, CAMS`) and MLRO role credentials.
3. **Complex Raster OCR Engine**: Prototype ingests text documents and numbered text extracts. Embedded scanned PDF raster OCR is simulated through dual-engine extraction metadata.
