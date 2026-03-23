# 3D Viewer & Configurator Application - Implementation Plan

## Goal Description
Build a highly interactive 3D viewer and configurator application for industries ranging from granite monuments to automotive and industrial supplies. The application will be a standalone platform and provide a highly reusable NPM component. It will seamlessly transition between viewing and configuration, maintaining UI state without blocking the user during heavy CAD processing.

---

## 🔒 Authentication & API Security
Because CAD generation is CPU-intensive and proprietary, security is critical across both deployment models:
1. **SaaS Portal (Human Auth)**: We will use NextAuth.js (JWT) to manage tenant logins. 
   - **Row Level Security (RLS)**: PostgreSQL is configured with strict RLS policies. Every database query automatically applies the user's `tenant_id`, guaranteeing mathematically absolute isolation between tenants at the database engine level.
2. **Plugin API Access (Machine-to-Machine)**: Clients hosting the plugins authenticate via two officially supported, documented, and fully tested methods:
   - **Option A (Strict CORS)**: For rapid integrations, clients use a static API Key. Our backend tightly validates the Origin header, rejecting any request not originating from the client's whitelisted domain to prevent browser scraping.
   - **Option B (Temporary Signed URLs)**: For maximum security. The client's secure backend exchanges a hidden secret key for a temporary 1-hour session token or signed S3 CDN url, passing only the temporary token to the frontend Viewer.

---

## 🏢 Tenant Lifecycle & Billing Strategy
To support massive scale without encountering unpredictable cloud compute costs:
- **Self-Onboarding & Pricing Tiers**: Prospective tenants can self-onboard into different tiers (Free, Paid, Bring-Your-Own-API/Infrastructure).
- **Quotas & Super-Admin Controls**: Free tier tenants are strictly rate-limited (e.g., maximum model uploads, maximum CAD configurations generated per month). System administrators possess a Super-Admin dashboard to adjust tier guidelines, modify individual tenant limits, or instantly suspend/deactivate abusive accounts.
- **Cost-Effective Archival & Auto-Deletion**: To ruthlessly manage storage costs for non-paying users:
  - Inactive models (or models from deactivated/free tenants) automatically migrate to AWS S3 Glacier (Cold Storage) after a threshold of inactivity.
  - A scheduled cron job permanently auto-deletes old, untouched Free tier configurations, ensuring the primary S3 bucket remains lean and fast.

---

## 🧠 Configuration Schema & Data Modeling
To support vastly different industries (e.g., Granite Monuments vs. Industrial Gearboxes) without rewriting the frontend, the UI must be completely data-driven.

### 1. Admin/Tenant Schema CMS & Catalog
- **Model Uploading & Tagging**: Tenants can upload their base CAD files (`.glb`, `.step`) via the SaaS dashboard. During upload, admins can assign **Tags**, **Categories**, and **Industries** to make the models highly searchable for end-users.
- **Schema Template Library**: When defining the configuration schema for a newly uploaded model, the admin is presented with pre-built **Industry Templates** (e.g., "Standard Granite Monument Workflow", "Industrial Gear Workflow"). Admins can instantly apply these templates to avoid building from scratch, or they can design entirely custom schemas.
- **Visual Schema Builder**: For custom builds or template overrides, the UI provides a visual builder where the tenant defines variables like `Material` (Enum) or `Width` (Number Range), explicitly setting the `min`/`max` constraints. The final schema is saved as a strict JSON document in PostgreSQL.

### Backend (Microservices Architecture)
To avoid language fragmentation and reduce maintenance overhead, the core backend services will be written in the **same language** chosen for the primary CAD workers (i.e., **Python/FastAPI** or **Java/Spring Boot**). The backend is strictly divided into specialized microservices:

1. **SaaS Core API (Python/Java)**: 
   - Handles tenant onboarding, JWT authentication, PostgreSQL RLS queries, billing quotas, the Schema CMS logic, and the S3 archival lifecycle. 
   - Acts purely as the administrative backing for the multi-tenant SaaS.

2. **Configurator Orchestrator API (Python/Java)**:
   - The central gateway for all 3D configuration requests originating from *both* the SaaS UI and external Plugin clients.
   - Evaluates the Deterministic Hash and queries the Redis Cache.
   - On a cache miss, the Orchestrator checks the model's metadata to determine the required generation engine, and dispatches the task to the appropriate message queue (RabbitMQ/Celery).
   - Manages the WebSockets/SSE server to push the final `ModelUpdated` payload back to the explicit client.

3. **Python CAD Worker (Microservice)**:
   - An isolated Python FastAPI/Celery container fleet.
   - Strictly responsible for executing jobs using **Open Source CAD APIs** (FreeCAD, CadQuery, Blender Python API). Once generation is complete, it uploads to S3 and notifies the Orchestrator.

4. **Java CAD Worker (Microservice)**:
   - An isolated Java Spring Boot container fleet.
   - Strictly responsible for executing jobs by interfacing deeply with proprietary software like **PTC Creo via J-Link** or other enterprise kernels.

