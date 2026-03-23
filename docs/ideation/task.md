# 3D Viewer & Configurator - Developer Task Breakdown

This document outlines the detailed execution tasks for a team of 2-5 developers. Each task is designed to be independently pickable, providing enough context, clear dependencies, and strict testing requirements.

---

## 🏗️ Epic 1: Foundation & Core Infrastructure
**Context**: Setting up the base repositories, CI/CD, and shared schemas before divergent feature work begins.

- [ ] **Task 1.1: Initialize unified Monorepo (Turborepo) & Core Packages**
  - **Context**: Scaffold the Next.js `saas-portal`, the React `@viewer-core` package, and the Python `backend-orchestrator` within a single monorepo for shared typings.
  - **Dependencies**: None.
  - **Testing**: CI pipeline must pass basic linting, formatting, and type-checks for all workspaces.
- [ ] **Task 1.2: Version-Controlled SQL, Migrations & Embedded Local Database**
  - **Context**: Create the `db/` directory structure (`migrations/`, `seeds/`) in the monorepo. Write all schema DDL (Tenants, Users, Models, RLS policies) as numbered migration files. Configure **Flyway** (Java stack) or **Alembic** (Python stack) to auto-apply migrations on service startup. Configure `docker-compose.yml` so a developer can run a single `docker compose up` to get a fully migrated, seeded local PostgreSQL instance. The `DATABASE_URL` env var is the sole switch between local and hosted.
  - **Dependencies**: Task 1.1
  - **Seed Data**: `db/seeds/` must include a default Super Admin, sample industry schema templates (e.g., Granite, Industrial Gear), and a sample model record.
  - **Testing**: *Unit Tests* verifying RLS — Tenant A's DB credentials cannot `SELECT` Tenant B's models. *Smoke Test* validating `docker compose up` produces a fully seeded local DB with no manual steps.
- [ ] **Task 1.3: Setup Auth Foundation (SaaS & Plugin)**
  - **Context**: Implement NextAuth.js (JWT) for the SaaS portal and API Key validation strategy for external Plugin ingestion.
  - **Dependencies**: Task 1.2
  - **Testing**: *Functional Tests* validating JWT issuance and API Key rejection for invalid CORS origins (Option A Auth).
- [ ] **Task 1.4: Storage Provider Abstraction (`LOCAL` vs `S3`)**
  - **Context**: Implement a `StorageProvider` interface exposing `upload()`, `getUrl()`, and `delete()`. Wire `STORAGE_PROVIDER=local` to a local `storage/models/` directory served over HTTP (FastAPI `StaticFiles`). Wire `STORAGE_PROVIDER=s3` to AWS S3+CloudFront. Commit sample `.glb` files to `storage/models/samples/` so the Viewer works out-of-the-box after `docker compose up`.
  - **Dependencies**: Task 1.1
  - **Testing**: *Unit Tests* on both provider implementations using the same test fixture. *Smoke Test* confirming a sample model URL resolves and loads in the browser in `local` mode.

---

## 🖥️ Epic 2: `@viewer-core` MVP (Frontend 3D)
**Context**: Building the pure, decoupled 3D React Three Fiber component. It must be "dumb" and strictly driven by external props, knowing nothing about the SaaS backend context.

- [ ] **Task 2.1: Base 3D Canvas & Camera Limits**
  - **Context**: Setup R3F Canvas, HDRI Environment lighting, and strict OrbitControls (limits to prevent clipping through geometry).
  - **Dependencies**: Task 1.1
  - **Testing**: *Unit Tests* for component mounting. *Visual testing* for camera preset transitions.
- [ ] **Task 2.2: GLTF/GLB Asset Loader & Pre-loading strategy**
  - **Context**: Implement `useGLTF` with React Suspense. Add progressive loading UI (spinners) and graceful error/fallback handlers for WebGL context loss.
  - **Dependencies**: Task 2.1
  - **Testing**: *Unit Tests* covering loading states; *Functional Test* ensuring preloaded assets render instantly.
