# 3D Viewer & Configurator — Implementation Plan (v2 Phased Approach)

## 🛡️ Risk Mitigation Strategy
To successfully execute this phased rollout, we must pre-emptively address the two largest architectural risks identified in the design phase:

1. **Mitigating "Multi-Tenancy Retrofit" Risk**: 
   - Even though Phase 1 operates as a single-tenant MVP, the database schema will be strictly designed using a **"Tenant Zero" strategy**. Every core table (`models`, `configurations`, `assets`) will be created with a `tenant_id` column on Day 1, populated with a hardcoded `tenant-0000` ID. 
   - The application data layer will expect `tenant_id` as a required parameter from the start. 
   - *Result*: When Phase 2 begins, turning on RLS requires exactly zero database structural migrations. It is purely an authentication-layer switch, eliminating massive refactoring debt.
2. **Mitigating "Quota Layer Volatility" Risk**:
   - Quotas are enforced in Redis at the Orchestrator middleware layer to ensure lightning-fast `O(1)` checks before queuing heavy CAD jobs. However, Redis is volatile in memory.
   - *Result*: We will implement an **Eventual Consistency Sync**. Redis handles the sub-millisecond decrements for speed, but a background task securely flushes those usage stats to the persistent PostgreSQL `tenant_billing` table every 5 minutes. If Redis crashes, we lose at most 5 minutes of quota telemetry, perfectly protecting billing integrity without slowing down the config layer.

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
- **Single-Tenant Auth**: Local access, no multi-tenancy RLS yet
- **Configurator Orchestrator (Python/FastAPI)**: Tenant-scoped deterministic hashing, Redis cache check, RabbitMQ/Celery job dispatch, WebSocket notification gateway
- **Python CAD Worker**: FreeCAD/CadQuery parametric generation from JSON schema, `.glb` output, storage upload
- **Storage Abstraction**: `StorageProvider` interface wired to LOCAL mode (`STORAGE_PROVIDER=local`) with sample `.glb` models committed to repo
- **Data-Driven UI**: JSON schema drives sliders/swatches dynamically
- **Async UX**: Non-blocking loading state during CAD generation; WebSocket fires `ModelUpdated`; toast notification with state resumption
- **Local Dev**: `docker compose up` — fully migrated, seeded PostgreSQL + Redis + RabbitMQ + local model storage, zero manual steps
- **Observability**: Structured JSON logging + OpenTelemetry trace ID propagated through Orchestrator → Queue → Worker
- **Testing**: Unit, integration, and one E2E critical-path test covering the full async pipeline

---

## Phase 2 — Multi-Tenancy & SaaS Foundation
**Goal**: Productize the MVP into a real SaaS. Multiple tenants can self-onboard, upload models, and configure isolated environments.

### Additions
- **Multi-Tenancy**: PostgreSQL Row Level Security (RLS) policies enforced at the DB engine level. Every query automatically scoped to `tenant_id`. Connection pooling configured to preserve RLS context (PgBouncer in session mode).
- **Tenant Lifecycle**: Self-onboarding, tier selection (Free / Paid / BYO-Infrastructure)
- **Quota Enforcement**: Enforced at Orchestrator using Redis, synced to Postgres via cron hook.
- **Schema CMS**: Tenants can upload base CAD files (`.glb`, `.step`), tag with category/industry, and define configuration schemas using Industry Templates.
- **Visual Schema Builder**: Drag-and-drop UI for tenants to define configuration variables.
- **S3 + CloudFront**: Switch `STORAGE_PROVIDER=s3`. Zero application code changes.
- **Plugin Mode**: Auth Option B (Signed URLs - Recommended) and Option A (API Key + CORS).
- **Consultation Workflow**: Out-of-bounds request UI.

---

## Phase 3 — Enterprise & Scale
**Goal**: Support enterprise customers with proprietary CAD workflows, high-volume archival, and advanced infrastructure.

### Additions
- **Java/Creo CAD Worker**: Isolated Java Spring Boot microservice interfacing with PTC Creo via J-Link. 
- **Orchestrator Routing for Multi-Engine**: Orchestrator dynamically routes to Java queue vs Python queue based on model metadata (`engine: creo | freecad`).
- **Glacier Archival & Auto-Deletion**: Scheduled cron moves inactive Free-tier models to S3 Glacier after inactivity threshold. 

---

## Architecture Stack (Consistent Across All Phases)

| Layer | Technology |
|---|---|
| Frontend SaaS Portal | Next.js (App Router) |
| 3D Viewer Component | React Three Fiber, `@react-three/drei` |
| Global State | Zustand |
| Backend Orchestrator | Python FastAPI |
| Task Queue | Celery + RabbitMQ |
| Cache & Quotas | Redis |
| Open-Source CAD Engine | FreeCAD / CadQuery (Python) |
| Proprietary CAD Engine | PTC Creo via J-Link (Java/Spring Boot) — Phase 3 |
| Database | PostgreSQL (hosted), SQLite or Docker PG (local dev) |
| Migrations | Alembic (Python-friendly) |
| Storage | LOCAL → AWS S3 + CloudFront (abstracted via `StorageProvider`) |
| Observability | OpenTelemetry + AWS CloudWatch |
| Auth (SaaS) | NextAuth.js (JWT) |
| E2E Testing | Playwright |