### 2. Viewer Dashboard & Module Transitions
- **Feature Flagged Modules**: The "Viewer" and the "Configurator" are two explicitly distinct application modules. Access to the Configurator is computationally expensive and is strictly gated by the tenant's subscription or feature flags.
- **Model Discovery Layer**: The entry point is the Viewer Dashboard, featuring:
  - **Search & Filtering**: Finding models based on the Admin's tags and categories.
  - **Quick Access**: Dedicated sections for "Recently Viewed Models" and "Favorite/Starred Models".
- **Seamless UX Transitions**: 
  - If an end-user has permission, they can seamlessly toggle a model from "View Mode" into "Configure Mode".
  - State is preserved globally via Zustand. If a user navigates away from the Configurator and later returns, the UI perfectly restores their last working configuration state.

### 3. Asynchronous UX & Notification Lifecycle
- **Parallel Interaction**: When a user selects a new configuration option:
  - If the cache hits, the model swaps instantly.
  - If a new CAD job is queued, the UI presents a friendly, non-blocking loading animation.
- **Background Navigation**: Because Zustand manages state globally, the user is never artificially locked to the loading screen. They can navigate back to the Viewer Dashboard or search for other models while the background CAD engine runs.
- **Event Resumption**: When the WebSocket fires the `ModelUpdated` event:
  - A global toast notification alerts the user ("Your model configuration is ready!").
  - Clicking the notification instantly routes the user back into the Configurator, gracefully hot-swapping the new 3D model into the canvas.## 📊 Logging & Telemetry
Because asynchronous workflows spanning multiple microservices (UI -> Orchestrator -> Queue -> CAD Worker -> WebSocket) are difficult to debug, strict observability is required from Day 1 without over-engineering:

- **Structured JSON Logging**: All microservices output logs in structured JSON format, ensuring seamless ingestion and filtering.
- **Distributed Tracing (OpenTelemetry)**: We will instrument the backend with **OpenTelemetry (OTel)** standards. Every frontend API request generates a `Trace ID`. This ID instantly propagates through the Orchestrator, into the RabbitMQ/Redis message queue, and down to the specific CAD worker processing the job. This guarantees developers can trace the exact lifespan of a configuration request across all decoupled systems.
- **Simple MVP Setup**: To avoid over-engineering during initial development, logs and traces will simply be routed to a managed cloud service (e.g., **AWS CloudWatch** or **Datadog**). Because we strictly use the agnostic OpenTelemetry standard, you can freely rip-and-replace Datadog with a self-hosted Prometheus/Grafana stack in the future with exactly zero application code changes.

---

## Verification & Testing Strategy
To ensure enterprise-grade stability, testing is strictly enforced across three layers for both the Frontend and Backend:

### 1. Unit Testing
- **Frontend (UI)**: Use `Jest` and `React Testing Library` to test isolated components (e.g., verifying Zustand state updates, validating that the dynamic UI generates the correct slider bounds based on a mock JSON schema).
- **Backend (API)**: Use `pytest` (for Python) or `JUnit` (for Java) to test isolated pure functions, specifically focusing on the configuration validator, JSON parser, and the caching hash generator algorithm.

### 2. Integration Testing
- **Frontend (UI)**: Test the interaction between the `@viewer-core` component and the broader `saas-portal`. Use `@react-three/test-renderer` to ensure mock WebSocket events successfully trigger state restorations without spinning up an actual heavy WebGL browser context.
- **Backend (API)**: Test the asynchronous message broker pipeline. An automated suite will simulate an API POST request, ensure it routes to Redis/RabbitMQ, trigger a mock background worker, and verify the worker successfully pings the WebSocket gateway upon completion.

### 3. Functional / E2E Testing
- **Frontend & Backend (E2E)**: Use `Playwright` or `Cypress` to run full browser-driven flows against a staging environment.
  - *Critical Path Flow*: The script logs in as a mock tenant -> navigates to the Viewer Dashboard -> enters the Configurator -> changes a slider -> waits for the visual "Loading" state -> intercepts the WebSocket notification -> verifies the canvas successfully intercepts the new `.glb` network request.

### 4. "Consultation" / Out-of-Bounds Workflow
- Not all customer requests can be parametrically generated. If an end-user needs a value outside the schema's predefined range (e.g., requiring 120" height when max is 60"), or requires highly complex custom geometry:
  - The UI seamlessly surfaces a **Consultation Component**.
  - The user inputs their custom requirements, potentially dropping pins/annotations on the 3D model, and submits a "Custom Engineering Request".
  - This captures the current state and alerts the tenant's product/tech team (via dashboard or webhook) to manually review and draft the 3D model offline.

---

