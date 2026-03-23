# 3D Viewer & Configurator — Task Breakdown v2

## 🕵️ Active Agent Roster
| Agent Persona | Role | Current Assignment | Status | Branch |
|---|---|---|---|---|
| **Dev Alpha** | Backend / Python | Epic 4: Task 4.1 (Celery Worker)| Building Celery queue integration | `feature/task-4.1-cad-worker` |
| **Dev Beta** | Frontend / React | Epic 2: Task 2.1 (3D Canvas) | Initializing @viewer-core | `feature/task-2.1-3d-canvas` |
| **Peer Reviewer Gamma** | Backend TDD / Opt | Peer Review Queue | Waiting for Dev Alpha | - |
| **Peer Reviewer Delta** | Frontend TDD / Opt | Peer Review Queue | Waiting for Dev Beta | - |
| **QA Agent Omega** | E2E Product Quality | Feedback Loop | Waiting for testable increments| - |
| **Human Stakeholder** | Product Owner | Epic Review & Demo | Milestone Approval Loop | `main` |
| **Doc Agent Sigma**| Tech Writer / Historian| Project Journey Blog | Documenting Sprint 1 Overview | `main` |
| **Code Reviewer** | Lead Architect | Code Review | Monitoring | `main` |

---

Tasks are organized by Phase, then Epic. Each task is independently pickable with explicit dependencies, context, and testing requirements. MVP (Phase 1) tasks are fully detailed. Phase 2 and Phase 3 tasks are scoped at the epic level and will be broken down when Phase 1 is complete.

**Team size assumption**: 2–5 developers.

---

# PHASE 1 — MVP

---

## 🏗️ Epic 1: Foundation & Core Infrastructure

---

### [x] Task 1.1 — Initialize Monorepo (Turborepo) & Core Packages
- **Context**: Scaffold the monorepo with three workspaces: `apps/saas-portal` (Next.js), `packages/viewer-core` (React component library), `services/backend-orchestrator` (Python FastAPI). Configure Turborepo pipelines for `build`, `lint`, `test`. Set up shared TypeScript config and ESLint rules.
- **Dependencies**: None.
- **Deliverable**: `pnpm install && pnpm turbo run build` passes cleanly across all workspaces.
- **Testing**: CI pipeline passes linting, formatting, and type-checks for all workspaces.

--- [x] **Task 1.2: Version-Controlled SQL, Migrations & Local Database**
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

### [x] Task 1.3 — SaaS JWT Authentication (NextAuth.js)
- **Context**: Implement NextAuth.js with JWT strategy for the `saas-portal`. Protect all API routes and Next.js pages behind auth. Store session user with `tenant_id` claim in JWT payload (even in single-tenant MVP, so the claim is present and ready for RLS in Phase 2).
- **Dependencies**: Task 1.2
- **Testing**:
  - Functional test: Valid credentials issue a JWT with correct claims.
  - Functional test: Unauthenticated requests to protected routes return 401.
  - Functional test: JWT expiry is enforced.

---

### [x] Task 1.4 — Storage Provider Abstraction (`LOCAL` vs `S3`)
- **Context**: Implement a `StorageProvider` abstract interface with three methods: `upload(file, path) -> url`, `getUrl(path) -> url`, `delete(path)`. Wire `STORAGE_PROVIDER=local` to serve files from `storage/models/` via FastAPI `StaticFiles`. Wire `STORAGE_PROVIDER=s3` to AWS S3 + CloudFront (implementation ready but not activated in MVP). Commit small sample `.glb` models to `storage/models/samples/` so the viewer works immediately.
- **Dependencies**: Task 1.1
- **Testing**:
  - Unit tests on both provider implementations using the same test fixture interface.
  - Smoke test: Sample model URL resolves and loads in the browser in `local` mode.
  - Unit test: Switching `STORAGE_PROVIDER` requires zero application code changes.

---

## 🖥️ Epic 2: `@viewer-core` Component (Frontend 3D)

