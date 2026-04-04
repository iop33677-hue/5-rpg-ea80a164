from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    @model_validator(mode="before")
    @classmethod
    def reject_null_bytes(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str) and "\x00" in value:
                    raise ValueError(f"Null bytes are not allowed in field '{key}'")
        return data


class StudentBase(BaseSchema):
    student_number: int = Field(ge=1, le=50)
    name: str = Field(min_length=1, max_length=100)
    character_class: str = Field(default="수호자", max_length=80)
    level: int = Field(default=1, ge=1)
    grade_tier: str = Field(default="Bronze", max_length=40)
    badge_tier: str = Field(default="입문", max_length=40)
    title: str = Field(default="새싹 도전자", max_length=120)
    role_name: str | None = Field(default=None, max_length=80)
    avatar_url: str | None = None
    class_points: int = 0
    attack_power: int = Field(default=8, ge=0)
    defense_power: int = Field(default=8, ge=0)
    support_power: int = Field(default=8, ge=0)

    wisdom: int = Field(default=0, ge=0)
    creativity: int = Field(default=0, ge=0)
    personality: int = Field(default=0, ge=0)
    vitality: int = Field(default=0, ge=0)
    diligence: int = Field(default=0, ge=0)
    communication: int = Field(default=0, ge=0)

    notes: str | None = None


class StudentCreate(StudentBase):
    access_code: str = Field(min_length=4, max_length=24)


class StudentRead(StudentBase):
    id: int
    access_code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudentLoginAccountRead(BaseSchema):
    id: int
    student_number: int
    nickname: str
    pin_code: str


class PublicStudentLoginItemRead(BaseSchema):
    id: int
    student_number: int
    name: str
    title: str
    avatar_url: str | None


class PublicStudentLoginRequest(BaseSchema):
    student_id: int
    pin_code: str = Field(min_length=4, max_length=24)


class StudentSessionUserRead(BaseSchema):
    id: str
    email: str | None
    name: str
    role: str
    student_id: int


class PublicStudentLoginResponse(BaseSchema):
    token: str
    user: StudentSessionUserRead


class StudentLoginAccountCreate(BaseSchema):
    nickname: str | None = Field(default=None, min_length=1, max_length=100)


class StudentAccessCodeUpdate(BaseSchema):
    access_code: str = Field(min_length=4, max_length=24)


class StudentProfileUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_has_changes(self) -> "StudentProfileUpdate":
        if self.name is None:
            raise ValueError("name을 입력해야 합니다.")
        return self


class StudentStatRead(BaseSchema):
    key: str
    value: int


class StudentEconomyRead(BaseSchema):
    won: int
    nyang: int
    core: int
    starlight_shard: int
    total_exp: int
    current_exp: int
    max_exp: int


class StudentAdminEconomyUpdate(BaseSchema):
    total_exp: int | None = Field(default=None, ge=0)
    won_balance: int | None = Field(default=None, ge=0)
    nyang_balance: int | None = Field(default=None, ge=0)
    core_balance: int | None = Field(default=None, ge=0)
    starlight_shard_balance: int | None = Field(default=None, ge=0)

    wisdom: int | None = Field(default=None, ge=0)
    creativity: int | None = Field(default=None, ge=0)
    personality: int | None = Field(default=None, ge=0)
    vitality: int | None = Field(default=None, ge=0)
    diligence: int | None = Field(default=None, ge=0)
    communication: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_has_changes(self) -> "StudentAdminEconomyUpdate":
        if (
            self.total_exp is None
            and self.won_balance is None
            and self.nyang_balance is None
            and self.core_balance is None
            and self.starlight_shard_balance is None
            and self.wisdom is None
            and self.creativity is None
            and self.personality is None
            and self.vitality is None
            and self.diligence is None
            and self.communication is None
        ):
            raise ValueError("수정할 경험치/재화/스탯 값을 하나 이상 입력해야 합니다.")
        return self