## ⚡ Caching & Deduplication Strategy
Generating CAD models is computationally expensive. Deduplication ensures we never generate the same configuration twice, while strictly respecting tenant boundaries and client infrastructure preferences.
- **Tenant-Scoped Hashing**: To ensure cross-tenant data bleed never occurs, the hashing algorithm strictly salts the configuration with the `tenant_id` (e.g., `SHA-256(tenant_A_id + payload)`). Even if Tenant A and Tenant B request identical dimensional parameters, they will independently generate and cache their own models, protecting proprietary underlying geometries.
- **Configurable Caching & Master Toggles**: Caching behavior can be controlled at both the UI and Backend levels.
  - **Backend Master Flag**: The backend application configuration (e.g., via `.env` variable `ENABLE_GLOBAL_CACHING=false`) acts as the ultimate master toggle. This allows a client hosting their own backend to categorically turn off caching across their entire infrastructure (e.g., if they lack Redis), completely overriding any UI requests.
  - **Frontend Granular Control**: The React `<ConfiguratorViewer />` component exposes an `enableCaching={true|false}` prop, and the API accepts a `?useCache=false` flag. If the backend *allows* caching, the UI can still choose to opt out for specific workflows.
- **Redis Cache Workflow (When Enabled)**: 
  - **Hit**: The API returns the existing S3/CDN URL for that tenant-scoped hash instantly (0ms compute time).
  - **Miss**: The configuration job is queued. Once generated, the worker stores the resulting CDN URL backwards against the hash.

---

## Multi-Tenancy & Deployment Models
**(Retained from previous brainstorming)**
1. **Fully Managed SaaS**: We host the portal, handle logins, and provide isolated database schemas and S3 buckets per tenant.
2. **Plugin Mode (Bring-Your-Own-Backend)**: The `<ConfiguratorViewer />` acts as a "dumb" UI component hosted on client platforms, communicating securely with APIs via callbacks.

## Selected Architecture Stack
- **Frontend**: Next.js, React Three Fiber, `@react-three/drei`, Zustand, Service Workers.
- **Backend**: Python FastAPI (Primary) or Java Spring Boot (Secondary for Creo), Celery/Redis Queue, WebSockets.
- **Storage**: PostgreSQL (Hosted), SQLite (Local Dev), AWS S3 + CloudFront.

---

## 🗄️ Database Strategy & Environment Isolation
All SQL is version-controlled in the repository. The database setup is fully automated per environment, with zero manual steps for developers.

- **SQL in the Repo**: All schema DDL (`CREATE TABLE`, `ALTER TABLE`), RLS policies, and seed data live in a structured `db/` directory in the monorepo. This ensures migrations are tracked in Git history alongside the code that depends on them.
- **Migration Tool**: [**Flyway**](https://flywaydb.org/) (Java-friendly) or [**Alembic**](https://alembic.sqlalchemy.org/) (Python-friendly) runs on startup. The tool detects which migrations have been applied and idempotently migrates forward, never breaking a running service.
- **Local Development (Embedded/Docker)**: Developers run `docker compose up` to spin up a local PostgreSQL container. The migration tool automatically applies all scripts from `db/` and seeds initial data (industry templates, a demo tenant, sample models). No hosted credentials required.
- **Integration / Production (Hosted DB)**: The same migration scripts run against the hosted PostgreSQL instance (AWS RDS or equivalent) via CI/CD pipeline on deployment. The `DATABASE_URL` environment variable is the only switch distinguishing local from hosted — the application code is identical in both environments.
- **Initial Seed Data**: A dedicated `db/seeds/` folder provides sample data for local development: a default Super Admin account, example industry schema templates (Granite, Industrial), and a sample model record.

## Proposed Setup & Documentation Changes
1. **Codebase Split**: `@viewer-core` vs `saas-portal`.
2. **`db/` Directory**: `db/migrations/` for versioned SQL, `db/seeds/` for initial data.
3. **Developer Quickstart**: `docker compose up` — one command to get a fully migrated, seeded local stack with local model storage.
4. **Documentation Setup**: Dedicated `docs/` folder for Plugin Integration, API contracts, and Authentication setup.

---

## 📦 Model File Storage Abstraction
Model file storage is fully abstracted behind a `StorageProvider` interface, mirroring the database strategy. The environment configuration is the only switch between local and cloud.

- **`StorageProvider` Interface**: All backend services interact with a single storage abstraction (`upload()`, `getUrl()`, `delete()`). The concrete implementation — local disk or S3 — is injected via configuration.
- **`LOCAL` mode** (`STORAGE_PROVIDER=local`): Model files are served from a local directory (e.g., `storage/models/`). A lightweight static file server (e.g., FastAPI `StaticFiles`) exposes these files over HTTP so the frontend Viewer can load them identically to how it loads CDN URLs. Ideal for development, demos, and unit testing with zero cloud dependencies.
- **`S3` mode** (`STORAGE_PROVIDER=s3`): Model files upload to AWS S3, accessed via CloudFront CDN.
- **Sample Models in Repo**: A `storage/models/samples/` folder contains small, committed `.glb` sample models so developers immediately have content to render after `docker compose up`.
