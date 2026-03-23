# GitHub Copilot — Repository Instructions

This file provides full architectural context, coding standards, and review guidelines for GitHub Copilot when suggesting code or reviewing pull requests. Apply all sections to every PR review unless the phase scope explicitly defers a concern.

---

## What This Project Is

A **multi-tenant SaaS platform and embeddable React component** for interactive 3D model viewing and parametric CAD configuration. Target industries: granite monuments, industrial equipment, automotive, and any domain using CAD modeling.

Two deployment modes:
- **SaaS Portal** (Next.js): tenants upload models, define schemas, end-users view and configure
- **Plugin** (`<ConfiguratorViewer />`): embeddable React component for third-party platforms

---

## Monorepo Structure

```
apps/saas-portal/              → Next.js SaaS frontend
packages/viewer-core/          → @viewer-core React Three Fiber component (dumb, prop-driven)
services/backend-orchestrator/ → Python FastAPI (API gateway, cache, queue, WebSockets)
services/cad-worker-python/    → Celery worker, FreeCAD/CadQuery CAD generation
services/cad-worker-java/      → Spring Boot worker, PTC Creo via J-Link (Phase 3 only)
db/migrations/                 → Alembic versioned SQL (all schema changes live here)
db/seeds/                      → Demo tenant, Granite template, sample model record
storage/models/samples/        → Committed sample .glb files for local dev
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| SaaS Frontend | Next.js (App Router) |
| 3D Viewer | React Three Fiber + `@react-three/drei` |
| State Management | Zustand with persist middleware |
| Model Compression | Draco + meshopt via `gltf-transform` (at upload time only) |
| Backend Orchestrator | Python FastAPI |
| Task Queue | Celery + RabbitMQ |
| Cache & Quota Counters | Redis |
| Open-Source CAD | FreeCAD / CadQuery (Python) |
| Proprietary CAD | PTC Creo via J-Link (Java/Spring Boot) — Phase 3 only |
| Database | PostgreSQL with Alembic migrations |
| Storage | `StorageProvider` abstraction: LOCAL (dev) or S3+CloudFront (prod) |
| Real-Time | FastAPI native WebSockets |
| Auth (SaaS) | NextAuth.js — JWT with `tenant_id` claim |
| Auth (Plugin) | Signed URLs (recommended) or API Key + CORS (limited) |
| Observability | OpenTelemetry — trace ID propagated through all services |
| E2E Testing | Playwright |
| Unit/Integration | pytest (backend), Jest + React Testing Library (frontend) |

---

## Core Async Pipeline

Every configuration request flows through this path. Suggestions that shortcut or reorder this flow are incorrect.

```
UI POST /configure
  → Orchestrator: validate against JSON schema (reject invalid → HTTP 422)
  → Orchestrator: compute SHA-256(tenant_id + sorted_config_json)
  → Redis cache check
      HIT  → return model URL immediately (HTTP 200)
      MISS → dispatch CAD_GENERATE job to queue (HTTP 202 + jobId)
               → CAD Worker: generate .glb parametrically
               → CAD Worker: upload to StorageProvider
               → CAD Worker: POST callback to Orchestrator with jobId + URL
                   → Orchestrator: store URL in Redis (hash → url)
                   → Orchestrator: push ModelUpdated via WebSocket to specific client session
                       → UI: hot-swap model in canvas, restore user state