class StudentActivityLogRead(BaseSchema):
    id: int
    student_id: int
    activity_type: str
    category: str
    log_type: str
    title: str
    description: str | None
    reward_won: int
    reward_nyang: int
    created_at: datetime


class StudentActivityCreate(BaseSchema):
    log_type: str = Field(pattern="^(mission|raid)$")
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=280)
    reward_won: int = Field(default=0, ge=0)
    reward_nyang: int = Field(default=0, ge=0)


class MissionAchieverRead(BaseSchema):
    student_id: int
    student_number: int
    student_name: str
    completion_count: int
    weekly_completion_count: int
    last_achieved_at: datetime


class MissionBase(BaseSchema):
    title: str = Field(min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=280)
    icon_key: str = Field(default="scroll", max_length=80)
    target_stat_key: str = Field(default="diligence", max_length=40)
    target_stat_label: str = Field(default="성실성", max_length=80)
    reward_exp: int = Field(default=0, ge=0, le=5000)
    reward_won: int = Field(default=0, ge=0, le=50000)
    reward_nyang: int = Field(default=0, ge=0, le=50000)
    repeatable: bool = False
    weekly_reset: bool = False
    goal_count: int = Field(default=1, ge=1, le=9999)


class MissionCreate(MissionBase):
    pass


class MissionUpdate(BaseSchema):
    title: str | None = Field(default=None, min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=280)
    icon_key: str | None = Field(default=None, max_length=80)
    target_stat_key: str | None = Field(default=None, max_length=40)
    target_stat_label: str | None = Field(default=None, max_length=80)
    reward_exp: int | None = Field(default=None, ge=0, le=5000)
    reward_won: int | None = Field(default=None, ge=0, le=50000)
    reward_nyang: int | None = Field(default=None, ge=0, le=50000)
    repeatable: bool | None = None
    weekly_reset: bool | None = None
    goal_count: int | None = Field(default=None, ge=1, le=9999)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_has_changes(self) -> "MissionUpdate":
        if (
            self.title is None
            and self.description is None
            and self.icon_key is None
            and self.target_stat_key is None
            and self.target_stat_label is None
            and self.reward_exp is None
            and self.reward_won is None
            and self.reward_nyang is None
            and self.repeatable is None
            and self.weekly_reset is None
            and self.goal_count is None
            and self.is_active is None
        ):
            raise ValueError("수정할 미션 정보를 하나 이상 입력해야 합니다.")
        return self


class MissionRead(MissionBase):
    id: int
    is_active: bool
    total_completion_count: int
    weekly_completion_count: int
    achiever_count: int
    progress_percent: float
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    achievers: list[MissionAchieverRead] = Field(default_factory=list)


class MissionAchieverAdd(BaseSchema):
    student_ids: list[int] = Field(min_length=1)


class MissionAchieverUpdateResult(BaseSchema):
    mission_id: int
    updated_count: int
    skipped_student_ids: list[int]


class StudentAvatarItemRead(BaseSchema):
    id: int
    student_id: int
    slot: str
    name: str
    rarity: str
    image_url: str | None
    bonus_diligence: int
    bonus_stamina: int
    bonus_intellect: int
    bonus_communication: int
    bonus_personality: int
    bonus_leadership: int
    is_owned: bool
    is_equipped: bool
    obtained_at: datetime


class StudentPhotoAssetCreate(BaseSchema):
    public_url: str
    object_key: str
    original_filename: str
    content_type: str | None = None


class StudentPhotoAssetRead(BaseSchema):
    id: int
    student_id: int
    public_url: str
    object_key: str
    original_filename: str
    content_type: str | None
    created_at: datetime


