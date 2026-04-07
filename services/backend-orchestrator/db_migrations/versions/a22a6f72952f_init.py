"""init

Revision ID: a22a6f72952f
Revises: 
Create Date: 2026-03-23 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a22a6f72952f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE tenants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id),
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        schema JSONB NOT NULL,
        engine VARCHAR(50) DEFAULT 'freecad',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id),
        model_id UUID NOT NULL REFERENCES models(id),
        parameters JSONB NOT NULL,
        hash VARCHAR(255) NOT NULL UNIQUE,
        model_url VARCHAR(1024),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

def downgrade() -> None:
    op.execute("""
    DROP TABLE configurations;
    DROP TABLE models;
    DROP TABLE users;
    DROP TABLE tenants;
    """)