**Context**: A pure, decoupled React component. It is "dumb" — driven entirely by a `modelUrl` prop. It knows nothing about the SaaS backend or the configurator logic, allowing it to function as a **standalone 3D viewer**. The Configurator is an *extended feature* that wraps this Viewer seamlessly.

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
- **Context**: Implement `useGLTF` with React `<Suspense>` for progressive loading. Add a loading spinner/skeleton while the model streams. Implement graceful error boundary for WebGL context loss. Add support for **Draco-compressed** and **meshopt-compressed** GLB files. At model upload time, run `gltf-transform` to apply Draco compression.
- **Dependencies**: Task 2.1, Task 1.4
- **Testing**:
  - Unit test: Loading state renders during model fetch.
  - Unit test: Error boundary renders fallback on WebGL context loss.
  - Functional test: A Draco-compressed `.glb` loads and renders correctly.

---

### Task 2.3 — Dynamic Configuration UI & Zustand State
- **Context**: Implement the Zustand store to hold current configuration state. Dynamically render configuration controls from an injected JSON schema prop — no hardcoded UI per industry. Schema types to support in MVP: `enum`, `number_range`. State must survive component unmount/remount (Zustand persist middleware).
- **Dependencies**: Task 2.2
- **Testing**:
  - Unit tests: Zustand store reducers.
  - Component test: `enum` schema renders correct number of swatches.
  - Component test: `number_range` schema renders slider with correct min/max bounds.
  - Component test: State persists across component unmount/remount.

---

## ⚙️ Epic 3: Backend API & Configurator Orchestrator

---

### [x] Task 3.0 — Standalone Model API (Viewer REST Endpoint)
- **Context**: Create a `GET /api/models/{id}` REST endpoint that returns the base `.glb` model URL, metadata, and the associated configuration schema. This allows the frontend Viewer to independently fetch and display the standalone model instantly.
- **MVP vs Phase 2**: For the MVP (Phase 1), this endpoint routes a direct `StaticFiles` URL (`/storage/models/...`). In Phase 2, the design dictates this exact same endpoint will seamlessly transition to generating **Signed CDN URLs** to enforce tenant boundary isolation.
- **Dependencies**: Task 1.2
- **Testing**: 
  - Integration test: Endpoint returns `200 OK` with a valid JSON payload containing the model's base StorageProvider URL.

---

### Task 3.1 — Deterministic Hashing & Redis Cache
- **Context**: Implement tenant-scoped hashing: `SHA-256(tenant_id + sorted(json.dumps(config_payload)))`. On cache hit, return URL immediately with HTTP `200`. Store cache entries as `hash -> model_url` in Redis. Include `ENABLE_GLOBAL_CACHING=false` toggle to disable Redis entirely.
- **Dependencies**: Task 1.1
- **Testing**:
  - Unit test: Hash algorithm alphabetizes keys to ensure identical hashes.
  - Unit test: Different `tenant_id` values produce different hashes (no cross-tenant bleed).
  - Integration test: Cache hit returns correct URL with no queue dispatch.

---

### Task 3.2 — Schema Validation Middleware
- **Context**: Validate the incoming configuration payload against the model's stored JSON schema. Reject out-of-range `number_range` values and invalid `enum` values with HTTP `422`. 
- **Dependencies**: Task 3.1
- **Testing**:
  - Unit test: Valid payload passes validation.
  - Unit test: Out-of-range number returns 422 with field name in response.

---

### Task 3.3 — Message Queue Setup (RabbitMQ/Celery) & Multi-Engine Routing
- **Context**: On a cache miss, the Orchestrator dispatches a `CAD_GENERATE` job to the appropriate Celery queue based on `engine` (`freecad` or `creo`). Return HTTP `202 Accepted` immediately with a `jobId`.
- **Dependencies**: Task 3.2
- **Testing**:
  - Integration test: Valid request routes to correct queue based on `engine` field.
  - Unit test: HTTP `202` is returned immediately without waiting for completion.

---

### Task 3.4 — WebSocket Notification Gateway
- **Context**: Implement a FastAPI WebSocket server. When a CAD worker completes a job, it calls back to the Orchestrator. The Orchestrator resolves the session, stores the URL in Redis cache, and pushes a `ModelUpdated` payload explicitly to the specific client session.
- **Dependencies**: Task 3.3
- **Testing**:
  - Integration test: Simulate a worker callback → verify the correct WebSocket client receives the event.

---

## 🛠️ Epic 4: Python CAD Worker (FreeCAD/CadQuery)

---

### [x] Task 4.1 — Worker Skeleton, Queue Consumer & Storage Upload
- **Context**: Scaffold Celery worker pulling from RabbitMQ. Implement `StorageProvider` upload step. POST the resulting URL back to the Orchestrator callback.
- **Dependencies**: Task 3.3, Task 1.4