class TitleDefinitionBase(BaseSchema):
    title_name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    condition_text: str = Field(min_length=2, max_length=300)
    icon_key: str | None = Field(default=None, max_length=80)
    frame_key: str | None = Field(default=None, max_length=80)
    icon_public_url: str | None = Field(default=None, max_length=600)
    icon_object_key: str | None = Field(default=None, max_length=500)
    icon_original_filename: str | None = Field(default=None, max_length=255)
    icon_content_type: str | None = Field(default=None, max_length=120)
    reward_exp: int = Field(default=40, ge=0, le=5000)
    reward_won: int = Field(default=80, ge=0, le=50000)
    achievement_mode: Literal["manual", "auto"] = "manual"
    auto_condition_type: Literal["none", "card_issue_count", "stat_threshold"] = "none"
    condition_card_id: int | None = Field(default=None, ge=1)
    condition_stat_key: str | None = Field(default=None, max_length=40)
    condition_target_count: int | None = Field(default=None, ge=1, le=999999)
    is_active: bool = True

    @model_validator(mode="after")
    def validate_auto_condition(self) -> "TitleDefinitionBase":
        if self.achievement_mode == "manual":
            return self

        if self.auto_condition_type == "card_issue_count":
            if self.condition_card_id is None or self.condition_target_count is None:
                raise ValueError("자동 칭호(카드 횟수)는 카드 ID와 목표 횟수가 필요합니다.")
            return self

        if self.auto_condition_type == "stat_threshold":
            if not self.condition_stat_key or self.condition_target_count is None:
                raise ValueError("자동 칭호(스탯 도달)는 스탯 키와 목표 수치가 필요합니다.")
            return self

        raise ValueError("자동 칭호는 올바른 자동 달성 조건을 선택해야 합니다.")


class TitleDefinitionCreate(TitleDefinitionBase):
    pass


class TitleDefinitionUpdate(BaseSchema):
    title_name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    condition_text: str | None = Field(default=None, min_length=2, max_length=300)
    icon_key: str | None = Field(default=None, max_length=80)
    frame_key: str | None = Field(default=None, max_length=80)
    icon_public_url: str | None = Field(default=None, max_length=600)
    icon_object_key: str | None = Field(default=None, max_length=500)
    icon_original_filename: str | None = Field(default=None, max_length=255)
    icon_content_type: str | None = Field(default=None, max_length=120)
    reward_exp: int | None = Field(default=None, ge=0, le=5000)
    reward_won: int | None = Field(default=None, ge=0, le=50000)
    achievement_mode: Literal["manual", "auto"] | None = None
    auto_condition_type: Literal["none", "card_issue_count", "stat_threshold"] | None = None
    condition_card_id: int | None = Field(default=None, ge=1)
    condition_stat_key: str | None = Field(default=None, max_length=40)
    condition_target_count: int | None = Field(default=None, ge=1, le=999999)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_has_changes(self) -> "TitleDefinitionUpdate":
        if (
            self.title_name is None
            and self.description is None
            and self.condition_text is None
            and self.icon_key is None
            and self.frame_key is None
            and self.icon_public_url is None
            and self.icon_object_key is None
            and self.icon_original_filename is None
            and self.icon_content_type is None
            and self.reward_exp is None
            and self.reward_won is None
            and self.achievement_mode is None
            and self.auto_condition_type is None
            and self.condition_card_id is None
            and self.condition_stat_key is None
            and self.condition_target_count is None
            and self.is_active is None
        ):
            raise ValueError("수정할 칭호 정보를 하나 이상 입력해야 합니다.")

        next_mode = self.achievement_mode
        if next_mode == "auto":
            next_condition_type = self.auto_condition_type
            if next_condition_type == "card_issue_count":
                if self.condition_card_id is None or self.condition_target_count is None:
                    raise ValueError("자동 칭호(카드 횟수)는 카드 ID와 목표 횟수가 필요합니다.")
            elif next_condition_type == "stat_threshold":
                if not self.condition_stat_key or self.condition_target_count is None:
                    raise ValueError("자동 칭호(스탯 도달)는 스탯 키와 목표 수치가 필요합니다.")
            elif next_condition_type is not None:
                raise ValueError("자동 칭호는 올바른 자동 달성 조건을 선택해야 합니다.")

        return self


