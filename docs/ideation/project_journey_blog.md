# 🚀 Engineering Blog: Building the 3D SaaS Viewer

*A living document capturing the evolution, architectural pivots, and multi-agent development journey of our parametric 3D configurator platform.*

---

## 📖 Chapter 1: The Ideation and The Pivot
**Date**: March 2026

We began with a grand vision: a multi-tenant SaaS application allowing users to configure physical objects (like Granite Monuments or Automotive Parts) in real-time 3D, backed by industrial CAD engines.

Initially, we defined a monolithic implementation plan. However, realizing the massive risk of entangling complex PostgreSQL Row-Level Security (RLS), multi-tenant billing, and complex CAD generation all in one go, the Lead Architect staged a critical intervention: **The V2 Phased Approach**.

We completely rewrote `implementation_plan.md` and `task.md` to split the project into three phases:
- **Phase 1 (MVP)**: Prove the core async async pipeline (FastAPI -> Redis -> Celery -> FreeCAD -> WebSocket) over local infrastructure.
- **Phase 2 (SaaS)**: Activate RLS, S3 Storage, and Quota Management.
- **Phase 3 (Enterprise)**: Introduce Java/Creo workers and Glacier archiving.

To future-proof Phase 1 for Phase 2, we adopted the **"Tenant Zero" strategy**—writing `tenant_id` into all database tables from Day 1 to avoid breaking structural migrations later.

## 🤖 Chapter 2: The Multi-Agent Assembly Line
To accelerate development and enforce rigorous quality, we deployed a simulated 6-Agent AI Engineering Team:

- **Dev Alpha (Backend)**: Builds Python FastAPI, PostgreSQL schemas, and Celery pipelines.
- **Dev Beta (Frontend)**: Builds Next.js App Router UI, NextAuth, and React Three Fiber scenes.
- **Peer Reviewer Gamma (Backend QA)**: Audits Alpha for performance optimization.
- **Peer Reviewer Delta (Frontend QA)**: Audits Beta for UX and React lifecycle optimizations.
- **QA Agent Omega (E2E Tester)**: Conducts holistic product testing and throws rejected UX flows back into the feedback loop.
- **Code Reviewer (Lead Auth)**: Merges approved features into `main`.
- **Doc Agent Sigma (Historian)**: Captures the architectural state and team progress in this living blog.

## 🏗️ Chapter 3: MVP Foundations (Tasks 1.1 - 1.4)
The team executed a flawless sprint to stand up the foundation:

1. **Turborepo Monorepo**: Dev Alpha bootstrapped `apps/saas-portal` and `packages/viewer-core`.
2. **Database Foundation**: Dev Alpha wrote the Alembic migrations and seeded `tenant-0000`.
3. **SaaS Authentication**: Dev Beta implemented NextAuth.js. QA Omega rejected the first PR due to missing loading states and a strict TypeScript ESLint failure. Beta deployed the fix, achieving our first successful E2E CI/QA loop.
4. **Storage Abstraction**: Dev Alpha wrote the `StorageProvider` for local and S3 buckets. Peer Reviewer Gamma forced Alpha to rewrite the I/O operations from blocking synchronous calls to `asyncio.to_thread` to protect the FastAPI event loop.

## ⚖️ Chapter 4: Decoupling the Viewer
During the transition to Epic 2, the Lead Architect and the Product Owner (Human Stakeholder) identified a critical architectural requirement: The 3D Viewer must be capable of rendering models entirely independently of the Configurator. 

We updated the implementation plan to enforce a strict boundary: The Viewer is a standalone component driven purely by a declarative `modelUrl`. The Configurator is treated as an optional, loosely-coupled overlay that seamlessly wraps the Viewer only when parametric changes are requested. To support this, we added **Task 3.0: Standalone Model API** to the backend, enabling the frontend to fetch unconfigured base models instantly without engaging the heavy async CAD queue.

## 🚀 Chapter 5: Wiring the Orchestrator and the Frontend Viewer
**Date**: March 2026

With the architecture decoupled, **Dev Alpha** successfully engineered the complex Async Orchestrator (Epic 3). This required building deterministic `tenant_id` hash functions to hit the Redis Cache in `O(1)` time, and dispatching cache-misses directly into a newly minted RabbitMQ/Celery Python Worker pipeline (Epic 4). The CAD worker gracefully simulates blocking compute and handles local Storage upload callbacks. **Senior Architect Epsilon** performed an unbiased audit of the caching boundaries and approved the Epic.

Simultaneously, **Dev Beta** (Frontend) crossed over to **Epic 2** to build out the standalone `@viewer-core` React workspace. They compiled the foundational `<ViewerCanvas />` with aggressive HDRI lighting constraints, and implemented the progressive `<ViewerLoader />` using `@react-three/drei` and React `<Suspense>` to automatically decode Draco/Meshopt models on the fly. 

## 🔮 What's left for Phase 1 (MVP)?
To cross the MVP finish line and initiate E2E Playwright validation (Epic 6), the team must now execute:
1. **Task 2.3**: Hooking up the `zustand` configurator state to the 3D Viewer.
2. **Epic 5**: The Next.js SaaS portal UI to wrap the viewer and wire the sliders to the API.
3. **Tasks 3.4 & 4.2**: The actual Python FreeCAD/CadQuery parametric scripting inside the Celery worker, and the WebSocket gateway to push the finished model back to the user.

**QA Omega E2E Verification**: The automated blog UI testing was successful!