---

### Task 4.2 — Granite Monument Parametric Model (FreeCAD/CadQuery)
- **Context**: Wire Granite Monument JSON parameters to CadQuery commands. Export to `.glb` via `trimesh` or Blender API. Apply Draco compression.
- **Dependencies**: Task 4.1
- **Testing**:
  - Functional test: Supply valid JSON config → assert valid `.glb` is outputted.
  - Regression fixtures: Compare output against known-good geometry test fixtures.

---

### Task 4.3 — Worker Error Handling & Dead Letter Queue
- **Context**: Handle CAD generation failures. Catch exceptions, push to Dead Letter Queue, and notify Orchestrator so it can fire `GenerationFailed` WebSocket event.
- **Dependencies**: Task 4.2

---

## 🚀 Epic 5: SaaS Portal UI (Next.js)

---

### Task 5.1 — Model Discovery Dashboard
- **Context**: Build Dashboard page listing available models, search filtering, and "Recently Viewed" section.

### Task 5.2 — Viewer Page & Configurator Panel
- **Context**: Loads `@viewer-core`. Renders dynamic configuration JSON schema. Handles loading states smoothly so the user can navigate cleanly away while CAD runs.

### Task 5.3 — Global Toast Notification & State Resumption
- **Context**: Global listener for `ModelUpdated`. Fires toast notification. Clicking it hot-swaps the model into the canvas, restoring exactly where the user left off.

---

## 🧪 Epic 6: System Integration, E2E & Observability

---

### Task 6.1 — OpenTelemetry Instrumentation
- **Context**: Instrument all microservices (Trace ID propagates UI → Orchestrator → Queue → Worker).

### Task 6.2 — Full E2E Critical Path Test (Playwright)
- **Context**: Automated Playwright suite. Flow: `Login → Select Model → Slide Config (cache miss) → Spinner visible → WebSocket ModelUpdated → Canvas renders new .glb`. This signifies Phase 1 completion.

---

# PHASE 2 & 3 — Scale, Features, and Enterprise

*(Tasks to be broken down in detail when Phase 1 E2E test passes)*

## Epic 7: Multi-Tenancy & RLS
- Task 7.1 — Enable PostgreSQL RLS policies
- Task 7.2 — Configure PgBouncer in session mode 
- Task 7.3 — Tenant self-onboarding

## Epic 8: Schema CMS & Visual Schema Builder
- Task 8.1 — Model upload UI
- Task 8.2 — Industry Template Library
- Task 8.3 — Visual Schema Builder UI (drag-and-drop schema config)

## Epic 9: Billing, Quotas & Super-Admin
- Task 9.1 — Quota enforcement middleware in Orchestrator (Redis counters)
- Task 9.2 — Billing tier configuration
- Task 9.3 — Super-Admin dashboard
- Task 9.4 — Free tier auto-deletion cron
- **Task 9.5 — Eventual Consistency Sync (Cron job to securely flush Redis quota counters to PostgreSQL every 5 minutes to mitigate Redis volatility)**

## Epic 10: Plugin Mode & Production Storage
- Task 10.1 — Plugin Auth Option B: Signed URL exchange
- Task 10.2 — Plugin Auth Option A: API Key + CORS validation
- Task 10.3 — Switch storage to AWS S3 + CloudFront
- Task 10.4 — `<ConfiguratorViewer />` NPM package publish

## Epic 11: Consultation Workflow
- Task 11.1 — Out-of-bounds parameter detection UI
- Task 11.2 — Custom Engineering Request submission webhook

## Epic 12: Java/Creo CAD Worker (Phase 3)
- Task 12.1 — Java Spring Boot worker skeleton
- Task 12.2 — PTC Creo J-Link integration

## Epic 13: Scale & Advanced Infrastructure (Phase 3)
- Task 13.1 — S3 Glacier archival cron
- Task 13.2 — Multi-LOD model generation pipeline
- Task 13.3 — Prometheus/Grafana observability stack

## Epic 14: Viewer Feature Enhancements (Phase 2/3)
- **Task 14.1 — Side-by-Side Comparison Engine (Independent renderers, Sync Camera logic, shared data panel)**
- **Task 14.2 — Visual Annotations & Interactive Dimension Overlays**
- **Task 14.3 — Advanced Embeddability Hooks (Screenshot capture, Analytics tracking callbacks)**
