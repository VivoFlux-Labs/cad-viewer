# Project Context — 3D Viewer & Configurator SaaS

> Share this file with an LLM at the start of any conversation about this project to establish full context without re-explaining from scratch.

---

## What This Is

A multi-tenant SaaS platform and embeddable component for **interactive 3D model viewing and parametric configuration**. Target industries: granite monuments, industrial equipment, automotive, and any domain where CAD modeling is used.

Two deployment modes:
1. **SaaS Portal** — hosted platform where tenants onboard, upload models, define configuration schemas, and their end-users view/configure models.
2. **Plugin/Embeddable** — `<ConfiguratorViewer />` React component that clients embed in their own platforms, connecting to the backend via signed URLs or API keys.

---

## Core User Flow

`Browse Models → View in 3D → Adjust Configuration Parameters → Backend Generates New CAD Model Async → UI Notifies User → Model Hot-Swaps in Canvas`

Heavy CAD generation is non-blocking. Users can navigate away during generation and are notified via WebSocket toast when the result is ready, restoring them to the exact state they left.

---

## Tech Stack

| Layer | Technology |
|---|---|
| SaaS Frontend | Next.js (App Router) |
| 3D Viewer Component | React Three Fiber + `@react-three/drei` |
| Global State | Zustand (with persist middleware for state resumption) |
| Model Compression | Draco + meshopt (via `gltf-transform`) |
| Backend Orchestrator | Python FastAPI |
| Task Queue | Celery + RabbitMQ |
| Cache | Redis |
| Open-Source CAD (MVP) | FreeCAD / CadQuery (Python) |
| Proprietary CAD (Phase 3) | PTC Creo via J-Link (Java/Spring Boot) |
| Database | PostgreSQL (hosted), Docker PG (local dev) |
| DB Migrations | Alembic |
| Storage | `StorageProvider` abstraction: LOCAL (dev) → AWS S3 + CloudFront (prod) |
| Real-Time | WebSockets (FastAPI native) |
| Auth — SaaS | NextAuth.js (JWT, `tenant_id` in claims) |
| Auth — Plugin | Signed URLs / temporary tokens (recommended); API Key + CORS (limited, browser-only) |
| Observability | OpenTelemetry (trace ID through all services) → AWS CloudWatch (MVP) |
| E2E Testing | Playwright |
| Unit/Integration | pytest (backend), Jest + React Testing Library (frontend) |

---

## Repository Structure (Target)

```
/
├── apps/
│   └── saas-portal/          # Next.js SaaS application
├── packages/
│   └── viewer-core/          # @viewer-core — decoupled React Three Fiber component
├── services/
│   └── backend-orchestrator/ # Python FastAPI — API gateway, cache, queue dispatch, WebSockets
│   └── cad-worker-python/    # Celery worker — FreeCAD/CadQuery CAD generation
│   └── cad-worker-java/      # Spring Boot worker — PTC Creo (Phase 3 only)
├── db/
│   ├── migrations/           # Alembic versioned SQL
│   └── seeds/                # Demo tenant, Granite template, sample model record
├── storage/
│   └── models/samples/       # Committed sample .glb files for local dev
├── docs/
│   └── ideation/             # Planning documents (see below)
├── docker-compose.yml         # One command: full local stack
└── CONTEXT.md                 # This file
```

---

## Architecture — Key Design Decisions

### Multi-Engine Orchestrator
The Orchestrator routes CAD jobs by `engine` field in model metadata (`freecad` → Python worker queue, `creo` → Java worker queue). The Java/Creo queue is declared from Phase 1 but has no consumer until Phase 3. This means adding Creo support later requires zero Orchestrator changes.

### Async CAD Pipeline
```
UI POST /configure
  → Orchestrator validates schema
  → Checks Redis cache (hash = SHA-256(tenant_id + sorted_config))
  → Cache HIT: return model URL instantly (HTTP 200)
  → Cache MISS: dispatch to queue (HTTP 202 + jobId)
      → CAD Worker generates .glb
      → Uploads to StorageProvider
      → Callbacks Orchestrator with jobId + URL
          → Orchestrator stores in Redis cache
          → WebSocket fires ModelUpdated to specific client session
              → UI hot-swaps model, restores state
```

### Caching & Deduplication
- Hash is tenant-scoped: `SHA-256(tenant_id + alphabetically_sorted(config_json))`
- Prevents cross-tenant data bleed (Tenant A and B with identical params generate separate cached models)
- `ENABLE_GLOBAL_CACHING=false` env var disables Redis entirely (for clients without Redis)
- UI exposes `enableCaching` prop and `?useCache=false` API flag for per-request opt-out

