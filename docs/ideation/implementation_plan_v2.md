# 3D Viewer & Configurator — Implementation Plan v2
## MVP-First, Incrementally Expandable Architecture

---

## Design Philosophy

Build the minimum slice that proves the core value proposition — **a user can view a 3D model and configure it via parametric inputs while the backend generates the result asynchronously** — before expanding to multi-tenancy, billing, enterprise CAD engines, or admin tooling.

Every architectural decision is made to allow progressive expansion without rewrites:
- The orchestrator is designed from Day 1 to support multiple CAD engines (Python now, Java/Creo later).
- The storage abstraction supports LOCAL today and S3 in production.
- Auth is layered — single-tenant JWT first, multi-tenant RLS second.

---

## Phase 1 — MVP (Single Tenant, Core Pipeline)

**Goal**: A fully working viewer + configurator pipeline with one industry domain (Granite), one CAD engine (Python/FreeCAD), and local infrastructure. Demonstrates the full async loop end-to-end.

### Scope Included
- Monorepo setup (Turborepo): `saas-portal` (Next.js), `@viewer-core` (React), `backend-orchestrator` (Python FastAPI)
- **`@viewer-core` Component**: GLB/GLTF loading, orbit/pan/zoom, HDRI lighting, strict camera limits, Draco/meshopt compression support, LOD-aware loading
- **Model Optimization Pipeline**: Mesh simplification + Draco compression at upload time to keep viewer fast
- **Single-Tenant JWT Auth**: NextAuth.js, no multi-tenancy, no RLS yet
- **Configurator Orchestrator (Python/FastAPI)**: Tenant-scoped deterministic hashing, Redis cache check, RabbitMQ/Celery job dispatch, WebSocket notification gateway
- **Python CAD Worker**: FreeCAD/CadQuery parametric generation from JSON schema, `.glb` output, storage upload
- **Storage Abstraction**: `StorageProvider` interface wired to LOCAL mode (`STORAGE_PROVIDER=local`) with sample `.glb` models committed to repo
- **One Industry Schema**: Granite Monument template (dimensions, material finish, text engraving options)
- **Data-Driven UI**: JSON schema drives sliders/swatches dynamically — no hardcoded UI per industry
- **Async UX**: Non-blocking loading state during CAD generation; WebSocket fires `ModelUpdated`; toast notification with state resumption
- **Local Dev**: `docker compose up` — fully migrated, seeded PostgreSQL + Redis + RabbitMQ + local model storage, zero manual steps
- **Observability**: Structured JSON logging + OpenTelemetry trace ID propagated through Orchestrator → Queue → Worker
- **Testing**: Unit, integration, and one E2E critical-path test covering the full async pipeline

### Scope Explicitly Deferred
- Multi-tenancy (RLS, tenant isolation)
- Billing tiers and quota enforcement
- Super-Admin dashboard
- Plugin Mode (API Key auth, signed URLs)
- Visual Schema Builder UI
- S3 / CloudFront production storage
- Consultation/custom engineering request workflow
- Java/Creo CAD worker
- Glacier archival and auto-deletion cron

---

## Phase 2 — Multi-Tenancy & SaaS Foundation

**Goal**: Productize the MVP into a real SaaS. Multiple tenants can self-onboard, upload models, and configure isolated environments.

### Additions
- **Multi-Tenancy**: PostgreSQL Row Level Security (RLS) policies enforced at the DB engine level. Every query automatically scoped to `tenant_id`. Connection pooling configured to preserve RLS context (PgBouncer in session mode, not transaction mode).
- **Tenant Lifecycle**: Self-onboarding, tier selection (Free / Paid / BYO-Infrastructure)
- **Quota Enforcement**: Enforced at the **Orchestrator middleware layer** (not DB constraints, not application logic) so limits cannot be bypassed by direct DB access. Quota state stored in Redis for fast read.
- **Schema CMS**: Tenants can upload base CAD files (`.glb`, `.step`), tag with category/industry, and define configuration schemas. Industry Templates (Granite, Industrial Gear) available for fast setup.
- **Visual Schema Builder**: Drag-and-drop UI for tenants to define configuration variables (Enum, Number Range with min/max), producing a validated JSON schema document.
- **Super-Admin Dashboard**: View all tenants, adjust tier limits, suspend accounts.
- **S3 + CloudFront**: Switch `STORAGE_PROVIDER=s3`. Storage abstraction means zero application code changes.
- **Plugin Mode — Auth Option B (Signed URLs)**: Client's secure backend exchanges a secret key for a temporary 1-hour session token or signed CDN URL. This is the **recommended** plugin auth path.
- **Plugin Mode — Auth Option A (API Key + CORS)**: Supported for rapid integrations only. Clearly documented limitation: CORS is browser-enforced only and does not protect server-to-server requests. Not recommended for sensitive/proprietary models.
- **Second Industry Schema**: Industrial Equipment/Tooling template.
- **Consultation Workflow**: Out-of-bounds request UI, 3D model annotation, webhook/dashboard alert to tenant team.