```

---

## Development Phases — Know What's In Scope

### Phase 1 — MVP (Current)
Single tenant · Python/FreeCAD · LOCAL storage · Granite Monument schema · Full async pipeline

Do not review Phase 1 PRs against Phase 2/3 requirements. Billing, RLS, Visual Schema Builder, Plugin mode, and S3 are intentionally deferred.

### Phase 2 — Multi-Tenancy & SaaS
Adds: RLS, tenant self-onboarding, Visual Schema Builder, billing/quotas, Plugin mode, S3/CloudFront, consultation workflow.

### Phase 3 — Enterprise
Adds: Java/Creo worker (existing Creo license), multi-LOD, Glacier archival, BYO-Infrastructure.

---

## Coding Style & Standards by Language

When a PR deviates from any standard below, provide the reference link so the developer can apply the correct style in subsequent PRs.

### Python (FastAPI, Celery Workers)

**Standard**: [PEP 8](https://peps.python.org/pep-0008/) + [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)

- **Formatting**: Code must be formatted with `black` (line length 88). Flag unformatted code → *"Run `black .` to auto-format. Ref: https://black.readthedocs.io"*
- **Linting**: `ruff` or `flake8` must pass with zero warnings.
- **Type hints**: All function signatures must have full type annotations (parameters + return type). Untyped functions are a flag. → *"Add type annotations. Ref: https://peps.python.org/pep-0484/"*
- **Naming**: `snake_case` for functions and variables, `PascalCase` for classes, `UPPER_SNAKE_CASE` for module-level constants.
- **Imports**: Grouped in order — stdlib → third-party → local. Sorted within each group (`isort`). Wildcard imports (`from x import *`) are never allowed.
- **Docstrings**: All public functions, classes, and modules must have Google-style docstrings. → *"Add docstring. Ref: https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings"*
- **Exception handling**: Never use bare `except:`. Always catch specific exceptions. Log with structured context (`logger.error("msg", extra={"job_id": ..., "trace_id": ...})`). Re-raise or route to DLQ — never silently swallow.
- **FastAPI specifics**:
  - Use Pydantic models for all request/response bodies. No raw `dict` in/out.
  - Route handlers must be thin — business logic lives in service/use-case classes, not in the route function body.
  - Dependency injection via `Depends()` for auth, DB sessions, and quota checks.
  - HTTP status codes must be explicit (`status_code=202`, not relying on defaults).
- **Async**: Use `async def` consistently for all FastAPI route handlers and I/O-bound functions. Blocking I/O inside `async def` is a performance flag — wrap with `asyncio.run_in_executor` or use async libraries.

### TypeScript / React (Next.js, @viewer-core)

**Standard**: [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/react/) + [React Three Fiber conventions](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)

- **Formatting**: Code must be formatted with `prettier`. Flag unformatted code → *"Run `pnpm prettier --write .` Ref: https://prettier.io"*
- **Linting**: `eslint` with `@typescript-eslint` must pass zero errors/warnings.
- **Types**: No `any` types. No type assertions (`as SomeType`) without a comment explaining why the cast is safe. Prefer `unknown` + type narrowing over `any`.
- **Naming**: `camelCase` for variables and functions, `PascalCase` for components and types/interfaces, `UPPER_SNAKE_CASE` for constants.
- **Components**:
  - Functional components only. No class components.
  - Props must be typed with explicit TypeScript interfaces, not inlined object types for non-trivial shapes.
  - Destructure props at the function signature level.
  - One component per file. Filename matches component name.
- **Hooks**:
  - Custom hooks must be prefixed with `use`.
  - `useEffect` dependencies arrays must be complete and correct — missing deps are a flag.
  - Side effects (API calls, subscriptions) must be cleaned up on unmount.
- **State**: Zustand for global state. `useState` for local UI-only state. Do not reach for global state for local concerns.
- **`@viewer-core` specific**:
  - Component must accept all data via props. No internal API calls, no direct imports from `saas-portal`. It must remain publishable as a standalone NPM package.
  - R3F components must use `useFrame`, `useThree`, and `useLoader` hooks correctly — avoid re-instantiating Three.js objects on every render.
  - Dispose of Three.js geometries and materials when components unmount to prevent WebGL memory leaks.
- **Next.js specific**:
  - Use Server Components by default. Add `'use client'` only when browser APIs or interactivity is required.
  - No `fetch` calls inside client components that bypass Next.js caching/revalidation — use Route Handlers or Server Actions.
  - Environment variables exposed to the client must be prefixed `NEXT_PUBLIC_` and must not contain secrets.

### Java (Spring Boot — Phase 3, Creo Worker)

**Standard**: [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)

- **Formatting**: Code must be formatted with `google-java-format`. → *"Ref: https://github.com/google/google-java-format"*
- **Naming**: `camelCase` for methods and variables, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants, `camelCase` for packages (all lowercase in practice).
- **Dependency Injection**: Use Spring constructor injection only. Field injection (`@Autowired` on fields) is not allowed — it hides dependencies and prevents proper testing. → *"Ref: https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-constructor-injection"*
- **Exception handling**: Use `@ControllerAdvice` / `@ExceptionHandler` for centralized error handling. Never return raw stack traces in HTTP responses.
- **Logging**: Use `SLF4J` with structured MDC context (`MDC.put("job_id", ...)`, `MDC.put("trace_id", ...)`). No `System.out.println`.
- **Worker specifics**:
  - CAD generation logic must be isolated in a dedicated service class, not in the queue listener method.
  - Long-running Creo operations must be interruptible — check for job cancellation signals at checkpoints.
  - All Creo J-Link calls must be wrapped in try/finally blocks to guarantee session cleanup, preventing Creo license slot leaks.

### SQL (Alembic Migrations)

- All migration files must be idempotent where possible.
- Never use `DROP TABLE` or `DROP COLUMN` in a migration without a corresponding rollback migration.
- Every table must have `created_at` and `updated_at` timestamp columns.
- Every core table must have a `tenant_id` column (UUID, NOT NULL, indexed).
- Foreign key constraints must be explicit. No implicit relationships enforced only in application code.
- Index all columns used in `WHERE` clauses for tenant-scoped queries.

---

## Security Review — Flag All of the Following

### Data Leakage
- **Cross-tenant data exposure**: Any query that does not filter by `tenant_id` in Phase 2+ is a critical flag. Comment: *"This query is missing tenant_id scoping. In Phase 2 with RLS enabled, all queries must be scoped to the authenticated tenant. Add WHERE tenant_id = :tenant_id or rely on RLS policy — but verify PgBouncer is in session mode."*
- **JWT claim leakage**: Ensure `tenant_id` is read from the verified JWT claim server-side, never from a user-supplied request parameter. Flag any route that accepts `tenant_id` as a query param or request body field for auth purposes.
- **Model URL exposure**: Signed URLs for S3 models must have short TTLs (≤1 hour). Permanent public S3 URLs for tenant models are a critical flag.
- **Secrets in code**: Flag any hardcoded API keys, passwords, tokens, or connection strings. Flag `.env` files committed to the repository. Comment: *"Move to environment variable. Never commit secrets. Ref: https://12factor.net/config"*
- **Stack traces in responses**: Never expose internal error details, file paths, or stack traces in API responses. Use structured error codes only.
- **PII in logs**: Flag any log statement that writes user-identifiable data (email, name, address) in plain text. PII in logs must be masked or omitted.
- **WebSocket session isolation**: `ModelUpdated` events must only be pushed to the session that initiated the job. Flag any broadcast-to-all-clients implementation.

### Input Validation
- All configuration payloads must be validated against the stored JSON schema at the Orchestrator before reaching the CAD worker. Flag any worker code that processes an unvalidated payload.
- File uploads (CAD models) must validate file type by magic bytes, not file extension. Flag extension-only validation.
- Numeric parameters must enforce min/max bounds server-side, not just client-side.

---

## Performance Review — Flag All of the Following

### Backend
- **Blocking async routes**: `async def` FastAPI handlers that call synchronous blocking I/O (file reads, synchronous DB drivers, `requests` library) without `run_in_executor`. Comment: *"This blocks the event loop. Use `await asyncio.get_event_loop().run_in_executor(None, blocking_fn)` or switch to an async library."*
- **N+1 queries**: Loops that issue one DB query per iteration. Flag and suggest a single query with `JOIN` or `IN` clause.
- **Missing Redis TTL**: Cache entries written to Redis without an explicit TTL will grow unbounded. Flag any `redis.set()` call missing an `ex=` or `px=` parameter.
- **Unbounded queue dispatch**: If quota checks are missing before dispatching a CAD job, a single tenant could flood the queue. Flag any dispatch path that bypasses quota middleware.
- **Large payload over WebSocket**: Model URLs should be passed over WebSocket, never raw binary model data. Flag any WebSocket message exceeding 10KB.
- **Synchronous CAD operations in request handler**: CAD generation must always be async (queued). Flag any direct CAD library call inside a FastAPI route handler.

### Frontend
- **Three.js memory leaks**: R3F components that create geometries, materials, or textures without disposing them on unmount. Comment: *"Dispose geometry and material in useEffect cleanup. Ref: https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects"*
- **Re-creating Three.js objects on every render**: Object instantiation (`new THREE.Vector3()`, `new THREE.MeshStandardMaterial()`) inside the render path (component body or `useFrame`). Move to `useMemo` or `useRef`.
- **Uncompressed model loading**: Loading raw `.glb` or `.step` files directly in the viewer. Compression must happen at upload time. Flag models loaded without Draco decoder configured.
- **Blocking the main thread**: Heavy computation (geometry processing, large array transforms) on the main JS thread. Suggest Web Workers or move to the backend pipeline.
- **Missing Suspense boundary**: `useGLTF` or any async asset loader called without a `<Suspense>` boundary will throw unhandled promise rejections on load failure.
- **Zustand over-subscription**: Components subscribing to the entire Zustand store (`useStore()`) instead of a specific slice (`useStore(state => state.specificField)`). This causes unnecessary re-renders.

---

## Architecture Deviation — Flag All of the Following

1. **`@viewer-core` importing from `saas-portal`**: The viewer package must be fully decoupled. Any cross-package import from `packages/viewer-core` into `apps/saas-portal` is a critical architectural violation.
2. **Direct S3 SDK calls outside `StorageProvider`**: All storage operations must go through the `StorageProvider` interface. Direct `boto3` or AWS SDK calls in business logic bypass the abstraction.
3. **Schema changes outside `db/migrations/`**: `CREATE TABLE`, `ALTER TABLE`, or `DROP` statements anywhere other than numbered Alembic migration files.
4. **Orchestrator modified for Creo-specific logic**: CAD engine routing is handled by the `engine` field in model metadata. The Orchestrator dispatches to the correct queue — no engine-specific code belongs here.
5. **Quota enforcement outside Orchestrator middleware**: Quota checks added in route handlers, workers, or DB constraints instead of dedicated middleware.
6. **CAD generation inside the Orchestrator**: The Orchestrator orchestrates only. Any direct FreeCAD, CadQuery, or Creo API call in the Orchestrator service is a violation.
7. **WebSocket broadcast to all sessions**: `ModelUpdated` must be routed to the specific originating session. Global broadcasts leak job status across tenants.
8. **Hardcoded industry logic in `@viewer-core`**: The viewer renders UI from a JSON schema prop. Any hardcoded reference to "granite", "monument", or other domain nouns in `packages/viewer-core/` is a violation.

---

## Test Coverage

- **Minimum required coverage: 90%** for all packages and services.
- If a PR reduces coverage below 90% for any package, add a review comment:
  *"Test coverage for `[package/service]` is below the 90% threshold. Current: X%. Please add tests covering [list uncovered paths if identifiable]. Coverage must be ≥90% before merge."*
- Coverage must include:
  - Unit tests for all pure functions, Zustand reducers, hash/validation logic
  - Component tests for all dynamic UI paths (each schema type renders correct control)
  - Integration tests for the full async pipeline (cache hit, cache miss, worker callback, WebSocket delivery)
  - E2E critical path test (Task 6.2 Playwright flow) must pass before Phase 1 is considered complete
- **Integration tests must use a real PostgreSQL and Redis instance** (Docker). Mocked DB integration tests are not accepted — they have previously masked production migration failures.
- New async flows (new job types, new WebSocket events) require a corresponding integration test simulating the full round-trip.

---

## What to Include in Every Review Comment

When flagging an issue, always provide:
1. **What the problem is** — one clear sentence
2. **Why it matters** — security risk, performance impact, architecture violation, or style deviation
3. **How to fix it** — specific code suggestion or pattern to apply
4. **Reference link** — to the relevant standard, doc, or architecture decision so the developer or an AI agent can resolve it independently

Example format:
> **[Security — Data Leakage]** This query does not scope by `tenant_id`. In Phase 2 with RLS active, unscoped queries will return data across all tenants if the DB connection does not carry the correct session variable.
> **Fix**: Add `.filter(Model.tenant_id == current_tenant_id)` or rely on the RLS policy — but verify PgBouncer is in session mode (`pool_mode=session`).
> **Ref**: `docs/ideation/implementation_plan_v3.md` — Security Notes §1.

---

## PR Review Checklist

### Security
- [ ] No query missing `tenant_id` scoping (Phase 2+)
- [ ] `tenant_id` sourced from verified JWT, not user input
- [ ] No hardcoded secrets, tokens, or connection strings
- [ ] No stack traces or PII in API responses or logs
- [ ] S3 signed URLs have short TTL (≤1 hour)
- [ ] WebSocket events scoped to originating session only
- [ ] Cache hash includes `tenant_id` salt and sorted keys
- [ ] File uploads validated by magic bytes, not extension only

### Architecture
- [ ] `@viewer-core` has no imports from `saas-portal`
- [ ] All storage operations go through `StorageProvider` interface
- [ ] Schema changes are Alembic migration files only
- [ ] Orchestrator contains no CAD-engine-specific logic
- [ ] Quota checks happen at Orchestrator middleware, before job dispatch
- [ ] No CAD library calls inside Orchestrator route handlers
- [ ] No hardcoded domain/industry logic in `@viewer-core`

### Performance
- [ ] No blocking I/O inside `async def` FastAPI handlers
- [ ] No N+1 DB query patterns
- [ ] Redis `set()` calls include explicit TTL
- [ ] Three.js objects disposed on component unmount
- [ ] No Three.js object instantiation inside render path
- [ ] Models loaded in viewer are Draco-compressed

### Coding Style
- [ ] Python: `black`-formatted, fully type-annotated, Google-style docstrings, no bare `except`
- [ ] TypeScript: `prettier`-formatted, no `any` types, clean `useEffect` dependencies
- [ ] Java (Phase 3): `google-java-format`, constructor injection only, SLF4J + MDC logging
- [ ] SQL: `tenant_id` on all core tables, explicit FK constraints, indexed query columns

### Testing
- [ ] Coverage ≥ 90% for all modified packages/services
- [ ] Integration tests use real DB and Redis (no mocks)
- [ ] New async flows have WebSocket round-trip integration test
- [ ] New schema types have component render tests
