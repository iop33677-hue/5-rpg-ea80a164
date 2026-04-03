"""neo_hanyang_rpg_settings

Revision ID: 8d9f2e5e6d10
Revises: 41f353746862
Create Date: 2026-04-01 01:05:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8d9f2e5e6d10"
down_revision: Union[str, None] = "41f353746862"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("total_exp", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("won_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("nyang_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("core_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column(
        "students", sa.Column("starlight_shard_balance", sa.Integer(), nullable=False, server_default="0")
    )

    op.add_column("students", sa.Column("wisdom", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("creativity", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("personality", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("vitality", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("diligence", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("communication", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("students", sa.Column("bonus_stat_points", sa.Integer(), nullable=False, server_default="0"))

    op.add_column("students", sa.Column("base_attack", sa.Integer(), nullable=False, server_default="10"))
    op.add_column("students", sa.Column("base_hp", sa.Integer(), nullable=False, server_default="100"))
    op.add_column("students", sa.Column("base_crit_rate", sa.Float(), nullable=False, server_default="0"))

    op.create_table(
        "game_world_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_name", sa.String(length=120), nullable=False),
        sa.Column("world_name", sa.String(length=120), nullable=False),
        sa.Column("art_style", sa.String(length=200), nullable=False),
        sa.Column("primary_boss_name", sa.String(length=120), nullable=False),
        sa.Column("secondary_boss_name", sa.String(length=120), nullable=False),
        sa.Column("multiplayer_mode", sa.String(length=80), nullable=False),
        sa.Column("max_level", sa.Integer(), nullable=False, server_default="999"),
        sa.Column("target_level_one_year", sa.Integer(), nullable=False, server_default="800"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "currency_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("currency_code", sa.String(length=40), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("currency_kind", sa.String(length=40), nullable=False),
        sa.Column("acquisition_rule", sa.String(length=260), nullable=False),
        sa.Column("spend_rule", sa.String(length=260), nullable=False),
        sa.Column("base_unit_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("currency_code"),
    )

    op.create_table(
        "level_bracket_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("start_level", sa.Integer(), nullable=False),
        sa.Column("end_level", sa.Integer(), nullable=False),
        sa.Column("exp_per_level", sa.Integer(), nullable=False),
        sa.Column("total_exp_for_bracket", sa.Integer(), nullable=False),
        sa.Column("growth_label", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "stat_definitions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("stat_key", sa.String(length=40), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("description", sa.String(length=260), nullable=False),
        sa.Column("auto_growth_per_level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("allows_teacher_bonus", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stat_key"),
    )

    op.create_table(
        "combat_formula_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("metric_key", sa.String(length=40), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("formula_text", sa.String(length=260), nullable=False),
        sa.Column("base_value", sa.Float(), nullable=False),
        sa.Column("level_growth_value", sa.Float(), nullable=False, server_default="0"),
        sa.Column("coefficient_a", sa.Float(), nullable=False, server_default="0"),
        sa.Column("coefficient_b", sa.Float(), nullable=False, server_default="0"),
        sa.Column("note", sa.String(length=260), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("metric_key"),
    )


def downgrade() -> None:
    op.drop_table("combat_formula_rules")
    op.drop_table("stat_definitions")
    op.drop_table("level_bracket_rules")
    op.drop_table("currency_rules")
    op.drop_table("game_world_settings")

    op.drop_column("students", "base_crit_rate")
    op.drop_column("students", "base_hp")
    op.drop_column("students", "base_attack")
    op.drop_column("students", "bonus_stat_points")
    op.drop_column("students", "communication")
    op.drop_column("students", "diligence")
    op.drop_column("students", "vitality")
    op.drop_column("students", "personality")
    op.drop_column("students", "creativity")
    op.drop_column("students", "wisdom")
    op.drop_column("students", "starlight_shard_balance")
    op.drop_column("students", "core_balance")
    op.drop_column("students", "nyang_balance")
    op.drop_column("students", "won_balance")
    op.drop_column("students", "total_exp")
