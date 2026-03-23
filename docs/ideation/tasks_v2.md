# 3D Viewer & Configurator — Task Breakdown v2

Tasks are organized by Phase, then Epic. Each task is independently pickable with explicit dependencies, context, and testing requirements. MVP (Phase 1) tasks are fully detailed. Phase 2 and Phase 3 tasks are scoped at the epic level and will be broken down when Phase 1 is complete.

**Team size assumption**: 2–5 developers.

---

# PHASE 1 — MVP

---

## 🏗️ Epic 1: Foundation & Core Infrastructure

---

### Task 1.1 — Initialize Monorepo (Turborepo) & Core Packages
- **Context**: Scaffold the monorepo with three workspaces: `apps/saas-portal` (Next.js), `packages/viewer-core` (React component library), `services/backend-orchestrator` (Python FastAPI). Configure Turborepo pipelines for `build`, `lint`, `test`. Set up shared TypeScript config and ESLint rules.
- **Dependencies**: None.
- **Deliverable**: `pnpm install && pnpm turbo run build` passes cleanly across all workspaces.
- **Testing**: CI pipeline passes linting, formatting, and type-checks for all workspaces.

---

### Task 1.2 — Version-Controlled SQL, Migrations & Local Database
- **Context**: Create `db/migrations/` (numbered Alembic migration files) and `db/seeds/` directories. Write DDL for initial tables: `tenants`, `users`, `models`, `configurations`. Configure `docker-compose.yml` to spin up PostgreSQL and auto-apply all migrations via Alembic on startup. `DATABASE_URL` env var is the sole switch between local and hosted. No manual DB setup steps allowed.
- **Dependencies**: Task 1.1
- **Seed Data** (`db/seeds/`):
  - Default Super Admin account
  - One tenant (demo)
  - Granite Monument industry schema template (JSON)
  - One sample model record pointing to a local `.glb` file
- **Testing**:
  - Smoke test: `docker compose up` produces a fully migrated, seeded DB with zero manual steps.
  - Unit test: Verify seed data is queryable and schema constraints are enforced.
- **Note**: RLS policies are deferred to Phase 2 (multi-tenancy). Schema must be designed to include `tenant_id` columns from the start to avoid a migration breaking change later.

---

### Task 1.3 — SaaS JWT Authentication (NextAuth.js)
- **Context**: Implement NextAuth.js with JWT strategy for the `saas-portal`. Protect all API routes and Next.js pages behind auth. Store session user with `tenant_id` claim in JWT payload (even in single-tenant MVP, so the claim is present and ready for RLS in Phase 2).
- **Dependencies**: Task 1.2
- **Testing**:
  - Functional test: Valid credentials issue a JWT with correct claims.
  - Functional test: Unauthenticated requests to protected routes return 401.
  - Functional test: JWT expiry is enforced.

---

### Task 1.4 — Storage Provider Abstraction (`LOCAL` vs `S3`)
- **Context**: Implement a `StorageProvider` abstract interface with three methods: `upload(file, path) -> url`, `getUrl(path) -> url`, `delete(path)`. Wire `STORAGE_PROVIDER=local` to serve files from `storage/models/` via FastAPI `StaticFiles`. Wire `STORAGE_PROVIDER=s3` to AWS S3 + CloudFront (implementation ready but not activated in MVP). Commit 2–3 small sample `.glb` models to `storage/models/samples/` so the viewer works immediately after `docker compose up`.
- **Dependencies**: Task 1.1
- **Testing**:
  - Unit tests on both provider implementations using the same test fixture interface.
  - Smoke test: Sample model URL resolves and loads in the browser in `local` mode.
  - Unit test: Switching `STORAGE_PROVIDER` requires zero application code changes.

---

## 🖥️ Epic 2: `@viewer-core` Component (Frontend 3D)

**Context**: A pure, decoupled React component. It is "dumb" — driven entirely by external props. It knows nothing about the SaaS backend. This makes it reusable as a standalone NPM package.

---