### Storage Abstraction
`StorageProvider` interface (`upload`, `getUrl`, `delete`) — switching from LOCAL to S3 is a single env var change (`STORAGE_PROVIDER=local|s3`). Zero application code changes.

### Decoupled 3D Viewer Component
The `@viewer-core` React component is entirely decoupled from the SaaS Configurator logic. It receives a declarative `modelUrl` prop and simply renders the `.glb`. The Configurator UI is treated purely as an extended overlay wrapped around the standalone Viewer. This ensures users can rapidly browse pre-generated models without blocking on the async generation queue.

### Static Asset Delivery, Caching, & Tenant Isolation
The FastAPI Backend **never serves `.glb` binaries**. That is a blocking anti-pattern. 
- **MVP (Phase 1)**: The API `GET /api/models/{id}` returns paths to a local `StaticFiles` volume mount `/storage/models/...` (fast localized IO).
- **SaaS (Phase 2)**: The API generates **Signed URLs** directly pointing to an AWS CloudFront CDN. The CDN provides aggressive edge-caching for O(1) Viewer load times, while the cryptographically signed URLs strictly enforce Tenant Isolation and prevent unauthorized scraping.

### Database & RLS
- All SQL in repo under `db/`, version-controlled via Alembic
- `tenant_id` columns present from Day 1 (MVP is single-tenant but schema is ready)
- PostgreSQL RLS enforced in Phase 2. **Critical**: PgBouncer must run in **session mode** (not transaction mode) — transaction mode strips session context and bypasses RLS.

### Quota Enforcement
Enforced at **Orchestrator middleware layer** (not DB constraints, not application logic). Redis counters hold current usage per tenant for sub-millisecond checks before any job is queued. Enforcing at the wrong layer creates bypassable limits.

### Model Optimization
Raw STEP/GLB files from CAD tools can be very large. Draco + meshopt compression is applied to every uploaded model via `gltf-transform` at upload time. The viewer loads compressed files only. LOD levels are a Phase 3 concern.

### Plugin Auth Caveat
Option A (API Key + CORS): CORS is **browser-enforced only**. Server-to-server requests ignore `Origin` entirely. Option A is acceptable for demos, not for sensitive/proprietary model data. Option B (Signed URLs) is the recommended path.

---

## Development Phases

### Phase 1 — MVP ✅ (In Planning)
Single tenant · Python/FreeCAD · LOCAL storage · Granite Monument schema · Full async pipeline · Docker local dev

**Phase 1 done when**: Playwright E2E test (Task 6.2) passes 3 consecutive CI runs covering the full async critical path.

### Phase 2 — Multi-Tenancy & SaaS
Multi-tenant + RLS · Visual Schema Builder · Billing/Quotas · Plugin mode · S3/CloudFront · Consultation workflow

### Phase 3 — Enterprise
PTC Creo via J-Link (existing license available) · Multi-LOD · Glacier archival · BYO-Infrastructure mode

---

## Planning Documents

| File | Purpose |
|---|---|
| `docs/ideation/ideation.md` | Original product idea and requirements |
| `docs/ideation/implementation_plan_v3.md` | Current authoritative implementation plan (phased) |
| `docs/ideation/tasks_v3.md` | Current authoritative task breakdown (MVP + Phase 2 + Phase 3 epics) |
| `docs/ideation/implementation_plan_v2.md` | Current authoritative implementation plan (phased) - superseded by v3 |
| `docs/ideation/tasks_v2.md` | Current authoritative task breakdown (MVP + Phase 2 + Phase 3 epics) - superseded by v3 |
| `docs/ideation/implementation_plan_draft.md` | Original draft — superseded by v2 |
| `docs/ideation/task.md` | Original task draft — superseded by v2 |

---

## Key Constraints & Notes for LLMs

- **Do not suggest rewriting the Orchestrator for Creo support** — routing is designed in from Phase 1 (Task 3.3).
- **Do not suggest mocking the database for integration tests** — real DB required (lesson from v1 review).
- **PgBouncer session mode is non-negotiable** when RLS is active — any suggestion using transaction mode will silently break tenant isolation.
- **Plugin Auth Option A is intentionally weak** — do not suggest hardening it with server-side checks; that's what Option B is for.
- **Model compression (Draco) happens at upload time, not at render time** — the viewer only receives pre-compressed files.
- The owner has an **existing PTC Creo license** available for Phase 3.