---

## Phase 3 — Enterprise & Scale

**Goal**: Support enterprise customers with proprietary CAD workflows, high-volume archival, and advanced infrastructure options.

### Additions
- **Java/Creo CAD Worker**: Isolated Java Spring Boot microservice interfacing with PTC Creo via J-Link (using existing Creo license). The Orchestrator already routes jobs by engine type from Phase 1 — this is purely additive. Language fragmentation risk is contained to this single worker microservice.
- **Orchestrator Routing for Multi-Engine**: When a model's metadata specifies `engine: creo`, the Orchestrator dispatches to the Java queue. When `engine: freecad`, it dispatches to the Python queue. No Orchestrator rewrite required.
- **Glacier Archival & Auto-Deletion**: Scheduled cron moves inactive Free-tier models to S3 Glacier after inactivity threshold. Auto-deletes expired Free configurations.
- **BYO-Infrastructure Tier**: Clients can run their own Orchestrator and CAD workers against our schema contracts.
- **Advanced Observability**: Prometheus/Grafana self-hosted stack (OTel standard means zero app code changes to switch from Datadog/CloudWatch).

---

## Architecture Stack (Consistent Across All Phases)

| Layer | Technology |
|---|---|
| Frontend SaaS Portal | Next.js (App Router) |
| 3D Viewer Component | React Three Fiber, `@react-three/drei` |
| Global State | Zustand |
| Model Compression | Draco, meshopt (via `gltf-pipeline` or `gltf-transform`) |
| Backend Orchestrator | Python FastAPI |
| Task Queue | Celery + RabbitMQ |
| Cache | Redis |
| Open-Source CAD Engine | FreeCAD / CadQuery (Python) |
| Proprietary CAD Engine | PTC Creo via J-Link (Java/Spring Boot) — Phase 3 |
| Database | PostgreSQL (hosted), SQLite or Docker PG (local dev) |
| Migrations | Alembic (Python-friendly) |
| Storage | LOCAL → AWS S3 + CloudFront (abstracted via `StorageProvider`) |
| Real-Time | WebSockets (FastAPI native) |
| Observability | OpenTelemetry + AWS CloudWatch (Phase 1), Prometheus/Grafana (Phase 3 option) |
| Auth (SaaS) | NextAuth.js (JWT) |
| Auth (Plugin) | Signed URLs (Option B, recommended), API Key + CORS (Option A, limited) |
| E2E Testing | Playwright |
| Unit/Integration Testing | pytest, Jest, React Testing Library |

---

## Security Notes (Corrections from v1)

1. **RLS Caveat**: PostgreSQL RLS is strong but requires connection pooling to be configured in **session mode** (e.g., PgBouncer `pool_mode=session`). Transaction mode strips the session context and can bypass RLS. This must be enforced at the infrastructure level.
2. **Plugin Auth Option A**: CORS validation is browser-enforced only. Server-to-server requests ignore the `Origin` header entirely. Option A is acceptable for low-sensitivity demos but must not be marketed as a security boundary for proprietary model data.
3. **Quota Enforcement Layer**: Enforced at Orchestrator middleware, not the database. Redis holds current usage counters per tenant for sub-millisecond quota checks before any job is queued.

---

## Developer Quickstart (Phase 1 Target State)

```bash
git clone <repo>
docker compose up        # PostgreSQL + Redis + RabbitMQ + local model server
# Migrations auto-apply. Seed data loaded: demo tenant, Granite template, sample .glb models.
# Frontend: http://localhost:3000
# Orchestrator API: http://localhost:8000
```