### Task 2.1 — Base 3D Canvas, Lighting & Camera Controls
- **Context**: Set up React Three Fiber `<Canvas>`, HDRI environment lighting (use a royalty-free HDRI from Polyhaven as default), and `OrbitControls` with strict limits (min/max polar angle to prevent camera clipping through geometry, min/max zoom distance). Expose camera preset props (`top`, `front`, `isometric`) that animate to the target position.
- **Dependencies**: Task 1.1
- **Testing**:
  - Unit test: Component mounts without errors.
  - Unit test: Camera limit props are applied to OrbitControls.
  - Visual snapshot test: Camera preset transitions render expected angles.

---

### Task 2.2 — GLB/GLTF Asset Loader, Model Optimization & Progressive Loading
- **Context**: Implement `useGLTF` with React `<Suspense>` for progressive loading. Add a loading spinner/skeleton while the model streams. Implement graceful error boundary for WebGL context loss. Add support for **Draco-compressed** and **meshopt-compressed** GLB files (via `@react-three/drei` `<DRACOLoader>` and `<MeshoptDecoder>`). At model upload time (backend), run `gltf-transform` or `gltf-pipeline` to apply Draco compression and generate an optimized `.glb`. This is the **model optimization pipeline** — raw STEP/GLB files can be enormous; compression is required for acceptable viewer performance.
- **Dependencies**: Task 2.1, Task 1.4
- **LOD Strategy**: For Phase 1, serve a single compressed LOD. Phase 2 can introduce multiple LOD levels. Document this decision.
- **Testing**:
  - Unit test: Loading state renders during model fetch.
  - Unit test: Error boundary renders fallback on WebGL context loss.
  - Functional test: A Draco-compressed `.glb` loads and renders correctly.
  - Performance benchmark: A compressed sample model renders without frame drops on target hardware.

---

### Task 2.3 — Dynamic Configuration UI & Zustand State
- **Context**: Implement the Zustand store to hold current configuration state (selected parameters, loading status, last-known model URL). Dynamically render configuration controls from an injected JSON schema prop — no hardcoded UI per industry. Schema types to support in MVP: `enum` (renders swatches/dropdown), `number_range` (renders slider with min/max/step). State must survive component unmount/remount (Zustand persist middleware) so users can navigate away and return to their configuration.
- **Dependencies**: Task 2.2
- **Testing**:
  - Unit tests: Zustand store reducers for parameter update, loading state, model URL swap.
  - Component test: `enum` schema renders correct number of swatches.
  - Component test: `number_range` schema renders slider with correct min/max bounds.
  - Component test: Different JSON schemas render different controls without code edits.
  - Component test: State persists across component unmount/remount.

---

## ⚙️ Epic 3: Backend Configurator Orchestrator

**Context**: The central API gateway. Receives configuration requests, validates against schema, checks Redis cache, and dispatches CAD jobs to the queue. Also manages WebSocket connections for real-time notifications. Designed from Day 1 to route to multiple CAD engines (Python worker now, Java/Creo worker in Phase 3) via a `engine` field in model metadata.

---

### Task 3.1 — Deterministic Hashing & Redis Cache
- **Context**: Implement the tenant-scoped hashing algorithm: `SHA-256(tenant_id + sorted(json.dumps(config_payload)))`. JSON keys must be alphabetically sorted before hashing to ensure identical configs always produce identical hashes regardless of key order. On a cache hit, return the existing CDN/local URL immediately with HTTP `200`. On a miss, proceed to queue dispatch. Store cache entries as `hash -> model_url` in Redis with configurable TTL. Include a backend master toggle: `ENABLE_GLOBAL_CACHING=false` disables Redis entirely (for clients without Redis infrastructure).
- **Dependencies**: Task 1.1
- **Testing**:
  - Unit test: Hash algorithm alphabetizes keys — `{b:1, a:2}` and `{a:2, b:1}` produce identical hashes.
  - Unit test: Different `tenant_id` values produce different hashes for identical payloads (no cross-tenant bleed).
  - Unit test: `ENABLE_GLOBAL_CACHING=false` skips Redis entirely.
  - Integration test: Cache hit returns correct URL with no queue dispatch.

---

### Task 3.2 — Schema Validation Middleware
- **Context**: Before hashing or queuing any job, validate the incoming configuration payload against the model's stored JSON schema. Reject out-of-range `number_range` values and invalid `enum` values with HTTP `422` and a clear error message identifying the offending field. This prevents invalid jobs from ever reaching the CAD worker.
- **Dependencies**: Task 3.1
- **Testing**:
  - Unit test: Valid payload passes validation.
  - Unit test: Out-of-range number returns 422 with field name in response.
  - Unit test: Invalid enum value returns 422.
  - Unit test: Extra unknown fields are rejected (strict mode).

