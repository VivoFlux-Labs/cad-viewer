# 3D Viewer & Configurator SaaS

A multi-tenant SaaS platform and embeddable React component for interactive 3D model viewing and parametric configuration.

## 🚀 Quickstart: Local Integrated Environment (Docker)

The fastest and most robust way to spin up the entire application independently is using our local integrated Docker environment. This will automatically spin up PostgreSQL, run Alembic migrations, seed the `tenant-0000` demo data, start Redis, RabbitMQ, and route local storage.

### Prerequisites
- Node.js 18+ and `pnpm`
- Docker & Docker Compose
- Python 3.9+ (for backend worker development)

### 1. Spin up the Infrastructure
```bash
# Spins up PostgreSQL, Redis, RabbitMQ, and auto-runs Alembic migrations via Tenant Zero seed.
docker compose up -d
```

### 2. Start the Turborepo Application
```bash
pnpm install
# Starts the Next.js SaaS Portal and explicitly watches the @viewer-core package for HMR.
pnpm dev
```
Access the SaaS portal at `http://localhost:3000`. Login with:
- **Email**: `admin@cadviewer.local`
- **Password**: `password`

---

## ☁️ Production: Integrated Cloud Environment

When deploying to a production integrated environment, the architecture seamlessly shifts configurations without a single application code rewrite.

1. **Database Layer**: Point the `DATABASE_URL` environment variable to a hosted PostgreSQL instance (e.g., AWS RDS, Supabase).
   - *Critical Warning*: If using PgBouncer for connection pooling, it MUST run in **session mode**. Transaction mode will strip the Postgres context variables and permanently break the Row-Level Security (RLS) multi-tenancy isolation.
2. **Storage Layer**: Set `STORAGE_PROVIDER=s3` and configure `S3_BUCKET` and `CDN_DOMAIN` to securely serve CAD models via AWS CloudFront.
3. **Queue & Cache**: Point `CELERY_BROKER_URL` and `REDIS_URL` to managed instances (e.g., AWS ElastiCache, Amazon MQ).
4. **Vercel Frontend**: Deploy the `apps/saas-portal` directly to Vercel, ensuring the `NEXTAUTH_SECRET` is defined.

---

## 🕵️‍♂️ Validating Functionality (QA & Testing)

The multi-agent engineering team strictly enforces Test-Driven Development (TDD) and QA feedback loops. To validate functionality independently:

1. **Backend Unit Testing (TDD)**:
   ```bash
   cd services/backend-orchestrator
   source venv/bin/activate
   PYTHONPATH=. python -m pytest tests/
   ```
2. **Frontend E2E Suite**:
   *(Execution commands for Playwright will be documented here upon completion of Epic 2)*

## 🏗️ Architecture & Multi-Agent Workflows
Please refer to the `CONTEXT.md` file and the `project_journey_blog.md` artifact for deep-dives into architectural decisions, the Phased Rollout plan, and our multi-agent QA workflows connecting **Dev Alpha**, **Dev Beta**, **Peer Reviewers**, **QA Omega**, and the **Human Stakeholder Demo Loop**.