class TitleDefinitionRead(TitleDefinitionBase):
    id: int
    recipient_count: int = 0
    created_at: datetime
    updated_at: datetime


class StudentTitleGrantCreate(BaseSchema):
    awarded_reason: str | None = Field(default=None, max_length=260)


class StudentTitleIssueCreate(BaseSchema):
    student_ids: list[int] = Field(min_length=1)
    awarded_reason: str | None = Field(default=None, max_length=260)
    reward_exp: int | None = Field(default=None, ge=0, le=5000)
    reward_won: int | None = Field(default=None, ge=0, le=50000)


class StudentTitleIssueResult(BaseSchema):
    title_definition_id: int
    issued_count: int
    skipped_student_ids: list[int]


class StudentTitleRecipientRead(BaseSchema):
    student_id: int
    student_number: int
    student_name: str
    level: int


class StudentTitleRead(BaseSchema):
    id: int
    student_id: int
    title_definition_id: int
    title_name: str
    description: str | None
    condition_text: str
    icon_key: str | None = None
    frame_key: str | None = None
    icon_public_url: str | None = None
    awarded_reason: str | None
    awarded_at: datetime
    is_selected: bool


class StudentDetailRead(BaseSchema):
    student: StudentRead
    stats: list[StudentStatRead]
    economy: StudentEconomyRead
    activities: list[StudentActivityLogRead]
    avatars: list[StudentAvatarItemRead]
    photos: list[StudentPhotoAssetRead]
    available_titles: list[TitleDefinitionRead]
    earned_titles: list[StudentTitleRead]
    can_manage_economy: bool = False


class CardStatAdjustment(BaseSchema):
    stat_key: str = Field(min_length=1, max_length=40)
    stat_label: str = Field(min_length=1, max_length=80)
    delta: int = Field(ge=1, le=20)


class ClassroomCardBase(BaseSchema):
    card_type: str = Field(pattern="^(praise|warning)$")
    title: str = Field(min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=320)
    icon_key: str = Field(default="heart", max_length=80)
    category: str = Field(default="전체", max_length=80)
    reward_exp: int = Field(default=0, ge=0, le=5000)
    reward_won: int = Field(default=0, ge=0, le=50000)
    reward_nyang: int = Field(default=0, ge=0, le=50000)
    level_delta: int = Field(default=0, ge=0, le=10)
    stat_changes: list[CardStatAdjustment] = Field(default_factory=list, max_length=8)


class ClassroomCardCreate(ClassroomCardBase):
    pass


class ClassroomCardUpdate(BaseSchema):
    title: str | None = Field(default=None, min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=320)
    icon_key: str | None = Field(default=None, max_length=80)
    category: str | None = Field(default=None, max_length=80)
    reward_exp: int | None = Field(default=None, ge=0, le=5000)
    reward_won: int | None = Field(default=None, ge=0, le=50000)
    reward_nyang: int | None = Field(default=None, ge=0, le=50000)
    level_delta: int | None = Field(default=None, ge=0, le=10)
    stat_changes: list[CardStatAdjustment] | None = Field(default=None, max_length=8)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_has_changes(self) -> "ClassroomCardUpdate":
        if (
            self.title is None
            and self.description is None
            and self.icon_key is None
            and self.category is None
            and self.reward_exp is None
            and self.reward_won is None
            and self.reward_nyang is None
            and self.level_delta is None
            and self.stat_changes is None
            and self.is_active is None
        ):
            raise ValueError("수정할 카드 정보를 하나 이상 입력해야 합니다.")
        return self


class ClassroomCardRead(ClassroomCardBase):
    id: int
    is_active: bool
    recipient_count: int
    total_issued: int
    created_at: datetime
    updated_at: datetime


class ClassroomCardIssueCreate(BaseSchema):
    student_ids: list[int] = Field(min_length=1)
    issued_note: str | None = Field(default=None, max_length=260)