---

### Task 3.3 — Message Queue Setup (RabbitMQ/Celery) & Multi-Engine Routing
- **Context**: On a cache miss (and passing validation), the Orchestrator dispatches a `CAD_GENERATE` job to the appropriate Celery queue based on the model's `engine` field in its metadata (`freecad` → Python worker queue, `creo` → Java worker queue — Java queue is declared but has no active consumer in Phase 1). Return HTTP `202 Accepted` immediately with a `jobId`. The UI uses `jobId` to correlate the eventual WebSocket notification.
- **Dependencies**: Task 3.2
- **Testing**:
  - Integration test: Valid request routes to correct queue based on `engine` field.
  - Integration test: Queue depth increases after dispatch.
  - Unit test: HTTP `202` is returned immediately without waiting for job completion.
  - Unit test: `jobId` in response is a stable, unique identifier traceable to the queued message.

---

### Task 3.4 — WebSocket Notification Gateway
- **Context**: Implement a WebSocket server (FastAPI native WebSockets). Clients authenticate the WebSocket connection using their JWT. The gateway maintains a mapping of `session_id → websocket_connection`. When a CAD worker completes a job, it calls back to the Orchestrator with the `jobId` and resulting model URL. The Orchestrator resolves the session from `jobId`, stores the URL in Redis cache (backwards: `hash → url`), and pushes a `ModelUpdated` payload to the specific client. Other connected clients are never notified.
- **Dependencies**: Task 3.3
- **Testing**:
  - Unit test: Unauthenticated WebSocket connections are rejected.
  - Unit test: `ModelUpdated` payload is only sent to the session that initiated the job.
  - Integration test: Simulate a worker callback → verify the correct WebSocket client receives the event with the correct model URL.
  - Integration test: Early WebSocket checkpoint — validate queue → WebSocket plumbing works with a **mock worker** before the real CAD worker is built. This provides early pipeline feedback without waiting for Epic 4.

---

## 🛠️ Epic 4: Python CAD Worker (FreeCAD/CadQuery)

**Context**: A standalone headless Python service listening to the RabbitMQ queue. Strictly responsible for CAD generation — it does not know about tenants, auth, or the UI. Receives a JSON job, generates a `.glb` model, uploads it to storage, and pings the Orchestrator.

---

### Task 4.1 — Worker Skeleton, Queue Consumer & Storage Upload
- **Context**: Scaffold the Celery worker application. Implement the queue consumer that receives a `CAD_GENERATE` job message (containing `job_id`, `tenant_id`, `model_id`, `config_payload`, `schema`). Implement the storage upload step using the `StorageProvider` abstraction (LOCAL mode). After upload, POST the resulting URL back to the Orchestrator's internal callback endpoint with the `job_id`.
- **Dependencies**: Task 3.3, Task 1.4
- **Testing**:
  - Unit test: Queue consumer correctly deserializes the job message.
  - Unit test: Storage upload utility via `moto` (AWS mock library) for S3 path; local path for LOCAL mode.
  - Integration test: Worker receives a mock job, skips CAD generation (returns a pre-existing sample `.glb`), uploads it, and the Orchestrator's WebSocket fires the `ModelUpdated` event. This validates the full pipeline loop before real CAD generation is wired.

---

### Task 4.2 — Granite Monument Parametric Model (FreeCAD/CadQuery)
- **Context**: Implement the first real CAD generation function using CadQuery (Python). Wire the Granite Monument JSON schema parameters to CadQuery solid modeling commands. Parameters in scope for MVP: `width` (Number Range), `height` (Number Range), `depth` (Number Range), `shape` (Enum: Rectangle, Oval, Heart). After generation, export to `.glb` via Blender Python API or `trimesh`. Apply Draco compression to the output before upload.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**: Given a valid Granite Monument config JSON, the worker outputs a geometrically correct, Draco-compressed `.glb` file.
- **Testing**:
  - Functional test: Supply `{width: 24, height: 36, depth: 6, shape: "Rectangle"}` → assert a valid, parseable `.glb` is produced.
  - Functional test: Out-of-schema values (caught at Orchestrator) never reach this function — document and test this assumption.
  - Regression fixtures: Commit a set of known-good input/output pairs as test fixtures so geometry regressions are caught automatically.
