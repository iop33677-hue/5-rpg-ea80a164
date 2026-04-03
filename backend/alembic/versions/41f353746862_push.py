"""push

Revision ID: 41f353746862
Revises:
Create Date: 2026-04-01 00:27:46.677715

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "41f353746862"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline revision for an already-provisioned schema.
    # Intentionally no-op to avoid duplicate table creation.
    pass


def downgrade() -> None:
    # Baseline downgrade is intentionally a no-op.
    pass