class ClassroomCardRecipientRead(BaseSchema):
    student_id: int
    student_number: int
    student_name: str
    issued_count: int


class ClassroomCardIssueHistoryRead(BaseSchema):
    issue_id: int
    card_id: int
    student_id: int
    student_number: int
    student_name: str
    issued_note: str | None
    issued_at: datetime


class ClassroomCardIssueResult(BaseSchema):
    card_id: int
    issued_count: int
    skipped_student_ids: list[int]


class ClassroomCardHistoryResponse(BaseSchema):
    card_id: int
    recipients: list[ClassroomCardRecipientRead]
    history: list[ClassroomCardIssueHistoryRead]


class CardEventCreate(BaseSchema):
    event_type: str = Field(pattern="^(praise|warning)$")
    stat_delta: int = Field(ge=1, le=100)
    level_delta: int = Field(default=0, ge=-3, le=3)
    reason: str = Field(min_length=2, max_length=200)


class CardEventRead(BaseSchema):
    id: int
    student_id: int
    event_type: str
    stat_delta: int
    level_delta: int
    reason: str
    created_at: datetime


class BankTransactionCreate(BaseSchema):
    transaction_type: str = Field(pattern="^(deposit|withdraw)$")
    amount: int = Field(gt=0, le=5000)
    memo: str | None = Field(default=None, max_length=240)


class BankTransactionRead(BaseSchema):
    id: int
    student_id: int
    transaction_type: str
    amount: int
    memo: str | None
    created_at: datetime


class ShopItemCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=1, max_length=60)
    rarity: str = Field(default="일반", max_length=40)
    description: str | None = Field(default=None, max_length=260)
    cost_points: int = Field(gt=0, le=10000)
    stock: int = Field(ge=0, le=999)


class ShopItemRead(BaseSchema):
    id: int
    name: str
    category: str
    rarity: str
    description: str | None
    cost_points: int
    stock: int
    is_active: bool


class ShopPurchaseCreate(BaseSchema):
    student_id: int
    item_id: int
    quantity: int = Field(default=1, ge=1, le=10)


class ShopPurchaseRead(BaseSchema):
    id: int
    student_id: int
    item_id: int
    quantity: int
    total_cost: int
    created_at: datetime


class ActivityCouponCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    icon_emoji: str = Field(default="🎟️", min_length=1, max_length=16)
    price_gold: int = Field(gt=0, le=100000)
    stock: int = Field(ge=0, le=9999)
    is_active: bool = True


class ActivityCouponUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    icon_emoji: str | None = Field(default=None, min_length=1, max_length=16)
    price_gold: int | None = Field(default=None, gt=0, le=100000)
    stock: int | None = Field(default=None, ge=0, le=9999)
    is_active: bool | None = None


class ActivityCouponRead(BaseSchema):
    id: int
    name: str
    description: str | None
    icon_emoji: str
    price_gold: int
    stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ActivityCouponPurchaseCreate(BaseSchema):
    student_id: int
    coupon_id: int
    quantity: int = Field(default=1, ge=1, le=20)


class ActivityCouponPurchaseRead(BaseSchema):
    id: int
    student_id: int
    coupon_id: int
    quantity: int
    total_price_gold: int
    created_at: datetime


class ActivityCouponUsageCreate(BaseSchema):
    student_id: int
    coupon_id: int
    quantity: int = Field(default=1, ge=1, le=20)
    note: str | None = Field(default=None, max_length=240)


class ActivityCouponUsageRead(BaseSchema):
    id: int
    student_id: int
    coupon_id: int
    quantity: int
    note: str | None
    created_at: datetime


class StudentCouponInventoryRow(BaseSchema):
    coupon_id: int
    coupon_name: str
    icon_emoji: str
    purchased_quantity: int
    used_quantity: int
    remaining_quantity: int