- **Note**: This task will realistically require significant iteration. Scope it as a time-boxed spike first to establish baseline geometry output before writing tests.

---

### Task 4.3 — Worker Error Handling & Dead Letter Queue
- **Context**: CAD generation can fail (bad geometry, timeout, library crash). The worker must handle failures gracefully: catch exceptions, log structured error with `trace_id` and `job_id`, and push failed jobs to a Dead Letter Queue (DLQ) in RabbitMQ for inspection. The Orchestrator must be notified of failure so it can push a `GenerationFailed` WebSocket event to the client (UI shows a friendly error, not a spinner that never resolves).
- **Dependencies**: Task 4.2
- **Testing**:
  - Unit test: An exception in the CAD function routes to DLQ, not silent drop.
  - Integration test: Orchestrator receives failure callback and fires `GenerationFailed` WebSocket event.
  - Unit test: Failed jobs do not pollute the Redis cache.

---

## 🚀 Epic 5: SaaS Portal UI (Next.js)

**Context**: The application shell that wraps `@viewer-core` and connects it to the backend. Includes model discovery, the configurator view, and the async notification UX.

---

### Task 5.1 — Model Discovery Dashboard
- **Context**: Build the Viewer Dashboard page. List available models from the backend API (name, thumbnail, category). Include a search bar (client-side filter in MVP, server-side in Phase 2). Include "Recently Viewed" section (stored in Zustand persist). Clicking a model navigates to the Viewer page.
- **Dependencies**: Task 2.3, Task 1.3
- **Testing**:
  - Component test: Model list renders from a mock API response.
  - Component test: Search filter correctly filters model list.

---

### Task 5.2 — Viewer Page & Configurator Panel
- **Context**: The core product page. Loads `@viewer-core` with the selected model URL. If the user has access, renders the configuration panel (dynamic controls from JSON schema via Task 2.3). On parameter change: hit Orchestrator API, handle cache hit (instant model swap) and cache miss (loading state + WebSocket wait). Show a non-blocking loading indicator during generation — user must be able to navigate away freely.
- **Dependencies**: Task 5.1, Task 3.4
- **Testing**:
  - Integration test: Cache hit → model swaps instantly with no loading state.
  - Integration test: Cache miss → loading state renders → WebSocket `ModelUpdated` → model swaps.
  - Component test: User can navigate back to dashboard while a job is in progress (no forced blocking).

---

### Task 5.3 — Global Toast Notification & State Resumption
- **Context**: When the WebSocket fires `ModelUpdated` and the user is not currently on the Configurator page, display a global toast notification ("Your model is ready"). Clicking the toast routes the user back to the Configurator and hot-swaps the new model into the canvas at exactly the camera position and configuration state they left. If on the Configurator page, swap the model silently. If `GenerationFailed` is received, show an actionable error toast.
- **Dependencies**: Task 5.2, Task 3.4
- **Testing**:
  - Integration test: `ModelUpdated` event while user is on Dashboard → toast appears → clicking toast restores Configurator state.
  - Integration test: `GenerationFailed` event renders error toast, not infinite spinner.

---

## 🧪 Epic 6: System Integration, E2E & Observability

---

### Task 6.1 — OpenTelemetry Instrumentation
- **Context**: Instrument all microservices with OpenTelemetry. Every API request generates a `Trace ID`. The `X-Trace-ID` header propagates from the frontend request → Orchestrator → RabbitMQ job message → CAD Worker → callback. All structured logs include `trace_id` and `job_id` fields. Route to AWS CloudWatch in MVP. Switching to Datadog or self-hosted Prometheus/Grafana later requires zero application code changes (OTel is the abstraction).
- **Dependencies**: Epics 3, 4
- **Testing**:
  - Integration test: A single end-to-end request produces logs with the same `trace_id` across all three services (Orchestrator, Queue, Worker).

---