- [ ] **Task 2.3: Dynamic Configuration State & UI Generation**
  - **Context**: Implement the Zustand store. Dynamically render UI sliders/swatches explicitly based on an injected JSON schema prop.
  - **Dependencies**: Task 2.2
  - **Testing**: *Unit Tests* on Zustand reducers; *Component Tests* verifying that different JSON schemas correctly render different UI controls without code edits.

---

## ⚙️ Epic 3: Backend Configurator Orchestrator
**Context**: The central API gateway receiving configurations from the UI, validating schemas, hitting Redis, and queuing heavy CAD jobs.

- [ ] **Task 3.1: Deterministic Hashing & Redis Caching**
  - **Context**: Implement the tenant-scoped cryptographic hashing algorithm. Connect to Redis to check for existing CDN URLs before processing.
  - **Dependencies**: Task 1.1
  - **Testing**: *Unit Tests* verifying the hashing algorithm strictly alphabetizes JSON keys and includes the `tenant_id` salt.
- [ ] **Task 3.2: Message Queue Setup (RabbitMQ/Celery)**
  - **Context**: The Orchestrator must successfully push a "CAD_GENERATE" job to the queue and immediately return HTTP `202 Accepted` with a `jobId`.
  - **Dependencies**: Task 3.1
  - **Testing**: *Integration Test* routing a mock job to the queue and verifying queue depth increases.
- [ ] **Task 3.3: WebSockets & Notification Gateway**
  - **Context**: Setup WebSockets to listen for completed jobs from workers and push `ModelUpdated` payloads to the specific client session.
  - **Dependencies**: Task 3.2
  - **Testing**: *Unit Test* WebSocket authentication; *Integration Test* broadcasting a completion event to a mock connected client.

---

## 🛠️ Epic 4: CAD Workers (Python / Java)
**Context**: The actual headless geometry generation engines autonomously listening to the RabbitMQ queue.

- [ ] **Task 4.1: CAD Worker Skeleton & S3 Upload**
  - **Context**: Setup the standalone worker pulling jobs from the queue. Implement the AWS S3 utility to upload generated `.glb` files and push the URL back to the Orchestrator.
  - **Dependencies**: Task 3.2
  - **Testing**: *Unit Test* S3 upload utility via Cloud mocks (e.g., `moto` for AWS).
- [ ] **Task 4.2: Open-Source CAD Integration (FreeCAD/CadQuery)**
  - **Context**: Wire the incoming JSON parameters to the actual open-source CAD programmatic commands to sculpt the model.
  - **Dependencies**: Task 4.1
  - **Testing**: *Functional Test*: Supply a rigid JSON config -> Verify a valid, well-formed `.glb` file is outputted.

---

## 🚀 Epic 5: System Integration & E2E Testing Milestone
**Context**: End-to-End wiring of the UI, Orchestrator, Queue, and Workers. This Epic acts as the ultimate validation milestone before Phase 2 capabilities (like Comparison) are started.

- [ ] **Task 5.1: UI to API Integration (Synchronous)**
  - **Context**: Wire the Next.js visual schema builder and Viewer Dashboard to actively hit the Orchestrator APIs for authentication and cache hits.
  - **Dependencies**: Epics 1, 2, 3
  - **Testing**: *Integration Test* verifying the `@viewer-core` successfully receives and renders a URL from a Redis cache hit.
- [ ] **Task 5.2: E2E Asynchronous Workflow Test (The Critical Path)**
  - **Context**: Validate the full decoupled pipeline. 
  - **Flow**: Viewer requests new config -> Cache miss -> Orchestrator Queues -> Worker Generates -> S3 Uploads -> Worker pings Orchestrator -> WebSocket fires -> Viewer automatically hot-swaps the `.glb`.
  - **Dependencies**: Epics 1, 2, 3, 4
  - **Testing**: Automated **Playwright/Cypress** E2E suite spinning up all microservices, executing this exact critical path in a headless browser, and asserting the final canvas swap.
