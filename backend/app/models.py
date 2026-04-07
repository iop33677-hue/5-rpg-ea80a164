"""Database models for Arcane Class Quest."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    neon_user_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_number: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    access_code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    character_class: Mapped[str] = mapped_column(String(80), default="수호자")
    level: Mapped[int] = mapped_column(Integer, default=1)
    grade_tier: Mapped[str] = mapped_column(String(40), default="Bronze")
    badge_tier: Mapped[str] = mapped_column(String(40), default="입문")
    title: Mapped[str] = mapped_column(String(120), default="새싹 도전자")
    role_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    class_points: Mapped[int] = mapped_column(Integer, default=0)
    attack_power: Mapped[int] = mapped_column(Integer, default=8)
    defense_power: Mapped[int] = mapped_column(Integer, default=8)
    support_power: Mapped[int] = mapped_column(Integer, default=8)

    # Neo-Hanyang RPG progression fields
    total_exp: Mapped[int] = mapped_column(Integer, default=0)
    won_balance: Mapped[int] = mapped_column(Integer, default=0)
    nyang_balance: Mapped[int] = mapped_column(Integer, default=0)
    core_balance: Mapped[int] = mapped_column(Integer, default=0)
    starlight_shard_balance: Mapped[int] = mapped_column(Integer, default=0)

    wisdom: Mapped[int] = mapped_column(Integer, default=0)
    creativity: Mapped[int] = mapped_column(Integer, default=0)
    personality: Mapped[int] = mapped_column(Integer, default=0)
    vitality: Mapped[int] = mapped_column(Integer, default=0)
    diligence: Mapped[int] = mapped_column(Integer, default=0)
    communication: Mapped[int] = mapped_column(Integer, default=0)
    bonus_stat_points: Mapped[int] = mapped_column(Integer, default=0)

    base_attack: Mapped[int] = mapped_column(Integer, default=10)
    base_hp: Mapped[int] = mapped_column(Integer, default=100)
    base_crit_rate: Mapped[float] = mapped_column(Float, default=0.0)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CardEvent(Base):
    __tablename__ = "card_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    issuer_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(24), nullable=False)  # praise | warning
    stat_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    level_delta: Mapped[int] = mapped_column(Integer, default=0)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    teacher_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(24), nullable=False)  # deposit|withdraw
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    memo: Mapped[str | None] = mapped_column(String(240), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ShopItem(Base):
    __tablename__ = "shop_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    rarity: Mapped[str] = mapped_column(String(40), default="일반")
    description: Mapped[str | None] = mapped_column(String(260), nullable=True)
    cost_points: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ShopPurchase(Base):
    __tablename__ = "shop_purchases"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("shop_items.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    total_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ActivityCoupon(Base):
    __tablename__ = "activity_coupons"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(260), nullable=True)
    icon_emoji: Mapped[str] = mapped_column(String(16), default="🎟️")
    price_gold: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ActivityCouponPurchase(Base):
    __tablename__ = "activity_coupon_purchases"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    coupon_id: Mapped[int] = mapped_column(ForeignKey("activity_coupons.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    total_price_gold: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ActivityCouponUsage(Base):
    __tablename__ = "activity_coupon_usages"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    coupon_id: Mapped[int] = mapped_column(ForeignKey("activity_coupons.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    note: Mapped[str | None] = mapped_column(String(240), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class LearningBoard(Base):
    __tablename__ = "learning_boards"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class LearningBoardPost(Base):
    __tablename__ = "learning_board_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("learning_boards.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    image_object_key: Mapped[str | None] = mapped_column(String(600), nullable=True)
    image_original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class LearningBoardComment(Base):
    __tablename__ = "learning_board_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("learning_board_posts.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class LearningBoardLike(Base):
    __tablename__ = "learning_board_likes"
    __table_args__ = (
        UniqueConstraint("post_id", "student_id", name="uq_learning_board_post_student_like"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("learning_board_posts.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class FundingProject(Base):
    __tablename__ = "funding_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reward_plan: Mapped[str | None] = mapped_column(String(260), nullable=True)
    target_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    current_amount: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(24), default="active")
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class FundingContribution(Base):
    __tablename__ = "funding_contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("funding_projects.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class QuestionFile(Base):
    __tablename__ = "question_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    public_url: Mapped[str] = mapped_column(String(600), nullable=False)
    object_key: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class QuestionBankItem(Base):
    __tablename__ = "question_bank_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_file_id: Mapped[int | None] = mapped_column(
        ForeignKey("question_files.id"), nullable=True, index=True
    )
    subject: Mapped[str] = mapped_column(String(80), nullable=False)
    unit_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(String(200), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(40), default="보통")
    bonus_attack: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RaidSession(Base):
    __tablename__ = "raid_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    boss_name: Mapped[str] = mapped_column(String(120), nullable=False)
    boss_max_hp: Mapped[int] = mapped_column(Integer, nullable=False)
    boss_current_hp: Mapped[int] = mapped_column(Integer, nullable=False)
    class_max_hp: Mapped[int] = mapped_column(Integer, nullable=False)
    class_current_hp: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="scheduled")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RaidActionLog(Base):
    __tablename__ = "raid_action_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    raid_session_id: Mapped[int] = mapped_column(ForeignKey("raid_sessions.id"), index=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(120), nullable=False)
    action_type: Mapped[str] = mapped_column(String(40), nullable=False)
    damage: Mapped[int] = mapped_column(Integer, default=0)
    healing: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str] = mapped_column(String(280), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    pin_code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="lobby")  # lobby, playing, finished
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    is_question_open: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class QuizParticipant(Base):
    __tablename__ = "quiz_participants"
    __table_args__ = (
        UniqueConstraint("quiz_session_id", "student_id", name="uq_quiz_participant_session_student"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_session_id: Mapped[int] = mapped_column(ForeignKey("quiz_sessions.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_session_id: Mapped[int] = mapped_column(ForeignKey("quiz_sessions.id"), index=True)
    question_item_id: Mapped[int] = mapped_column(ForeignKey("question_bank_items.id"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    time_limit: Mapped[int] = mapped_column(Integer, default=20)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class QuizResponse(Base):
    __tablename__ = "quiz_responses"
    __table_args__ = (
        UniqueConstraint("quiz_question_id", "student_id", name="uq_quiz_response_question_student"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_session_id: Mapped[int] = mapped_column(ForeignKey("quiz_sessions.id"), index=True)
    quiz_question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    submitted_answer: Mapped[str] = mapped_column(String(200), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    response_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    score_earned: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GameWorldSetting(Base):
    __tablename__ = "game_world_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_name: Mapped[str] = mapped_column(String(120), nullable=False)
    world_name: Mapped[str] = mapped_column(String(120), nullable=False)
    art_style: Mapped[str] = mapped_column(String(200), nullable=False)
    primary_boss_name: Mapped[str] = mapped_column(String(120), nullable=False)
    secondary_boss_name: Mapped[str] = mapped_column(String(120), nullable=False)
    multiplayer_mode: Mapped[str] = mapped_column(String(80), nullable=False)
    max_level: Mapped[int] = mapped_column(Integer, default=999)
    target_level_one_year: Mapped[int] = mapped_column(Integer, default=800)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CurrencyRule(Base):
    __tablename__ = "currency_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    currency_code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    currency_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    acquisition_rule: Mapped[str] = mapped_column(String(260), nullable=False)
    spend_rule: Mapped[str] = mapped_column(String(260), nullable=False)
    base_unit_amount: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class LevelBracketRule(Base):
    __tablename__ = "level_bracket_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    start_level: Mapped[int] = mapped_column(Integer, nullable=False)
    end_level: Mapped[int] = mapped_column(Integer, nullable=False)
    exp_per_level: Mapped[int] = mapped_column(Integer, nullable=False)
    total_exp_for_bracket: Mapped[int] = mapped_column(Integer, nullable=False)
    growth_label: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class StatDefinition(Base):
    __tablename__ = "stat_definitions"

    id: Mapped[int] = mapped_column(primary_key=True)
    stat_key: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(260), nullable=False)
    auto_growth_per_level: Mapped[int] = mapped_column(Integer, default=1)
    allows_teacher_bonus: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CombatFormulaRule(Base):
    __tablename__ = "combat_formula_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_key: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    formula_text: Mapped[str] = mapped_column(String(260), nullable=False)
    base_value: Mapped[float] = mapped_column(Float, nullable=False)
    level_growth_value: Mapped[float] = mapped_column(Float, default=0.0)
    coefficient_a: Mapped[float] = mapped_column(Float, default=0.0)
    coefficient_b: Mapped[float] = mapped_column(Float, default=0.0)
    note: Mapped[str | None] = mapped_column(String(260), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


Student.card_events = relationship("CardEvent", backref="student", cascade="all,delete")
Student.bank_transactions = relationship(
    "BankTransaction", backref="student", cascade="all,delete"
)
Student.purchases = relationship("ShopPurchase", backref="student", cascade="all,delete")
Student.coupon_purchases = relationship(
    "ActivityCouponPurchase", backref="student", cascade="all,delete"
)
Student.coupon_usages = relationship(
    "ActivityCouponUsage", backref="student", cascade="all,delete"
)
Student.funding_contributions = relationship(
    "FundingContribution", backref="student", cascade="all,delete"
)
Student.learning_board_posts = relationship(
    "LearningBoardPost", backref="student", cascade="all,delete"
)
Student.learning_board_comments = relationship(
    "LearningBoardComment", backref="student", cascade="all,delete"
)
Student.learning_board_likes = relationship(
    "LearningBoardLike", backref="student", cascade="all,delete"
)
Student.raid_actions = relationship("RaidActionLog", backref="student", cascade="all,delete")

ShopItem.purchases = relationship("ShopPurchase", backref="item", cascade="all,delete")
ActivityCoupon.purchases = relationship(
    "ActivityCouponPurchase", backref="coupon", cascade="all,delete"
)
ActivityCoupon.usages = relationship(
    "ActivityCouponUsage", backref="coupon", cascade="all,delete"
)
LearningBoard.created_by_user = relationship("User")
LearningBoard.posts = relationship("LearningBoardPost", backref="board", cascade="all,delete")

LearningBoardPost.comments = relationship(
    "LearningBoardComment", backref="post", cascade="all,delete"
)
LearningBoardPost.likes = relationship("LearningBoardLike", backref="post", cascade="all,delete")

FundingProject.contributions = relationship(
    "FundingContribution", backref="project", cascade="all,delete"
)
QuestionFile.questions = relationship(
    "QuestionBankItem", backref="source_file", cascade="all,delete"
)
RaidSession.actions = relationship(
    "RaidActionLog", backref="raid_session", cascade="all,delete"
)
QuizSession.participants = relationship(
    "QuizParticipant", backref="quiz_session", cascade="all,delete"
)
QuizSession.questions = relationship(
    "QuizQuestion", backref="quiz_session", cascade="all,delete", order_by="QuizQuestion.order_index"
)
QuizSession.responses = relationship(
    "QuizResponse", backref="quiz_session", cascade="all,delete"
)
QuizQuestion.bank_item = relationship(
    "QuestionBankItem"
)
QuizQuestion.responses = relationship(
    "QuizResponse", backref="quiz_question", cascade="all,delete"
)
QuizParticipant.student = relationship(
    "Student"
)
QuizResponse.student = relationship(
    "Student"
)