### Task 6.2 — Full E2E Critical Path Test (Playwright)
- **Context**: Automated Playwright suite spinning up all services via `docker compose`. Executes the exact critical path: log in → navigate to model → change a configuration slider → assert loading state appears → intercept `ModelUpdated` WebSocket event → assert the canvas fetches and renders a new `.glb` URL. This is the Phase 1 completion milestone. All prior tasks must pass before this task is considered shippable.
- **Dependencies**: All Phase 1 Epics (1–5)
- **Flow Under Test**: `Login → Dashboard → Select Granite Monument → Change Height slider (cache miss) → Loading spinner visible → WebSocket fires ModelUpdated → New .glb loaded in canvas`
- **Testing**: This task *is* the test. It must pass reliably in CI on three consecutive runs before Phase 1 is declared complete.

---

# PHASE 2 — Multi-Tenancy & SaaS Foundation

*(Tasks to be broken down in detail when Phase 1 E2E test passes)*

## Epic 7: Multi-Tenancy & RLS
- Task 7.1 — Enable PostgreSQL RLS policies (all queries auto-scoped to `tenant_id`)
- Task 7.2 — Configure PgBouncer in session mode (required for RLS correctness — transaction mode bypasses RLS)
- Task 7.3 — Tenant self-onboarding flow (registration, plan selection)
- Task 7.4 — Tenant isolation audit (verify Tenant A cannot access Tenant B's data under any query path)

## Epic 8: Schema CMS & Visual Schema Builder
- Task 8.1 — Model upload UI (tenant uploads base `.glb`/`.step`, assigns tags and category)
- Task 8.2 — Industry Template Library (apply pre-built schemas: Granite Monument, Industrial Gear)
- Task 8.3 — Visual Schema Builder UI (drag-and-drop variable definition: Enum, Number Range with min/max)
- Task 8.4 — Schema versioning (changes to a schema must not break existing cached configurations)

## Epic 9: Billing, Quotas & Super-Admin
- Task 9.1 — Quota enforcement middleware in Orchestrator (Redis counters, checked before job dispatch)
- Task 9.2 — Billing tier configuration (Free / Paid limits: max uploads, max CAD jobs/month)
- Task 9.3 — Super-Admin dashboard (view tenants, adjust limits, suspend accounts)
- Task 9.4 — Free tier auto-deletion cron (purge old configurations, trigger Glacier archive)

## Epic 10: Plugin Mode & Production Storage
- Task 10.1 — Plugin Auth Option B: Signed URL exchange (secret key → temporary 1-hour token)
- Task 10.2 — Plugin Auth Option A: API Key + CORS validation (with clear docs on browser-only limitation)
- Task 10.3 — Switch storage to AWS S3 + CloudFront (`STORAGE_PROVIDER=s3`, zero code changes)
- Task 10.4 — `<ConfiguratorViewer />` NPM package publish and integration documentation

## Epic 11: Consultation Workflow
- Task 11.1 — Out-of-bounds detection UI (user requests value outside schema range)
- Task 11.2 — 3D model annotation (drop pins/notes on specific geometry areas)
- Task 11.3 — Custom Engineering Request submission (captures state, fires webhook to tenant team)

---

# PHASE 3 — Enterprise & Scale

*(Epics to be broken down in detail when Phase 2 is complete)*

## Epic 12: Java/Creo CAD Worker
- Task 12.1 — Java Spring Boot worker skeleton (queue consumer, S3 upload, Orchestrator callback) — mirrors Task 4.1
- Task 12.2 — PTC Creo J-Link integration (using existing Creo license): wire JSON config params to Creo API calls
- Task 12.3 — Orchestrator routing for `engine: creo` jobs to Java queue (queue already declared in Task 3.3)
- Task 12.4 — Creo worker error handling & DLQ (mirrors Task 4.3)

## Epic 13: Scale & Advanced Infrastructure
- Task 13.1 — S3 Glacier archival cron (inactive/free-tier model migration)
- Task 13.2 — Multi-LOD model pipeline (generate 3 LOD levels at upload, serve by viewport distance)
- Task 13.3 — BYO-Infrastructure tenant mode (self-hosted Orchestrator + worker against our schema contracts)
- Task 13.4 — Prometheus/Grafana self-hosted observability stack (zero app code changes — OTel abstraction)
