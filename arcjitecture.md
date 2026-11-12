The prototype should be a thin three-tier application: a review frontend, an API with a deterministic orchestrator, and a PostgreSQL store with an append-only audit log. The LLM sits behind the bank's approved gateway and only proposes field values, while routing, percentage arithmetic, the guardrail, and sign-off stay in deterministic code.

Architecture overview

 Analyst browser (React + TypeScript)
   Queue | Review workspace | Ownership view | Exceptions | Audit | Pilot metrics
                 │  HTTPS / OIDC (bank SSO)
 ┌───────────────▼──────────────────────────────────────────────┐
 │ API service (FastAPI)                                        │
 │   Case API · Decision API · Sign API · Audit API · Metrics   │
 │                                                              │
 │  Orchestrator (deterministic routing rules)                  │
 │    1. Ingestion ──► 2. Citation scanner (LLM via gateway)   │
 │    3. UBO math (Decimal arithmetic, no LLM)                  │
 │    4. Exception router (confidence < 70% or conflict)        │
 │    5. Guardrail (schema + term check, hard stop)             │
 └──────┬───────────────────┬──────────────────┬───────────────┘
        │                   │                  │
 PostgreSQL            Bank document store  Approved LLM gateway
 cases, fields,        (source PDFs,        (PII masked, every
 decisions, audit      OCR output)          call logged)
        │
 Submission staging table (stub for core banking; no live write)

Components

The frontend is a single-page app that reads the case state from the API. The file's scripted testCases object already matches the shape the API should return: each field carries a name, value, citation, confidence, and status. Stitch output can be converted to React components.

The ingestion step converts each PDF into numbered pages and lines and stores that index. Every citation is an address into this index, so "Page 14, Line 9" always resolves. For the prototype, the existing bank OCR should be reused rather than rebuilt, consistent with the "Reuse" principle in the file.

The citation scanner asks the LLM to return candidate fields as structured JSON, each with a quoted span and a page and line reference. Code then checks that every quoted span appears verbatim at the cited address. A field that fails this check is rejected before it reaches the analyst, so the citation guarantee does not depend on the model behaving well.

UBO math is plain code. It multiplies percentages across each layer using Decimal and reports the effective holding, so the 100% × 70% = 70% result is exact and reproducible.

The guardrail runs on every draft before the analyst sees it. It checks the output schema for any risk field, and it scans text for risk and clearance language such as "approved", "high risk", or "suspicious". A failure stops the pipeline. The file treats this as a hard check, not a prompt instruction, and the design should keep it that way.

Every gateway call is logged with the request ID, model version, prompt hash, and timestamp. The audit table is append-only, and the API has no update or delete path for it.

The sign-off action writes only to a staging table. The prototype does not connect to core banking, which preserves the "Zero autonomous output" guarantee on the Governance tab.

Prototype scope and build choices

For a first demo, the frontend can run against a mock API that replays the four synthetic cases, and the real LLM adapter can be added later behind the same interface. The four synthetic cases should also be the seed data for the test harness that covers T1 to T6 in the file, since none of those tests has run yet.

Access uses bank SSO with three roles: analyst, MLRO (who sets the risk rating), and auditor (read-only). The pilot metrics are computed from audit events, not from separate counters, so the numbers match the record.

Deployment should stay inside the bank's approved environment, with no external data calls and PII masked before any prompt leaves the service.

Recommendations, in priority order

1. Build the deterministic layer first: UBO arithmetic, the guardrail, and the verbatim citation check. These carry the compliance argument, and they can be tested without a live model.
2. Make the audit log append-only from the first commit. Retrofitting it later would weaken the audit evidence the pilot depends on.
3. Build the T1 to T6 test harness before the live model is wired in, so the first live run produces measured results rather than demo output.
4. Keep the LLM behind an adapter interface, so the gateway can be swapped or re-validated without touching the orchestrator.
5. Add SSO and role checks before any pilot user accesses the system, even though the prototype can run on mock data without them.
