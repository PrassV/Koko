"""add payment structure to tenancy

Revision ID: a1b2c3d4e5f6
Revises: 36dbc248ebcc
Create Date: 2024-12-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '617079d99215'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add payment_structure column with default "RENT" for existing rows
    op.add_column('tenancies', sa.Column('payment_structure', sa.String(), nullable=False, server_default='RENT'))
    
    # Add lease_amount column
    op.add_column('tenancies', sa.Column('lease_amount', sa.Float(), nullable=True))
    
    # Make rent_amount nullable (it was NOT NULL before)
    op.alter_column('tenancies', 'rent_amount',
                    existing_type=sa.Float(),
                    nullable=True)
    
    # Add check constraint for mutual exclusivity
    # Note: This constraint ensures data integrity
    op.create_check_constraint(
        'check_payment_structure_amounts',
        'tenancies',
        "(payment_structure = 'LEASE' AND lease_amount IS NOT NULL AND rent_amount IS NULL) OR "
        "(payment_structure = 'RENT' AND rent_amount IS NOT NULL AND lease_amount IS NULL)"
    )


def downgrade() -> None:
    # Remove check constraint
    op.drop_constraint('check_payment_structure_amounts', 'tenancies', type_='check')
    
    # Make rent_amount NOT NULL again (may fail if NULLs exist)
    op.alter_column('tenancies', 'rent_amount',
                    existing_type=sa.Float(),
                    nullable=False)
    
    # Remove lease_amount column
    op.drop_column('tenancies', 'lease_amount')
    
    # Remove payment_structure column
    op.drop_column('tenancies', 'payment_structure')