class CouponLedgerEntryRead(BaseSchema):
    entry_type: Literal['purchase', 'usage']
    coupon_id: int
    coupon_name: str
    icon_emoji: str
    student_id: int
    student_number: int
    student_name: str
    quantity: int
    amount_gold: int
    note: str | None
    created_at: datetime


class FundingProjectCreate(BaseSchema):
    title: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=1200)
    reward_plan: str | None = Field(default=None, max_length=260)
    target_amount: int = Field(gt=0, le=5000000)


class FundingProjectUpdate(BaseSchema):
    title: str | None = Field(default=None, min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=1200)
    reward_plan: str | None = Field(default=None, max_length=260)
    target_amount: int | None = Field(default=None, gt=0, le=5000000)
    status: Literal['active', 'completed', 'closed'] | None = None


class FundingProjectRead(BaseSchema):
    id: int
    title: str
    description: str | None
    reward_plan: str | None
    target_amount: int
    current_amount: int
    status: str
    progress_percent: float
    contributor_count: int
    contribution_count: int
    created_at: datetime
    updated_at: datetime


class FundingContributionCreate(BaseSchema):
    student_id: int
    amount: int = Field(gt=0, le=100000)


class FundingContributionRead(BaseSchema):
    id: int
    project_id: int
    student_id: int
    student_number: int
    student_name: str
    amount: int
    created_at: datetime


class FundingProjectDetailRead(BaseSchema):
    project: FundingProjectRead
    contributions: list[FundingContributionRead]


class QuestionFileCreate(BaseSchema):
    public_url: str
    object_key: str
    original_filename: str
    content_type: str | None = None


class QuestionFileRead(BaseSchema):
    id: int
    public_url: str
    object_key: str
    original_filename: str
    content_type: str | None
    created_at: datetime


class QuestionRow(BaseSchema):
    subject: str = Field(min_length=1, max_length=80)
    unit_name: str | None = Field(default=None, max_length=120)
    prompt: str = Field(min_length=5)
    answer: str = Field(min_length=1, max_length=200)
    difficulty: str = Field(default="보통", max_length=40)
    bonus_attack: int = Field(default=5, ge=0, le=100)


class QuestionBulkCreate(BaseSchema):
    source_file_id: int | None = None
    rows: list[QuestionRow]


class QuestionRead(BaseSchema):
    id: int
    source_file_id: int | None
    subject: str
    unit_name: str | None
    prompt: str
    answer: str
    difficulty: str
    bonus_attack: int
    is_active: bool


class RaidSessionCreate(BaseSchema):
    title: str = Field(min_length=2, max_length=120)
    boss_name: str = Field(min_length=2, max_length=120)
    boss_max_hp: int = Field(gt=0, le=999999)
    class_max_hp: int = Field(gt=0, le=999999)


class RaidStateUpdate(BaseSchema):
    boss_current_hp: int = Field(ge=0)
    class_current_hp: int = Field(ge=0)
    status: str = Field(pattern="^(scheduled|active|paused|completed)$")


class RaidActionCreate(BaseSchema):
    student_id: int | None = None
    actor_name: str = Field(min_length=1, max_length=120)
    action_type: str = Field(min_length=1, max_length=40)
    damage: int = Field(default=0, ge=0, le=9999)
    healing: int = Field(default=0, ge=0, le=9999)
    message: str = Field(min_length=2, max_length=280)


class RaidSessionRead(BaseSchema):
    id: int
    title: str
    boss_name: str
    boss_max_hp: int
    boss_current_hp: int
    class_max_hp: int
    class_current_hp: int
    status: str
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime


class RaidActionRead(BaseSchema):
    id: int
    raid_session_id: int
    student_id: int | None
    actor_name: str
    action_type: str
    damage: int
    healing: int
    message: str
    created_at: datetime


class ClassroomOverview(BaseSchema):
    total_students: int
    active_students: int
    average_level: float
    total_points: int
    total_questions: int
    active_raid_id: int | None


class StudentPortalSnapshot(BaseSchema):
    student: StudentRead
    active_raid: RaidSessionRead | None
