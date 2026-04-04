from __future__ import annotations

import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    ActivityCoupon,
    ActivityCouponPurchase,
    ActivityCouponUsage,
    BankTransaction,
    CardEvent,
    FundingContribution,
    FundingProject,
    QuestionBankItem,
    QuestionFile,
    RaidActionLog,
    RaidSession,
    ShopItem,
    ShopPurchase,
    Student,
)
from app.schemas import (
    ActivityCouponCreate,
    ActivityCouponPurchaseCreate,
    ActivityCouponPurchaseRead,
    ActivityCouponRead,
    ActivityCouponUpdate,
    ActivityCouponUsageCreate,
    ActivityCouponUsageRead,
    BankTransactionCreate,
    BankTransactionRead,
    CardEventCreate,
    CardEventRead,
    ClassroomCardCreate,
    ClassroomCardHistoryResponse,
    ClassroomCardIssueCreate,
    ClassroomCardIssueHistoryRead,
    ClassroomCardIssueResult,
    ClassroomCardRead,
    ClassroomCardRecipientRead,
    ClassroomCardUpdate,
    ClassroomOverview,
    CouponLedgerCancelRead,
    CouponLedgerEntryRead,
    FundingContributionCreate,
    FundingContributionRead,
    FundingProjectCreate,
    FundingProjectDetailRead,
    FundingProjectRead,
    FundingProjectUpdate,
    QuestionBulkCreate,
    QuestionFileCreate,
    QuestionFileRead,
    QuestionRead,
    RaidActionCreate,
    RaidActionRead,
    RaidSessionCreate,
    RaidSessionRead,
    RaidStateUpdate,
    MissionAchieverAdd,
    MissionAchieverRead,
    MissionAchieverUpdateResult,
    MissionCreate,
    MissionRead,
    MissionUpdate,
    PublicStudentLoginItemRead,
    PublicStudentLoginRequest,
    PublicStudentLoginResponse,
    ShopItemCreate,
    ShopItemRead,
    ShopPurchaseCreate,
    ShopPurchaseRead,
    StudentActivityCreate,
    StudentActivityLogRead,
    StudentAccessCodeUpdate,
    StudentAdminEconomyUpdate,
    StudentAvatarItemRead,
    StudentCouponInventoryRow,
    StudentCreate,
    StudentDetailRead,
    StudentEconomyRead,
    StudentLoginAccountCreate,
    StudentLoginAccountRead,
    StudentPhotoAssetCreate,
    StudentPhotoAssetRead,
    StudentPortalSnapshot,
    StudentProfileUpdate,
    StudentRead,
    StudentStatRead,
    StudentTitleGrantCreate,
    StudentTitleIssueCreate,
    StudentTitleIssueResult,
    StudentTitleRead,
    StudentTitleRecipientRead,
    TitleDefinitionCreate,
    TitleDefinitionRead,
    TitleDefinitionUpdate,
)

router = APIRouter(prefix="/classroom", tags=["classroom"])
classroom_security = HTTPBearer(auto_error=False)


def require_classroom_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(classroom_security),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    if credentials is None or not (credentials.credentials or "").strip():
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = credentials.credentials.strip()
    if token.startswith("student:"):
        parts = token.split(":", 2)
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid or expired session token")

        _, student_id_raw, pin_code = parts
        try:
            student_id = int(student_id_raw)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail="Invalid or expired session token") from exc

        student = (
            db.query(Student)
            .filter(Student.id == student_id, Student.is_active.is_(True))
            .first()
        )
        if not student or student.access_code != pin_code:
            raise HTTPException(status_code=401, detail="Invalid or expired session token")

        return {
            "sub": f"student-{student.id}",
            "id": f"student-{student.id}",
            "email": None,
            "name": student.name,
            "role": "student",
            "auth_type": "student_pin",
            "student_id": student.id,
        }

    return get_current_user(credentials=credentials, db=db)


def require_auth(
    auth_payload: dict[str, object] = Depends(require_classroom_auth),
) -> dict[str, object]:
    return auth_payload


EXP_BRACKETS: list[tuple[int, int, int]] = [
    (1, 200, 20),
    (201, 400, 40),
    (401, 600, 60),
    (601, 800, 80),
    (801, 999, 120),
]

ADMIN_OVERRIDE_EMAILS = {
    "admin@arcaneclass.quest",
    "iop3367@naver.com",
}

ACTIVITY_LABELS: dict[str, str] = {
    "mission": "미션",
    "praise_card": "칭찬카드",
    "warning_card": "주의카드",
    "title": "칭호",
    "raid": "레이드기록",
}

AUTO_TITLE_STAT_FIELDS = {
    "wisdom",
    "creativity",
    "personality",
    "vitality",
    "diligence",
    "communication",
}


def _current_user_id(auth_payload: dict[str, object]) -> int | None:
    value = auth_payload.get("app_user_id")
    return value if isinstance(value, int) else None


def _normalized_role(auth_payload: dict[str, object]) -> str:
    role = auth_payload.get("role")
    if not isinstance(role, str):
        return ""
    return role.strip().lower()


def _normalized_email(auth_payload: dict[str, object]) -> str:
    email = auth_payload.get("email")
    if not isinstance(email, str):
        return ""
    return email.strip().lower()


def _has_teacher_mode_access(auth_payload: dict[str, object]) -> bool:
    if auth_payload.get("auth_type") == "student_pin":
        return False

    role = _normalized_role(auth_payload)
    if role in {"admin", "teacher"}:
        return True

    email = _normalized_email(auth_payload)
    if email in ADMIN_OVERRIDE_EMAILS:
        return True

    return isinstance(auth_payload.get("sub"), str)


def _can_manage_student_economy(auth_payload: dict[str, object], student: Student) -> bool:
    if _has_teacher_mode_access(auth_payload):
        return True

    app_user_id = _current_user_id(auth_payload)
    return app_user_id is not None and student.created_by_user_id == app_user_id


def _require_student_economy_permission(auth_payload: dict[str, object], student: Student) -> None:
    if not _can_manage_student_economy(auth_payload, student):
        raise HTTPException(status_code=403, detail="해당 학생의 경험치/재화/스탯 수정 권한이 없습니다.")


def _student_session_student_id(auth_payload: dict[str, object]) -> int | None:
    if auth_payload.get("auth_type") != "student_pin":
        return None
    value = auth_payload.get("student_id")
    return value if isinstance(value, int) else None


def _require_student_self_or_teacher(auth_payload: dict[str, object], target_student_id: int) -> None:
    if _has_teacher_mode_access(auth_payload):
        return

    student_id = _student_session_student_id(auth_payload)
    if student_id is None:
        raise HTTPException(status_code=403, detail="학생 상세정보에 접근할 권한이 없습니다.")

    # 학생 PIN 로그인 사용자는 다른 학생의 상세정보를 열람할 수 있지만,
    # 수정 권한은 별도 self-edit 가드에서 본인에게만 허용한다.
    _ = target_student_id
    return


def _require_student_self_edit_or_teacher(
    auth_payload: dict[str, object],
    target_student_id: int,
) -> None:
    if _has_teacher_mode_access(auth_payload):
        return

    student_id = _student_session_student_id(auth_payload)
    if student_id is None:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    if student_id != target_student_id:
        raise HTTPException(status_code=403, detail="PIN으로 로그인한 학생은 본인 정보만 수정할 수 있습니다.")


def _can_manage_titles(auth_payload: dict[str, object]) -> bool:
    return _has_teacher_mode_access(auth_payload)


def _require_title_management_permission(auth_payload: dict[str, object]) -> None:
    if not _can_manage_titles(auth_payload):
        raise HTTPException(status_code=403, detail="칭호 조건은 관리자/교사만 관리할 수 있습니다.")


def _exp_per_level_for_level(level: int) -> int:
    clamped_level = min(max(level, 1), 999)
    for start_level, end_level, exp_per_level in EXP_BRACKETS:
        if start_level <= clamped_level <= end_level:
            return exp_per_level
    return EXP_BRACKETS[-1][2]


def _exp_to_reach_level(level: int) -> int:
    if level <= 1:
        return 0

    target_level = min(level, 1000)
    total = 0
    for start_level, end_level, exp_per_level in EXP_BRACKETS:
        bracket_end_for_gain = min(end_level, target_level - 1)
        if bracket_end_for_gain < start_level:
            continue
        level_up_count = bracket_end_for_gain - start_level + 1
        total += level_up_count * exp_per_level
    return total


def _level_from_total_exp(total_exp: int) -> int:
    if total_exp <= 0:
        return 1

    exp_left = total_exp
    current_level = 1

    for start_level, end_level, exp_per_level in EXP_BRACKETS:
        for _ in range(start_level, end_level + 1):
            if current_level >= 999:
                return 999
            if exp_left < exp_per_level:
                return current_level
            exp_left -= exp_per_level
            current_level += 1

    return 999


def _parse_notes(student: Student) -> dict[str, object]:
    if not student.notes:
        return {}

    try:
        parsed = json.loads(student.notes)
    except json.JSONDecodeError:
        return {}

    return parsed if isinstance(parsed, dict) else {}


def _save_notes(student: Student, notes: dict[str, object]) -> None:
    student.notes = json.dumps(notes, ensure_ascii=False)


def _next_embedded_id(items: list[dict[str, object]]) -> int:
    max_id = 0
    for item in items:
        candidate = item.get("id")
        if isinstance(candidate, int):
            max_id = max(max_id, candidate)
    return max_id + 1


def _default_title_definitions() -> list[dict[str, object]]:
    now_iso = datetime.now(UTC).isoformat()
    return [
        {
            "id": 1,
            "title_name": "새싹 도전자",
            "description": "기본으로 선택할 수 있는 시작 칭호",
            "condition_text": "기본 칭호",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": 2,
            "title_name": "협동의 수호자",
            "description": "팀 프로젝트에 꾸준히 기여한 학생",
            "condition_text": "협동 미션 5회 완료",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": 3,
            "title_name": "성실한 기록자",
            "description": "학습 기록을 성실히 남긴 학생",
            "condition_text": "미션 및 학습 활동 10회 달성",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]


def _default_avatar_items(student: Student) -> list[dict[str, object]]:
    return [
        {
            "id": 1,
            "slot": "face",
            "name": "기본 얼굴",
            "rarity": "일반",
            "image_url": student.avatar_url,
            "bonus_diligence": 1,
            "bonus_stamina": 0,
            "bonus_intellect": 1,
            "bonus_communication": 0,
            "bonus_personality": 0,
            "bonus_leadership": 0,
            "is_owned": True,
            "is_equipped": True,
            "obtained_at": datetime.now(UTC).isoformat(),
        },
        {
            "id": 2,
            "slot": "face",
            "name": "집중 모드 얼굴",
            "rarity": "희귀",
            "image_url": None,
            "bonus_diligence": 2,
            "bonus_stamina": 1,
            "bonus_intellect": 1,
            "bonus_communication": 0,
            "bonus_personality": 0,
            "bonus_leadership": 1,
            "is_owned": True,
            "is_equipped": False,
            "obtained_at": datetime.now(UTC).isoformat(),
        },
    ]


def _embedded_avatars(student: Student, notes: dict[str, object]) -> list[dict[str, object]]:
    avatars = notes.get("avatars")
    if isinstance(avatars, list):
        normalized: list[dict[str, object]] = [item for item in avatars if isinstance(item, dict)]
        if normalized:
            return normalized

    generated = _default_avatar_items(student)
    notes["avatars"] = generated
    return generated


def _embedded_photos(notes: dict[str, object]) -> list[dict[str, object]]:
    photos = notes.get("photos")
    if not isinstance(photos, list):
        return []
    return [item for item in photos if isinstance(item, dict)]


def _embedded_custom_activities(notes: dict[str, object]) -> list[dict[str, object]]:
    activities = notes.get("custom_activities")
    if not isinstance(activities, list):
        return []
    return [item for item in activities if isinstance(item, dict)]


def _append_custom_activity(notes: dict[str, object], payload: dict[str, object]) -> None:
    custom_activities = _embedded_custom_activities(notes)
    custom_activities.insert(0, {"id": _next_embedded_id(custom_activities), **payload})
    notes["custom_activities"] = custom_activities


def _current_week_key() -> str:
    now = datetime.now(UTC)
    iso = now.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _embedded_missions(notes: dict[str, object]) -> list[dict[str, object]]:
    missions = notes.get("missions")
    if not isinstance(missions, list):
        return []
    return [item for item in missions if isinstance(item, dict)]


def _embedded_mission_achievements(notes: dict[str, object]) -> list[dict[str, object]]:
    achievements = notes.get("mission_achievements")
    if not isinstance(achievements, list):
        return []
    return [item for item in achievements if isinstance(item, dict)]


def _default_missions() -> list[dict[str, object]]:
    now_iso = datetime.now(UTC).isoformat()
    return [
        {
            "id": 1,
            "title": "아침 자율학습 완수",
            "description": "아침 자율학습 과제를 기한 내 제출합니다.",
            "icon_key": "scroll",
            "target_stat_key": "diligence",
            "target_stat_label": "성실성",
            "reward_exp": 30,
            "reward_won": 50,
            "reward_nyang": 0,
            "repeatable": True,
            "weekly_reset": True,
            "goal_count": 10,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
            "closed_at": None,
        },
        {
            "id": 2,
            "title": "협동 발표 리더",
            "description": "팀 발표를 주도하고 피드백을 반영합니다.",
            "icon_key": "users",
            "target_stat_key": "communication",
            "target_stat_label": "의사소통",
            "reward_exp": 45,
            "reward_won": 80,
            "reward_nyang": 10,
            "repeatable": False,
            "weekly_reset": False,
            "goal_count": 1,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
            "closed_at": None,
        },
    ]


def _get_mission_registry_student(db: Session) -> Student | None:
    return db.query(Student).order_by(asc(Student.id)).first()


def _get_class_missions(db: Session) -> list[dict[str, object]]:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        return []

    notes = _parse_notes(registry_student)
    missions = _embedded_missions(notes)
    if missions:
        return missions

    missions = _default_missions()
    notes["missions"] = missions
    if not isinstance(notes.get("mission_achievements"), list):
        notes["mission_achievements"] = []
    _save_notes(registry_student, notes)
    db.commit()
    return missions


def _set_class_missions(db: Session, missions: list[dict[str, object]]) -> None:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        raise HTTPException(status_code=400, detail="미션을 저장하려면 최소 1명의 학생이 필요합니다.")

    notes = _parse_notes(registry_student)
    notes["missions"] = missions
    if not isinstance(notes.get("mission_achievements"), list):
        notes["mission_achievements"] = []
    _save_notes(registry_student, notes)


def _get_mission_achievements(db: Session) -> list[dict[str, object]]:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        return []

    notes = _parse_notes(registry_student)
    return _embedded_mission_achievements(notes)


def _set_mission_achievements(db: Session, achievements: list[dict[str, object]]) -> None:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        raise HTTPException(status_code=400, detail="미션 기록을 저장하려면 최소 1명의 학생이 필요합니다.")

    notes = _parse_notes(registry_student)
    notes["mission_achievements"] = achievements
    if not isinstance(notes.get("missions"), list):
        notes["missions"] = _default_missions()
    _save_notes(registry_student, notes)


def _build_mission_reads(db: Session, include_inactive: bool = False) -> list[MissionRead]:
    missions = _get_class_missions(db)
    achievements = _get_mission_achievements(db)
    students = {student.id: student for student in db.query(Student).all()}
    total_students = max(1, len(students))
    current_week_key = _current_week_key()

    mission_rows: list[MissionRead] = []

    for mission in missions:
        mission_id = int(mission.get("id", 0))
        if mission_id <= 0:
            continue

        is_active = mission.get("is_active") is not False
        if not include_inactive and not is_active:
            continue

        repeatable = mission.get("repeatable") is True
        weekly_reset = mission.get("weekly_reset") is True
        goal_count = max(1, int(mission.get("goal_count", 1)))

        related = [
            row for row in achievements if int(row.get("mission_id", 0)) == mission_id
        ]

        achievers: list[MissionAchieverRead] = []
        total_completion_count = 0
        weekly_completion_count = 0
        achiever_count = 0

        for row in related:
            student_id = int(row.get("student_id", 0))
            student = students.get(student_id)
            if not student:
                continue

            completion_count = max(0, int(row.get("completion_count", 0)))
            stored_week_key = str(row.get("week_key", ""))
            weekly_count = max(0, int(row.get("weekly_completion_count", 0)))

            if weekly_reset and stored_week_key != current_week_key:
                weekly_count = 0

            total_completion_count += completion_count
            weekly_completion_count += weekly_count
            if completion_count > 0:
                achiever_count += 1

            achievers.append(
                MissionAchieverRead(
                    student_id=student.id,
                    student_number=student.student_number,
                    student_name=student.name,
                    completion_count=completion_count,
                    weekly_completion_count=weekly_count,
                    last_achieved_at=_parse_iso_datetime(row.get("last_achieved_at")),
                )
            )

        achievers.sort(
            key=lambda item: (
                -item.weekly_completion_count,
                -item.completion_count,
                item.student_number,
            )
        )

        progress_percent = min(100.0, round((achiever_count / total_students) * 100, 1))

        mission_rows.append(
            MissionRead(
                id=mission_id,
                title=str(mission.get("title", "미션")),
                description=(
                    str(mission.get("description"))
                    if isinstance(mission.get("description"), str)
                    else None
                ),
                icon_key=str(mission.get("icon_key", "scroll")),
                target_stat_key=str(mission.get("target_stat_key", "diligence")),
                target_stat_label=str(mission.get("target_stat_label", "성실성")),
                reward_exp=max(0, int(mission.get("reward_exp", 0))),
                reward_won=max(0, int(mission.get("reward_won", 0))),
                reward_nyang=max(0, int(mission.get("reward_nyang", 0))),
                repeatable=repeatable,
                weekly_reset=weekly_reset,
                goal_count=goal_count,
                is_active=is_active,
                total_completion_count=total_completion_count,
                weekly_completion_count=weekly_completion_count,
                achiever_count=achiever_count,
                progress_percent=progress_percent,
                created_at=_parse_iso_datetime(mission.get("created_at")),
                updated_at=_parse_iso_datetime(mission.get("updated_at")),
                closed_at=(
                    _parse_iso_datetime(mission.get("closed_at"))
                    if isinstance(mission.get("closed_at"), str)
                    else None
                ),
                achievers=achievers,
            )
        )

    mission_rows.sort(key=lambda row: (not row.is_active, row.title.lower()))
    return mission_rows


def _add_mission_achiever_records(
    mission: dict[str, object],
    *,
    student_ids: list[int],
    db: Session,
) -> MissionAchieverUpdateResult:
    mission_id = int(mission.get("id", 0))
    if mission_id <= 0:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다.")

    students = {student.id: student for student in db.query(Student).all()}
    achievements = _get_mission_achievements(db)
    current_week_key = _current_week_key()

    repeatable = mission.get("repeatable") is True
    weekly_reset = mission.get("weekly_reset") is True

    updated_count = 0
    skipped_student_ids: list[int] = []

    for student_id in student_ids:
        student = students.get(student_id)
        if not student:
            skipped_student_ids.append(student_id)
            continue

        row = next(
            (
                item
                for item in achievements
                if int(item.get("mission_id", 0)) == mission_id
                and int(item.get("student_id", 0)) == student_id
            ),
            None,
        )

        if row is None:
            row = {
                "id": _next_embedded_id(achievements),
                "mission_id": mission_id,
                "student_id": student_id,
                "completion_count": 0,
                "weekly_completion_count": 0,
                "week_key": current_week_key,
                "last_achieved_at": datetime.now(UTC).isoformat(),
            }
            achievements.append(row)

        if weekly_reset and str(row.get("week_key", "")) != current_week_key:
            row["weekly_completion_count"] = 0
            row["week_key"] = current_week_key

        if not repeatable and int(row.get("completion_count", 0)) > 0:
            skipped_student_ids.append(student_id)
            continue

        row["completion_count"] = int(row.get("completion_count", 0)) + 1
        row["weekly_completion_count"] = int(row.get("weekly_completion_count", 0)) + 1
        row["last_achieved_at"] = datetime.now(UTC).isoformat()

        student.total_exp += max(0, int(mission.get("reward_exp", 0)))
        student.level = _level_from_total_exp(student.total_exp)
        student.won_balance += max(0, int(mission.get("reward_won", 0)))
        student.nyang_balance += max(0, int(mission.get("reward_nyang", 0)))

        student_notes = _parse_notes(student)
        _append_custom_activity(
            student_notes,
            {
                "log_type": "mission",
                "title": str(mission.get("title", "미션 달성")),
                "description": f"미션 달성 +1회 ({str(mission.get('target_stat_label', '능력치'))} 성장)",
                "reward_won": max(0, int(mission.get("reward_won", 0))),
                "reward_nyang": max(0, int(mission.get("reward_nyang", 0))),
                "created_at": datetime.now(UTC).isoformat(),
            },
        )
        _save_notes(student, student_notes)
        updated_count += 1

    _set_mission_achievements(db, achievements)

    return MissionAchieverUpdateResult(
        mission_id=mission_id,
        updated_count=updated_count,
        skipped_student_ids=sorted(set(skipped_student_ids)),
    )


def _embedded_classroom_cards(notes: dict[str, object]) -> list[dict[str, object]]:
    cards = notes.get("classroom_cards")
    if not isinstance(cards, list):
        return []
    return [item for item in cards if isinstance(item, dict)]


def _embedded_card_issues(notes: dict[str, object]) -> list[dict[str, object]]:
    issues = notes.get("card_issues")
    if not isinstance(issues, list):
        return []
    return [item for item in issues if isinstance(item, dict)]


def _default_classroom_cards() -> list[dict[str, object]]:
    now_iso = datetime.now(UTC).isoformat()
    return [
        {
            "id": 1,
            "card_type": "praise",
            "title": "나사참의 성공!",
            "description": "과제를 성실하게 마무리한 친구에게 수여합니다.",
            "icon_key": "heart",
            "category": "인성",
            "reward_exp": 30,
            "reward_won": 30,
            "reward_nyang": 0,
            "level_delta": 1,
            "stat_changes": [{"stat_key": "personality", "stat_label": "인성", "delta": 1}],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": 2,
            "card_type": "praise",
            "title": "발표 적극 참여",
            "description": "수업 발표에 적극적으로 참여했을 때 수여합니다.",
            "icon_key": "sparkles",
            "category": "의사소통",
            "reward_exp": 50,
            "reward_won": 50,
            "reward_nyang": 0,
            "level_delta": 1,
            "stat_changes": [
                {"stat_key": "communication", "stat_label": "의사소통", "delta": 1},
                {"stat_key": "diligence", "stat_label": "성실성", "delta": 1},
            ],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": 3,
            "card_type": "warning",
            "title": "수업 지각",
            "description": "수업 시작 시간 이후 입실한 경우 발급합니다.",
            "icon_key": "triangle-alert",
            "category": "패널티",
            "reward_exp": 100,
            "reward_won": 100,
            "reward_nyang": 0,
            "level_delta": 0,
            "stat_changes": [{"stat_key": "diligence", "stat_label": "성실성", "delta": 1}],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": 4,
            "card_type": "warning",
            "title": "수업 미준비",
            "description": "필요한 교재나 준비물을 준비하지 못한 경우 발급합니다.",
            "icon_key": "shield-alert",
            "category": "패널티",
            "reward_exp": 100,
            "reward_won": 100,
            "reward_nyang": 0,
            "level_delta": 0,
            "stat_changes": [{"stat_key": "diligence", "stat_label": "성실성", "delta": 2}],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]


def _get_classroom_cards(db: Session) -> list[dict[str, object]]:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        return []

    notes = _parse_notes(registry_student)
    cards = _embedded_classroom_cards(notes)
    if cards:
        return cards

    cards = _default_classroom_cards()
    notes["classroom_cards"] = cards
    if not isinstance(notes.get("card_issues"), list):
        notes["card_issues"] = []
    _save_notes(registry_student, notes)
    db.commit()
    return cards


def _set_classroom_cards(db: Session, cards: list[dict[str, object]]) -> None:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        raise HTTPException(status_code=400, detail="카드를 저장하려면 최소 1명의 학생이 필요합니다.")

    notes = _parse_notes(registry_student)
    notes["classroom_cards"] = cards
    if not isinstance(notes.get("card_issues"), list):
        notes["card_issues"] = []
    _save_notes(registry_student, notes)


def _get_card_issues(db: Session) -> list[dict[str, object]]:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        return []
    notes = _parse_notes(registry_student)
    return _embedded_card_issues(notes)


def _set_card_issues(db: Session, issues: list[dict[str, object]]) -> None:
    registry_student = _get_mission_registry_student(db)
    if not registry_student:
        raise HTTPException(status_code=400, detail="카드 발급 기록을 저장하려면 최소 1명의 학생이 필요합니다.")

    notes = _parse_notes(registry_student)
    notes["card_issues"] = issues
    if not isinstance(notes.get("classroom_cards"), list):
        notes["classroom_cards"] = _default_classroom_cards()
    _save_notes(registry_student, notes)


def _build_classroom_card_reads(
    db: Session,
    *,
    card_type: str | None = None,
    include_inactive: bool = False,
) -> list[ClassroomCardRead]:
    cards = _get_classroom_cards(db)
    issues = _get_card_issues(db)

    result: list[ClassroomCardRead] = []
    for card in cards:
        current_type = str(card.get("card_type", "praise"))
        if card_type and current_type != card_type:
            continue

        is_active = card.get("is_active") is not False
        if not include_inactive and not is_active:
            continue

        card_id = int(card.get("id", 0))
        related = [item for item in issues if int(item.get("card_id", 0)) == card_id]
        recipient_count = len({int(item.get("student_id", 0)) for item in related if int(item.get("student_id", 0)) > 0})

        stat_changes: list[dict[str, object]] = []
        raw_stat_changes = card.get("stat_changes")
        if isinstance(raw_stat_changes, list):
            for stat_item in raw_stat_changes:
                if not isinstance(stat_item, dict):
                    continue
                stat_changes.append(
                    {
                        "stat_key": str(stat_item.get("stat_key", "diligence")),
                        "stat_label": str(stat_item.get("stat_label", "성실성")),
                        "delta": max(1, int(stat_item.get("delta", 1))),
                    }
                )

        result.append(
            ClassroomCardRead(
                id=card_id,
                card_type=current_type,
                title=str(card.get("title", "카드")),
                description=str(card.get("description")) if isinstance(card.get("description"), str) else None,
                icon_key=str(card.get("icon_key", "heart")),
                category=str(card.get("category", "전체")),
                reward_exp=max(0, int(card.get("reward_exp", 0))),
                reward_won=max(0, int(card.get("reward_won", 0))),
                reward_nyang=max(0, int(card.get("reward_nyang", 0))),
                level_delta=max(0, int(card.get("level_delta", 0))),
                stat_changes=stat_changes,
                is_active=is_active,
                recipient_count=recipient_count,
                total_issued=len(related),
                created_at=_parse_iso_datetime(card.get("created_at")),
                updated_at=_parse_iso_datetime(card.get("updated_at")),
            )
        )

    result.sort(key=lambda item: (not item.is_active, item.title.lower()))
    return result


def _apply_card_issue_to_student(
    student: Student,
    *,
    card: dict[str, object],
    issued_note: str | None,
) -> None:
    card_type = str(card.get("card_type", "praise"))
    direction = 1 if card_type == "praise" else -1

    reward_exp = max(0, int(card.get("reward_exp", 0)))
    reward_won = max(0, int(card.get("reward_won", 0)))
    reward_nyang = max(0, int(card.get("reward_nyang", 0)))
    level_delta = max(0, int(card.get("level_delta", 0)))

    student.total_exp = max(0, student.total_exp + (reward_exp * direction))
    student.level = max(1, _level_from_total_exp(student.total_exp) + (level_delta * direction))
    student.won_balance = max(0, student.won_balance + (reward_won * direction))
    student.nyang_balance = max(0, student.nyang_balance + (reward_nyang * direction))

    stat_field_map = {
        "wisdom": "wisdom",
        "creativity": "creativity",
        "personality": "personality",
        "vitality": "vitality",
        "diligence": "diligence",
        "communication": "communication",
    }
    stat_changes = card.get("stat_changes")
    if isinstance(stat_changes, list):
        for raw_item in stat_changes:
            if not isinstance(raw_item, dict):
                continue
            stat_key = str(raw_item.get("stat_key", "")).strip().lower()
            target_field = stat_field_map.get(stat_key)
            if not target_field:
                continue
            delta = max(1, int(raw_item.get("delta", 1)))
            current_value = int(getattr(student, target_field, 0))
            setattr(student, target_field, max(0, current_value + (delta * direction)))

    notes = _parse_notes(student)
    _append_custom_activity(
        notes,
        {
            "log_type": "praise_card" if card_type == "praise" else "warning_card",
            "title": str(card.get("title", "카드 발급")),
            "description": issued_note or str(card.get("description", "카드 발급 기록")),
            "reward_won": reward_won * direction,
            "reward_nyang": reward_nyang * direction,
            "created_at": datetime.now(UTC).isoformat(),
        },
    )
    _save_notes(student, notes)


def _issue_classroom_card(
    card: dict[str, object],
    *,
    student_ids: list[int],
    issued_note: str | None,
    issuer_user_id: int | None,
    db: Session,
) -> ClassroomCardIssueResult:
    card_id = int(card.get("id", 0))
    if card_id <= 0:
        raise HTTPException(status_code=404, detail="카드를 찾을 수 없습니다.")

    students = {student.id: student for student in db.query(Student).all()}
    issues = _get_card_issues(db)

    issued_count = 0
    skipped_student_ids: list[int] = []

    for student_id in student_ids:
        student = students.get(student_id)
        if not student:
            skipped_student_ids.append(student_id)
            continue

        _apply_card_issue_to_student(student, card=card, issued_note=issued_note)

        issues.insert(
            0,
            {
                "id": _next_embedded_id(issues),
                "card_id": card_id,
                "student_id": student_id,
                "issuer_user_id": issuer_user_id,
                "issued_note": issued_note,
                "issued_at": datetime.now(UTC).isoformat(),
            },
        )

        db.add(
            CardEvent(
                student_id=student_id,
                issuer_user_id=issuer_user_id,
                event_type=str(card.get("card_type", "praise")),
                stat_delta=max(1, int(card.get("reward_exp", 1))),
                level_delta=max(0, int(card.get("level_delta", 0))),
                reason=str(card.get("title", "카드 발급")),
            )
        )
        issued_count += 1

    _set_card_issues(db, issues)
    _issue_auto_titles_for_students(student_ids, db)
    return ClassroomCardIssueResult(
        card_id=card_id,
        issued_count=issued_count,
        skipped_student_ids=sorted(set(skipped_student_ids)),
    )


def _build_classroom_card_history(card_id: int, db: Session) -> ClassroomCardHistoryResponse:
    cards = _get_classroom_cards(db)
    if not any(int(item.get("id", -1)) == card_id for item in cards):
        raise HTTPException(status_code=404, detail="카드를 찾을 수 없습니다.")

    issues = [item for item in _get_card_issues(db) if int(item.get("card_id", 0)) == card_id]
    students = {student.id: student for student in db.query(Student).all()}

    count_by_student: dict[int, int] = {}
    history_rows: list[ClassroomCardIssueHistoryRead] = []

    for issue in issues:
        student_id = int(issue.get("student_id", 0))
        student = students.get(student_id)
        if not student:
            continue

        count_by_student[student_id] = count_by_student.get(student_id, 0) + 1
        history_rows.append(
            ClassroomCardIssueHistoryRead(
                issue_id=int(issue.get("id", 0)),
                card_id=card_id,
                student_id=student.id,
                student_number=student.student_number,
                student_name=student.name,
                issued_note=(
                    str(issue.get("issued_note"))
                    if isinstance(issue.get("issued_note"), str)
                    else None
                ),
                issued_at=_parse_iso_datetime(issue.get("issued_at")),
            )
        )

    recipients = [
        ClassroomCardRecipientRead(
            student_id=student.id,
            student_number=student.student_number,
            student_name=student.name,
            issued_count=count,
        )
        for student_id, count in count_by_student.items()
        if (student := students.get(student_id)) is not None
    ]

    recipients.sort(key=lambda item: (-item.issued_count, item.student_number))
    history_rows.sort(key=lambda item: item.issued_at, reverse=True)

    return ClassroomCardHistoryResponse(
        card_id=card_id,
        recipients=recipients,
        history=history_rows[:300],
    )


def _embedded_title_definitions(notes: dict[str, object]) -> list[dict[str, object]]:
    entries = notes.get("title_definitions")
    if not isinstance(entries, list):
        return []
    return [entry for entry in entries if isinstance(entry, dict)]


def _embedded_earned_titles(notes: dict[str, object]) -> list[dict[str, object]]:
    entries = notes.get("earned_titles")
    if not isinstance(entries, list):
        return []
    return [entry for entry in entries if isinstance(entry, dict)]


def _parse_iso_datetime(value: object) -> datetime:
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.now(UTC)
    return datetime.now(UTC)


def _get_class_title_registry_student(db: Session) -> Student | None:
    return db.query(Student).order_by(asc(Student.id)).first()


def _normalize_title_definition(definition: dict[str, object]) -> dict[str, object]:
    mode = str(definition.get("achievement_mode", "manual")).strip().lower()
    if mode not in {"manual", "auto"}:
        mode = "manual"

    condition_type = str(definition.get("auto_condition_type", "none")).strip().lower()
    if condition_type not in {"none", "card_issue_count", "stat_threshold"}:
        condition_type = "none"

    condition_card_id_raw = definition.get("condition_card_id")
    condition_card_id = int(condition_card_id_raw) if isinstance(condition_card_id_raw, int) and condition_card_id_raw > 0 else None

    condition_stat_key_raw = definition.get("condition_stat_key")
    condition_stat_key = (
        str(condition_stat_key_raw).strip().lower()
        if isinstance(condition_stat_key_raw, str) and str(condition_stat_key_raw).strip()
        else None
    )

    target_raw = definition.get("condition_target_count")
    condition_target_count = int(target_raw) if isinstance(target_raw, int) and target_raw > 0 else None

    normalized = {
        **definition,
        "achievement_mode": mode,
        "auto_condition_type": condition_type,
        "condition_card_id": condition_card_id,
        "condition_stat_key": condition_stat_key,
        "condition_target_count": condition_target_count,
    }

    if mode == "manual":
        normalized["auto_condition_type"] = "none"
        normalized["condition_card_id"] = None
        normalized["condition_stat_key"] = None
        normalized["condition_target_count"] = None

    if mode == "auto" and condition_type == "card_issue_count":
        normalized["condition_stat_key"] = None
    if mode == "auto" and condition_type == "stat_threshold":
        normalized["condition_card_id"] = None

    return normalized


def _get_class_title_definitions(db: Session) -> list[dict[str, object]]:
    registry_student = _get_class_title_registry_student(db)
    if not registry_student:
        return []

    notes = _parse_notes(registry_student)
    definitions = _embedded_title_definitions(notes)
    if definitions:
        return [_normalize_title_definition(item) for item in definitions]

    now_iso = datetime.now(UTC).isoformat()
    default_definitions = [
        {
            "id": 1,
            "title_name": "새싹 도전자",
            "description": "기본으로 선택할 수 있는 시작 칭호",
            "condition_text": "기본 칭호",
            "icon_key": "shield",
            "frame_key": "royal",
            "icon_public_url": None,
            "icon_object_key": None,
            "icon_original_filename": None,
            "icon_content_type": None,
            "reward_exp": 40,
            "reward_won": 80,
            "achievement_mode": "manual",
            "auto_condition_type": "none",
            "condition_card_id": None,
            "condition_stat_key": None,
            "condition_target_count": None,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
    ]
    notes["title_definitions"] = default_definitions
    _save_notes(registry_student, notes)
    db.commit()
    return [_normalize_title_definition(item) for item in default_definitions]


def _set_class_title_definitions(db: Session, definitions: list[dict[str, object]]) -> None:
    registry_student = _get_class_title_registry_student(db)
    if not registry_student:
        raise HTTPException(status_code=400, detail="칭호를 저장하려면 최소 1명의 학생이 필요합니다.")

    notes = _parse_notes(registry_student)
    notes["title_definitions"] = [_normalize_title_definition(item) for item in definitions]
    _save_notes(registry_student, notes)


def _build_student_titles(student: Student, db: Session) -> tuple[list[TitleDefinitionRead], list[StudentTitleRead]]:
    definitions_raw = _get_class_title_definitions(db)

    definition_map: dict[int, dict[str, object]] = {}
    recipient_count_map: dict[int, int] = {}

    all_students = db.query(Student).all()
    for candidate in all_students:
        candidate_notes = _parse_notes(candidate)
        earned_rows = _embedded_earned_titles(candidate_notes)
        for earned in earned_rows:
            title_definition_id = int(earned.get("title_definition_id", 0))
            if title_definition_id <= 0:
                continue
            recipient_count_map[title_definition_id] = recipient_count_map.get(title_definition_id, 0) + 1

    available_titles: list[TitleDefinitionRead] = []
    for definition in definitions_raw:
        definition_id = int(definition.get("id", 0))
        if definition_id <= 0:
            continue

        item = {
            "id": definition_id,
            "title_name": str(definition.get("title_name", "")),
            "description": (
                str(definition.get("description"))
                if isinstance(definition.get("description"), str)
                else None
            ),
            "condition_text": str(definition.get("condition_text", "")),
            "icon_key": str(definition.get("icon_key")) if isinstance(definition.get("icon_key"), str) else None,
            "frame_key": str(definition.get("frame_key")) if isinstance(definition.get("frame_key"), str) else None,
            "icon_public_url": (
                str(definition.get("icon_public_url"))
                if isinstance(definition.get("icon_public_url"), str)
                else None
            ),
            "icon_object_key": (
                str(definition.get("icon_object_key"))
                if isinstance(definition.get("icon_object_key"), str)
                else None
            ),
            "icon_original_filename": (
                str(definition.get("icon_original_filename"))
                if isinstance(definition.get("icon_original_filename"), str)
                else None
            ),
            "icon_content_type": (
                str(definition.get("icon_content_type"))
                if isinstance(definition.get("icon_content_type"), str)
                else None
            ),
            "reward_exp": max(0, int(definition.get("reward_exp", 40))),
            "reward_won": max(0, int(definition.get("reward_won", 80))),
            "achievement_mode": str(definition.get("achievement_mode", "manual")),
            "auto_condition_type": str(definition.get("auto_condition_type", "none")),
            "condition_card_id": (
                int(definition.get("condition_card_id"))
                if isinstance(definition.get("condition_card_id"), int)
                else None
            ),
            "condition_stat_key": (
                str(definition.get("condition_stat_key"))
                if isinstance(definition.get("condition_stat_key"), str)
                else None
            ),
            "condition_target_count": (
                int(definition.get("condition_target_count"))
                if isinstance(definition.get("condition_target_count"), int)
                else None
            ),
            "is_active": definition.get("is_active") is not False,
            "created_at": _parse_iso_datetime(definition.get("created_at")),
            "updated_at": _parse_iso_datetime(definition.get("updated_at")),
        }
        definition_map[definition_id] = item

        available_titles.append(
            TitleDefinitionRead(
                id=definition_id,
                title_name=item["title_name"],
                description=item["description"],
                condition_text=item["condition_text"],
                icon_key=item["icon_key"],
                frame_key=item["frame_key"],
                icon_public_url=item["icon_public_url"],
                icon_object_key=item["icon_object_key"],
                icon_original_filename=item["icon_original_filename"],
                icon_content_type=item["icon_content_type"],
                reward_exp=item["reward_exp"],
                reward_won=item["reward_won"],
                achievement_mode=item["achievement_mode"],
                auto_condition_type=item["auto_condition_type"],
                condition_card_id=item["condition_card_id"],
                condition_stat_key=item["condition_stat_key"],
                condition_target_count=item["condition_target_count"],
                is_active=item["is_active"],
                recipient_count=recipient_count_map.get(definition_id, 0),
                created_at=item["created_at"],
                updated_at=item["updated_at"],
            )
        )

    available_titles.sort(key=lambda item: (not item.is_active, item.title_name.lower()))

    student_notes = _parse_notes(student)
    earned_raw = _embedded_earned_titles(student_notes)
    active_title_definition_id = student_notes.get("active_title_definition_id")
    active_id = active_title_definition_id if isinstance(active_title_definition_id, int) else None

    earned_titles: list[StudentTitleRead] = []
    for earned in earned_raw:
        definition_id = int(earned.get("title_definition_id", 0))
        definition = definition_map.get(definition_id)
        if not definition:
            continue

        earned_titles.append(
            StudentTitleRead(
                id=int(earned.get("id", 0)),
                student_id=student.id,
                title_definition_id=definition_id,
                title_name=str(definition["title_name"]),
                description=(
                    str(definition["description"])
                    if isinstance(definition["description"], str)
                    else None
                ),
                condition_text=str(definition["condition_text"]),
                icon_key=(str(definition["icon_key"]) if isinstance(definition["icon_key"], str) else None),
                frame_key=(str(definition["frame_key"]) if isinstance(definition["frame_key"], str) else None),
                icon_public_url=(
                    str(definition["icon_public_url"])
                    if isinstance(definition["icon_public_url"], str)
                    else None
                ),
                awarded_reason=(
                    str(earned.get("awarded_reason"))
                    if isinstance(earned.get("awarded_reason"), str)
                    else None
                ),
                awarded_at=_parse_iso_datetime(earned.get("awarded_at")),
                is_selected=active_id == definition_id,
            )
        )

    earned_titles.sort(key=lambda item: item.awarded_at, reverse=True)
    return available_titles, earned_titles


def _build_activity_timeline(student: Student, notes: dict[str, object], db: Session) -> list[StudentActivityLogRead]:
    timeline: list[StudentActivityLogRead] = []

    custom_activities = _embedded_custom_activities(notes)
    for activity in custom_activities:
        log_type = str(activity.get("log_type", "")).strip().lower()
        if log_type not in {"mission", "raid", "title"}:
            continue

        created_raw = activity.get("created_at")
        created_at = datetime.now(UTC)
        if isinstance(created_raw, str):
            try:
                created_at = datetime.fromisoformat(created_raw)
            except ValueError:
                created_at = datetime.now(UTC)

        timeline.append(
            StudentActivityLogRead(
                id=int(activity.get("id", 0)),
                student_id=student.id,
                activity_type=log_type,
                category=ACTIVITY_LABELS.get(log_type, "기록"),
                log_type=log_type,
                title=str(activity.get("title", "활동 기록")),
                description=(
                    str(activity.get("description"))
                    if isinstance(activity.get("description"), str)
                    else None
                ),
                reward_won=int(activity.get("reward_won", 0)),
                reward_nyang=int(activity.get("reward_nyang", 0)),
                created_at=created_at,
            )
        )

    card_events = (
        db.query(CardEvent)
        .filter(CardEvent.student_id == student.id)
        .order_by(desc(CardEvent.created_at), desc(CardEvent.id))
        .limit(80)
        .all()
    )
    for event in card_events:
        log_type = "praise_card" if event.event_type == "praise" else "warning_card"
        timeline.append(
            StudentActivityLogRead(
                id=1_000_000 + event.id,
                student_id=student.id,
                activity_type=event.event_type,
                category=ACTIVITY_LABELS[log_type],
                log_type=log_type,
                title=event.reason,
                description="카드 발급 기록",
                reward_won=event.stat_delta if event.event_type == "praise" else 0,
                reward_nyang=max(0, event.level_delta * 2),
                created_at=event.created_at,
            )
        )

    _, earned_titles = _build_student_titles(student, db)
    for unlocked in earned_titles:
        timeline.append(
            StudentActivityLogRead(
                id=2_000_000 + unlocked.id,
                student_id=student.id,
                activity_type="title_unlock",
                category=ACTIVITY_LABELS["title"],
                log_type="title",
                title=f"칭호 획득: {unlocked.title_name}",
                description=unlocked.awarded_reason or unlocked.condition_text,
                reward_won=0,
                reward_nyang=0,
                created_at=unlocked.awarded_at,
            )
        )

    raid_actions = (
        db.query(RaidActionLog)
        .filter(RaidActionLog.student_id == student.id)
        .order_by(desc(RaidActionLog.created_at), desc(RaidActionLog.id))
        .limit(80)
        .all()
    )
    for action in raid_actions:
        timeline.append(
            StudentActivityLogRead(
                id=3_000_000 + action.id,
                student_id=student.id,
                activity_type=action.action_type,
                category=ACTIVITY_LABELS["raid"],
                log_type="raid",
                title=action.actor_name,
                description=action.message,
                reward_won=max(0, action.damage),
                reward_nyang=max(0, action.healing),
                created_at=action.created_at,
            )
        )

    timeline.sort(key=lambda item: item.created_at, reverse=True)
    return timeline[:120]


def _compute_student_stats(student: Student, avatars: list[dict[str, object]]) -> list[StudentStatRead]:
    _ = avatars

    stat_values = [
        ("wisdom", max(0, student.wisdom)),
        ("creativity", max(0, student.creativity)),
        ("personality", max(0, student.personality)),
        ("vitality", max(0, student.vitality)),
        ("diligence", max(0, student.diligence)),
        ("communication", max(0, student.communication)),
    ]

    return [StudentStatRead(key=key, value=value) for key, value in stat_values]


def _compute_student_economy(student: Student) -> StudentEconomyRead:
    max_exp = _exp_per_level_for_level(student.level)
    level_floor_exp = _exp_to_reach_level(student.level)

    effective_total_exp = max(student.total_exp, 0)
    if effective_total_exp == 0 and student.level > 1:
        effective_total_exp = level_floor_exp

    current_exp = max(0, effective_total_exp - level_floor_exp)
    if max_exp > 0:
        current_exp = min(current_exp, max_exp)

    return StudentEconomyRead(
        won=max(0, student.won_balance),
        nyang=max(0, student.nyang_balance),
        core=max(0, student.core_balance),
        starlight_shard=max(0, student.starlight_shard_balance),
        total_exp=effective_total_exp,
        current_exp=current_exp,
        max_exp=max_exp,
    )


def _ensure_student(student_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")
    return student


def _default_student_nickname(student_number: int) -> str:
    return f"학생{student_number:02d}"


def _default_student_pin(student_number: int) -> str:
    return f"{1000 + student_number:04d}"


def _transfer_class_registry_notes_if_needed(student_to_delete: Student, db: Session) -> None:
    registry_student = _get_mission_registry_student(db)
    if not registry_student or registry_student.id != student_to_delete.id:
        return

    replacement_registry = (
        db.query(Student)
        .filter(Student.id != student_to_delete.id)
        .order_by(asc(Student.id))
        .first()
    )
    if not replacement_registry:
        return

    source_notes = _parse_notes(student_to_delete)
    target_notes = _parse_notes(replacement_registry)

    class_scoped_keys = (
        "missions",
        "mission_achievements",
        "classroom_cards",
        "card_issues",
        "title_definitions",
    )

    changed = False
    for key in class_scoped_keys:
        if key in source_notes:
            target_notes[key] = source_notes[key]
            changed = True

    if changed:
        _save_notes(replacement_registry, target_notes)


def _cleanup_deleted_student_embedded_references(student_id: int, db: Session) -> None:
    remaining_students = db.query(Student).filter(Student.id != student_id).all()
    for candidate in remaining_students:
        notes = _parse_notes(candidate)
        changed = False

        mission_achievements = notes.get("mission_achievements")
        if isinstance(mission_achievements, list):
            next_mission_achievements = [
                item
                for item in mission_achievements
                if not (
                    isinstance(item, dict)
                    and int(item.get("student_id", 0)) == student_id
                )
            ]
            if len(next_mission_achievements) != len(mission_achievements):
                notes["mission_achievements"] = next_mission_achievements
                changed = True

        card_issues = notes.get("card_issues")
        if isinstance(card_issues, list):
            next_card_issues = [
                item
                for item in card_issues
                if not (
                    isinstance(item, dict)
                    and int(item.get("student_id", 0)) == student_id
                )
            ]
            if len(next_card_issues) != len(card_issues):
                notes["card_issues"] = next_card_issues
                changed = True

        if changed:
            _save_notes(candidate, notes)


def _build_default_student(
    *,
    student_number: int,
    nickname: str,
    created_by_user_id: int | None,
) -> Student:
    return Student(
        student_number=student_number,
        name=nickname,
        access_code=_default_student_pin(student_number),
        character_class="X",
        title="직업 X",
        level=1,
        total_exp=0,
        won_balance=0,
        nyang_balance=0,
        core_balance=0,
        starlight_shard_balance=0,
        wisdom=0,
        creativity=0,
        personality=0,
        vitality=0,
        diligence=0,
        communication=0,
        notes=json.dumps({"custom_activities": []}, ensure_ascii=False),
        created_by_user_id=created_by_user_id,
    )


@router.get("/overview", response_model=ClassroomOverview)
def get_overview(
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    total_students = db.query(Student).count()
    active_students = db.query(Student).filter(Student.is_active.is_(True)).count()
    average_level = db.query(func.avg(Student.level)).scalar() or 0
    total_points = db.query(func.sum(Student.class_points)).scalar() or 0
    total_questions = db.query(QuestionBankItem).count()
    active_raid = (
        db.query(RaidSession)
        .filter(RaidSession.status.in_(["scheduled", "active", "paused"]))
        .order_by(desc(RaidSession.created_at))
        .first()
    )

    return ClassroomOverview(
        total_students=total_students,
        active_students=active_students,
        average_level=round(float(average_level), 1),
        total_points=int(total_points),
        total_questions=total_questions,
        active_raid_id=active_raid.id if active_raid else None,
    )


@router.get("/students", response_model=list[StudentRead])
def list_students(
    sort_by: str = Query(default="student_number", pattern="^(student_number|level)$"),
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    ordering = (
        asc(Student.student_number)
        if sort_by == "student_number"
        else desc(Student.level)
    )
    students = db.query(Student).order_by(ordering, asc(Student.student_number)).all()

    if _has_teacher_mode_access(auth_payload):
        return students

    session_student_id = _student_session_student_id(auth_payload)
    sanitized_students: list[StudentRead] = []
    for student in students:
        student_read = StudentRead.model_validate(student)
        if session_student_id != student.id:
            student_read = student_read.model_copy(update={"access_code": "비공개"})
        sanitized_students.append(student_read)

    return sanitized_students


@router.get("/public/students", response_model=list[PublicStudentLoginItemRead])
def list_public_student_login_items(db: Session = Depends(get_db)):
    students = (
        db.query(Student)
        .filter(Student.is_active.is_(True))
        .order_by(asc(Student.student_number), asc(Student.id))
        .all()
    )

    return [
        PublicStudentLoginItemRead(
            id=student.id,
            student_number=student.student_number,
            name=student.name,
            title=student.title,
            avatar_url=student.avatar_url,
        )
        for student in students
    ]


@router.post("/public/student-login", response_model=PublicStudentLoginResponse)
def login_public_student(
    payload: PublicStudentLoginRequest,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(
            Student.id == payload.student_id,
            Student.is_active.is_(True),
        )
        .first()
    )
    if not student or student.access_code != payload.pin_code:
        raise HTTPException(status_code=401, detail="학생 번호 또는 PIN이 올바르지 않습니다.")

    return PublicStudentLoginResponse(
        token=f"student:{student.id}:{student.access_code}",
        user={
            "id": f"student-{student.id}",
            "email": None,
            "name": student.name,
            "role": "student",
            "student_id": student.id,
        },
    )


@router.get("/students/login-accounts", response_model=list[StudentLoginAccountRead])
def list_student_login_accounts(
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="학생 로그인 계정은 교사/관리자만 조회할 수 있습니다.")

    students = db.query(Student).order_by(asc(Student.student_number), asc(Student.id)).all()
    return [
        StudentLoginAccountRead(
            id=student.id,
            student_number=student.student_number,
            nickname=student.name,
            pin_code=student.access_code,
        )
        for student in students
    ]


@router.post("/students/login-accounts/add", response_model=StudentLoginAccountRead)
def create_student_login_account(
    payload: StudentLoginAccountCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="학생 로그인 계정은 교사/관리자만 추가할 수 있습니다.")

    current_max_number = db.query(func.max(Student.student_number)).scalar()
    next_number = int(current_max_number or 0) + 1

    nickname = payload.nickname.strip() if isinstance(payload.nickname, str) and payload.nickname.strip() else _default_student_nickname(next_number)

    student = _build_default_student(
        student_number=next_number,
        nickname=nickname,
        created_by_user_id=_current_user_id(auth_payload),
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return StudentLoginAccountRead(
        id=student.id,
        student_number=student.student_number,
        nickname=student.name,
        pin_code=student.access_code,
    )


@router.patch("/students/{student_id}/access-code", response_model=StudentLoginAccountRead)
def update_student_access_code(
    student_id: int,
    payload: StudentAccessCodeUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="학생 PIN 수정은 교사/관리자만 수행할 수 있습니다.")

    student = _ensure_student(student_id, db)

    duplicate = (
        db.query(Student)
        .filter(Student.access_code == payload.access_code, Student.id != student_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="이미 사용 중인 PIN 번호입니다.")

    student.access_code = payload.access_code
    db.commit()
    db.refresh(student)

    return StudentLoginAccountRead(
        id=student.id,
        student_number=student.student_number,
        nickname=student.name,
        pin_code=student.access_code,
    )


@router.post("/students/login-accounts/reset-defaults", response_model=list[StudentLoginAccountRead])
def reset_student_login_accounts(
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="기본 학생 재설정은 교사/관리자만 수행할 수 있습니다.")

    existing_students = db.query(Student).all()
    for student in existing_students:
        db.delete(student)

    db.flush()

    created_students: list[Student] = []
    creator_id = _current_user_id(auth_payload)
    for student_number in range(1, 26):
        student = _build_default_student(
            student_number=student_number,
            nickname=_default_student_nickname(student_number),
            created_by_user_id=creator_id,
        )
        db.add(student)
        created_students.append(student)

    db.commit()

    return [
        StudentLoginAccountRead(
            id=student.id,
            student_number=student.student_number,
            nickname=student.name,
            pin_code=student.access_code,
        )
        for student in created_students
    ]


@router.get("/students/{student_id}/detail", response_model=StudentDetailRead)
def get_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_or_teacher(auth_payload, student_id)
    student = _ensure_student(student_id, db)
    notes = _parse_notes(student)
    avatars_raw = _embedded_avatars(student, notes)
    photos_raw = _embedded_photos(notes)

    avatar_items = [
        StudentAvatarItemRead(
            id=int(item.get("id", 0)),
            student_id=student.id,
            slot=str(item.get("slot", "face")),
            name=str(item.get("name", "아바타")),
            rarity=str(item.get("rarity", "일반")),
            image_url=(str(item.get("image_url")) if isinstance(item.get("image_url"), str) else None),
            bonus_diligence=int(item.get("bonus_diligence", 0)),
            bonus_stamina=int(item.get("bonus_stamina", 0)),
            bonus_intellect=int(item.get("bonus_intellect", 0)),
            bonus_communication=int(item.get("bonus_communication", 0)),
            bonus_personality=int(item.get("bonus_personality", 0)),
            bonus_leadership=int(item.get("bonus_leadership", 0)),
            is_owned=item.get("is_owned") is not False,
            is_equipped=item.get("is_equipped") is True,
            obtained_at=datetime.fromisoformat(str(item.get("obtained_at", datetime.now(UTC).isoformat()))),
        )
        for item in avatars_raw
    ]

    photo_items = [
        StudentPhotoAssetRead(
            id=int(item.get("id", 0)),
            student_id=student.id,
            public_url=str(item.get("public_url", "")),
            object_key=str(item.get("object_key", "")),
            original_filename=str(item.get("original_filename", "image")),
            content_type=(
                str(item.get("content_type"))
                if isinstance(item.get("content_type"), str)
                else None
            ),
            created_at=datetime.fromisoformat(str(item.get("created_at", datetime.now(UTC).isoformat()))),
        )
        for item in photos_raw
    ]

    activities = _build_activity_timeline(student, notes, db)
    available_titles, earned_titles = _build_student_titles(student, db)

    _save_notes(student, notes)
    db.commit()

    session_student_id = _student_session_student_id(auth_payload)
    can_view_access_code = _has_teacher_mode_access(auth_payload) or session_student_id == student.id
    student_read = StudentRead.model_validate(student)
    if not can_view_access_code:
        student_read = student_read.model_copy(update={"access_code": "비공개"})

    return StudentDetailRead(
        student=student_read,
        stats=_compute_student_stats(student, avatars_raw),
        economy=_compute_student_economy(student),
        activities=activities,
        avatars=avatar_items,
        photos=photo_items,
        available_titles=available_titles,
        earned_titles=earned_titles,
        can_manage_economy=_can_manage_student_economy(auth_payload, student),
    )


@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="학생 삭제는 교사/관리자만 수행할 수 있습니다.")

    student = _ensure_student(student_id, db)
    _transfer_class_registry_notes_if_needed(student, db)
    _cleanup_deleted_student_embedded_references(student_id, db)

    db.delete(student)
    db.commit()

    return {"success": True, "deleted_student_id": student_id}


@router.patch("/students/{student_id}/profile", response_model=StudentRead)
def update_student_profile(
    student_id: int,
    payload: StudentProfileUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, student_id)
    student = _ensure_student(student_id, db)

    if payload.name is not None:
        student.name = payload.name

    db.commit()
    db.refresh(student)
    return student


@router.post("/students/{student_id}/activities", response_model=StudentActivityLogRead)
def create_student_activity(
    student_id: int,
    payload: StudentActivityCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    student = _ensure_student(student_id, db)
    notes = _parse_notes(student)

    _append_custom_activity(
        notes,
        {
            "log_type": payload.log_type,
            "title": payload.title,
            "description": payload.description,
            "reward_won": payload.reward_won,
            "reward_nyang": payload.reward_nyang,
            "created_at": datetime.now(UTC).isoformat(),
        },
    )

    _save_notes(student, notes)
    db.commit()

    timeline = _build_activity_timeline(student, notes, db)
    created = next(
        (
            item
            for item in timeline
            if item.log_type == payload.log_type
            and item.title == payload.title
            and item.description == payload.description
        ),
        None,
    )
    if created:
        return created

    return StudentActivityLogRead(
        id=0,
        student_id=student.id,
        activity_type=payload.log_type,
        category=ACTIVITY_LABELS[payload.log_type],
        log_type=payload.log_type,
        title=payload.title,
        description=payload.description,
        reward_won=payload.reward_won,
        reward_nyang=payload.reward_nyang,
        created_at=datetime.now(UTC),
    )

@router.get("/missions", response_model=list[MissionRead])
def list_missions(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    return _build_mission_reads(db, include_inactive=include_inactive)


@router.post("/missions", response_model=MissionRead)
def create_mission(
    payload: MissionCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    missions = _get_class_missions(db)
    now_iso = datetime.now(UTC).isoformat()
    mission = {
        "id": _next_embedded_id(missions),
        "title": payload.title,
        "description": payload.description,
        "icon_key": payload.icon_key,
        "target_stat_key": payload.target_stat_key,
        "target_stat_label": payload.target_stat_label,
        "reward_exp": payload.reward_exp,
        "reward_won": payload.reward_won,
        "reward_nyang": payload.reward_nyang,
        "repeatable": payload.repeatable,
        "weekly_reset": payload.weekly_reset,
        "goal_count": payload.goal_count,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso,
        "closed_at": None,
    }
    missions.append(mission)
    _set_class_missions(db, missions)
    db.commit()

    return next((row for row in _build_mission_reads(db, include_inactive=True) if row.id == mission["id"]), None) or MissionRead(
        id=int(mission["id"]),
        title=mission["title"],
        description=mission["description"],
        icon_key=mission["icon_key"],
        target_stat_key=mission["target_stat_key"],
        target_stat_label=mission["target_stat_label"],
        reward_exp=mission["reward_exp"],
        reward_won=mission["reward_won"],
        reward_nyang=mission["reward_nyang"],
        repeatable=mission["repeatable"],
        weekly_reset=mission["weekly_reset"],
        goal_count=mission["goal_count"],
        is_active=True,
        total_completion_count=0,
        weekly_completion_count=0,
        achiever_count=0,
        progress_percent=0,
        created_at=_parse_iso_datetime(mission["created_at"]),
        updated_at=_parse_iso_datetime(mission["updated_at"]),
        closed_at=None,
        achievers=[],
    )


@router.patch("/missions/{mission_id}", response_model=MissionRead)
def update_mission(
    mission_id: int,
    payload: MissionUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    missions = _get_class_missions(db)
    mission = next((item for item in missions if int(item.get("id", -1)) == mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다.")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        mission[key] = value

    if payload.is_active is False:
        mission["closed_at"] = datetime.now(UTC).isoformat()
    elif payload.is_active is True:
        mission["closed_at"] = None

    mission["updated_at"] = datetime.now(UTC).isoformat()

    _set_class_missions(db, missions)
    db.commit()

    updated = next((row for row in _build_mission_reads(db, include_inactive=True) if row.id == mission_id), None)
    if not updated:
        raise HTTPException(status_code=500, detail="미션 수정 후 조회에 실패했습니다.")
    return updated


@router.post("/missions/{mission_id}/achievers", response_model=MissionAchieverUpdateResult)
def add_mission_achievers(
    mission_id: int,
    payload: MissionAchieverAdd,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    missions = _get_class_missions(db)
    mission = next((item for item in missions if int(item.get("id", -1)) == mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다.")
    if mission.get("is_active") is False:
        raise HTTPException(status_code=400, detail="종료된 미션에는 달성자를 추가할 수 없습니다.")

    result = _add_mission_achiever_records(mission, student_ids=payload.student_ids, db=db)
    db.commit()
    return result

@router.get("/cards", response_model=list[ClassroomCardRead])
def list_classroom_cards(
    card_type: str | None = Query(default=None, pattern="^(praise|warning)$"),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    return _build_classroom_card_reads(db, card_type=card_type, include_inactive=include_inactive)


@router.post("/cards", response_model=ClassroomCardRead)
def create_classroom_card(
    payload: ClassroomCardCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    cards = _get_classroom_cards(db)
    now_iso = datetime.now(UTC).isoformat()
    card = {
        "id": _next_embedded_id(cards),
        "card_type": payload.card_type,
        "title": payload.title,
        "description": payload.description,
        "icon_key": payload.icon_key,
        "category": payload.category,
        "reward_exp": payload.reward_exp,
        "reward_won": payload.reward_won,
        "reward_nyang": payload.reward_nyang,
        "level_delta": payload.level_delta,
        "stat_changes": [item.model_dump() for item in payload.stat_changes],
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    cards.append(card)

    _set_classroom_cards(db, cards)
    db.commit()

    created = next(
        (item for item in _build_classroom_card_reads(db, include_inactive=True) if item.id == int(card["id"])),
        None,
    )
    if not created:
        raise HTTPException(status_code=500, detail="카드 생성 후 조회에 실패했습니다.")
    return created


@router.patch("/cards/{card_id}", response_model=ClassroomCardRead)
def update_classroom_card(
    card_id: int,
    payload: ClassroomCardUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    cards = _get_classroom_cards(db)
    card = next((item for item in cards if int(item.get("id", -1)) == card_id), None)
    if not card:
        raise HTTPException(status_code=404, detail="카드를 찾을 수 없습니다.")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key == "stat_changes" and isinstance(value, list):
            card[key] = value
            continue
        card[key] = value

    card["updated_at"] = datetime.now(UTC).isoformat()
    _set_classroom_cards(db, cards)
    db.commit()

    updated = next(
        (item for item in _build_classroom_card_reads(db, include_inactive=True) if item.id == card_id),
        None,
    )
    if not updated:
        raise HTTPException(status_code=500, detail="카드 수정 후 조회에 실패했습니다.")
    return updated


@router.post("/cards/{card_id}/issue", response_model=ClassroomCardIssueResult)
def issue_classroom_card(
    card_id: int,
    payload: ClassroomCardIssueCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    cards = _get_classroom_cards(db)
    card = next((item for item in cards if int(item.get("id", -1)) == card_id), None)
    if not card:
        raise HTTPException(status_code=404, detail="카드를 찾을 수 없습니다.")
    if card.get("is_active") is False:
        raise HTTPException(status_code=400, detail="비활성 카드에는 발급할 수 없습니다.")

    result = _issue_classroom_card(
        card,
        student_ids=payload.student_ids,
        issued_note=payload.issued_note,
        issuer_user_id=_current_user_id(auth_payload),
        db=db,
    )
    db.commit()
    return result


@router.get("/cards/{card_id}/history", response_model=ClassroomCardHistoryResponse)
def get_classroom_card_history(
    card_id: int,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    return _build_classroom_card_history(card_id, db)


def _title_payload_to_dict(payload: TitleDefinitionCreate | TitleDefinitionUpdate) -> dict[str, object]:
    return {
        "title_name": payload.title_name,
        "description": payload.description,
        "condition_text": payload.condition_text,
        "icon_key": payload.icon_key,
        "frame_key": payload.frame_key,
        "icon_public_url": payload.icon_public_url,
        "icon_object_key": payload.icon_object_key,
        "icon_original_filename": payload.icon_original_filename,
        "icon_content_type": payload.icon_content_type,
        "reward_exp": payload.reward_exp,
        "reward_won": payload.reward_won,
        "achievement_mode": payload.achievement_mode,
        "auto_condition_type": payload.auto_condition_type,
        "condition_card_id": payload.condition_card_id,
        "condition_stat_key": payload.condition_stat_key,
        "condition_target_count": payload.condition_target_count,
    }


def _is_auto_title_eligible(
    *,
    student: Student,
    title_definition: dict[str, object],
    issues: list[dict[str, object]],
) -> bool:
    normalized = _normalize_title_definition(title_definition)
    if normalized.get("is_active") is False:
        return False

    if normalized.get("achievement_mode") != "auto":
        return False

    condition_type = str(normalized.get("auto_condition_type", "none"))
    target_count = normalized.get("condition_target_count")
    if not isinstance(target_count, int) or target_count <= 0:
        return False

    if condition_type == "card_issue_count":
        card_id = normalized.get("condition_card_id")
        if not isinstance(card_id, int) or card_id <= 0:
            return False
        issue_count = sum(
            1
            for issue in issues
            if int(issue.get("student_id", 0)) == student.id and int(issue.get("card_id", 0)) == card_id
        )
        return issue_count >= target_count

    if condition_type == "stat_threshold":
        stat_key = normalized.get("condition_stat_key")
        if not isinstance(stat_key, str):
            return False
        normalized_key = stat_key.strip().lower()
        if normalized_key not in AUTO_TITLE_STAT_FIELDS:
            return False
        return int(getattr(student, normalized_key, 0)) >= target_count

    return False


def _issue_auto_titles_for_students(student_ids: list[int], db: Session) -> None:
    unique_student_ids = sorted({student_id for student_id in student_ids if student_id > 0})
    if not unique_student_ids:
        return

    students = {
        student.id: student
        for student in db.query(Student).filter(Student.id.in_(unique_student_ids)).all()
    }
    if not students:
        return

    definitions = _get_class_title_definitions(db)
    issues = _get_card_issues(db)

    for definition in definitions:
        normalized_definition = _normalize_title_definition(definition)
        if normalized_definition.get("achievement_mode") != "auto":
            continue

        eligible_student_ids = [
            student_id
            for student_id in unique_student_ids
            if (student := students.get(student_id)) is not None
            and _is_auto_title_eligible(
                student=student,
                title_definition=normalized_definition,
                issues=issues,
            )
        ]
        if not eligible_student_ids:
            continue

        _issue_title_to_students(
            title_definition=normalized_definition,
            student_ids=eligible_student_ids,
            awarded_reason=f"자동 달성: {str(normalized_definition.get('condition_text', '')).strip()}",
            awarded_by_user_id=None,
            db=db,
        )


def _issue_title_to_students(
    *,
    title_definition: dict[str, object],
    student_ids: list[int],
    awarded_reason: str | None,
    awarded_by_user_id: int | None,
    db: Session,
    reward_exp_override: int | None = None,
    reward_won_override: int | None = None,
) -> StudentTitleIssueResult:
    title_id = int(title_definition.get("id", 0))
    if title_id <= 0:
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    if not student_ids:
        return StudentTitleIssueResult(
            title_definition_id=title_id,
            issued_count=0,
            skipped_student_ids=[],
        )

    students = db.query(Student).filter(Student.id.in_(student_ids)).all()
    valid_ids = {student.id for student in students}

    reward_exp = (
        max(0, int(reward_exp_override))
        if reward_exp_override is not None
        else max(0, int(title_definition.get("reward_exp", 40)))
    )
    reward_won = (
        max(0, int(reward_won_override))
        if reward_won_override is not None
        else max(0, int(title_definition.get("reward_won", 80)))
    )

    issued_count = 0
    skipped_student_ids: list[int] = []

    for student in students:
        notes = _parse_notes(student)
        earned_titles = _embedded_earned_titles(notes)

        already_earned = any(
            int(item.get("title_definition_id", 0)) == title_id
            for item in earned_titles
        )
        if already_earned:
            skipped_student_ids.append(student.id)
            continue

        awarded_at_iso = datetime.now(UTC).isoformat()
        earned_titles.insert(
            0,
            {
                "id": _next_embedded_id(earned_titles),
                "title_definition_id": title_id,
                "awarded_reason": awarded_reason,
                "awarded_at": awarded_at_iso,
                "awarded_by_user_id": awarded_by_user_id,
            },
        )
        notes["earned_titles"] = earned_titles

        if not isinstance(notes.get("active_title_definition_id"), int):
            notes["active_title_definition_id"] = title_id
            student.title = str(title_definition.get("title_name", student.title))

        student.total_exp += reward_exp
        student.level = _level_from_total_exp(student.total_exp)
        student.won_balance += reward_won

        _append_custom_activity(
            notes,
            {
                "log_type": "title",
                "title": str(title_definition.get("title_name", "칭호")),
                "description": (
                    f"칭호 획득 보상 지급 (EXP +{reward_exp}, 원 +{reward_won})"
                    if reward_exp > 0 or reward_won > 0
                    else "칭호 획득"
                ),
                "reward_won": reward_won,
                "reward_nyang": 0,
                "created_at": awarded_at_iso,
            },
        )

        _save_notes(student, notes)
        issued_count += 1

    for student_id in student_ids:
        if student_id not in valid_ids and student_id not in skipped_student_ids:
            skipped_student_ids.append(student_id)

    return StudentTitleIssueResult(
        title_definition_id=title_id,
        issued_count=issued_count,
        skipped_student_ids=sorted(skipped_student_ids),
    )


@router.get("/titles", response_model=list[TitleDefinitionRead])
def list_class_titles(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    definitions = _get_class_title_definitions(db)

    recipient_count_map: dict[int, int] = {}
    for student in db.query(Student).all():
        notes = _parse_notes(student)
        for earned in _embedded_earned_titles(notes):
            title_id = int(earned.get("title_definition_id", 0))
            if title_id <= 0:
                continue
            recipient_count_map[title_id] = recipient_count_map.get(title_id, 0) + 1

    results = [
        TitleDefinitionRead(
            id=int(item.get("id", 0)),
            title_name=str(item.get("title_name", "")),
            description=(str(item.get("description")) if isinstance(item.get("description"), str) else None),
            condition_text=str(item.get("condition_text", "")),
            icon_key=(str(item.get("icon_key")) if isinstance(item.get("icon_key"), str) else None),
            frame_key=(str(item.get("frame_key")) if isinstance(item.get("frame_key"), str) else None),
            icon_public_url=(
                str(item.get("icon_public_url")) if isinstance(item.get("icon_public_url"), str) else None
            ),
            icon_object_key=(
                str(item.get("icon_object_key")) if isinstance(item.get("icon_object_key"), str) else None
            ),
            icon_original_filename=(
                str(item.get("icon_original_filename"))
                if isinstance(item.get("icon_original_filename"), str)
                else None
            ),
            icon_content_type=(
                str(item.get("icon_content_type")) if isinstance(item.get("icon_content_type"), str) else None
            ),
            reward_exp=max(0, int(item.get("reward_exp", 40))),
            reward_won=max(0, int(item.get("reward_won", 80))),
            achievement_mode=str(item.get("achievement_mode", "manual")),
            auto_condition_type=str(item.get("auto_condition_type", "none")),
            condition_card_id=(
                int(item.get("condition_card_id"))
                if isinstance(item.get("condition_card_id"), int)
                else None
            ),
            condition_stat_key=(
                str(item.get("condition_stat_key"))
                if isinstance(item.get("condition_stat_key"), str)
                else None
            ),
            condition_target_count=(
                int(item.get("condition_target_count"))
                if isinstance(item.get("condition_target_count"), int)
                else None
            ),
            is_active=item.get("is_active") is not False,
            recipient_count=recipient_count_map.get(int(item.get("id", 0)), 0),
            created_at=_parse_iso_datetime(item.get("created_at")),
            updated_at=_parse_iso_datetime(item.get("updated_at")),
        )
        for item in definitions
        if int(item.get("id", 0)) > 0
    ]

    results.sort(key=lambda row: (not row.is_active, row.title_name.lower()))
    if include_inactive:
        return results
    return [item for item in results if item.is_active]


@router.post("/titles", response_model=TitleDefinitionRead)
def create_class_title(
    payload: TitleDefinitionCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    definitions = _get_class_title_definitions(db)
    duplicate = next(
        (
            item
            for item in definitions
            if str(item.get("title_name", "")).strip().lower() == payload.title_name.strip().lower()
        ),
        None,
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="동일한 이름의 칭호가 이미 존재합니다.")

    now_iso = datetime.now(UTC).isoformat()
    created = {
        "id": _next_embedded_id(definitions),
        **_title_payload_to_dict(payload),
        "is_active": payload.is_active,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    created = _normalize_title_definition(created)
    definitions.append(created)
    _set_class_title_definitions(db, definitions)
    db.commit()

    return TitleDefinitionRead(
        id=int(created["id"]),
        title_name=str(created["title_name"]),
        description=(str(created["description"]) if isinstance(created.get("description"), str) else None),
        condition_text=str(created["condition_text"]),
        icon_key=(str(created["icon_key"]) if isinstance(created.get("icon_key"), str) else None),
        frame_key=(str(created["frame_key"]) if isinstance(created.get("frame_key"), str) else None),
        icon_public_url=(
            str(created["icon_public_url"])
            if isinstance(created.get("icon_public_url"), str)
            else None
        ),
        icon_object_key=(
            str(created["icon_object_key"])
            if isinstance(created.get("icon_object_key"), str)
            else None
        ),
        icon_original_filename=(
            str(created["icon_original_filename"])
            if isinstance(created.get("icon_original_filename"), str)
            else None
        ),
        icon_content_type=(
            str(created["icon_content_type"])
            if isinstance(created.get("icon_content_type"), str)
            else None
        ),
        reward_exp=max(0, int(created.get("reward_exp", 40))),
        reward_won=max(0, int(created.get("reward_won", 80))),
        achievement_mode=str(created.get("achievement_mode", "manual")),
        auto_condition_type=str(created.get("auto_condition_type", "none")),
        condition_card_id=(
            int(created.get("condition_card_id"))
            if isinstance(created.get("condition_card_id"), int)
            else None
        ),
        condition_stat_key=(
            str(created.get("condition_stat_key"))
            if isinstance(created.get("condition_stat_key"), str)
            else None
        ),
        condition_target_count=(
            int(created.get("condition_target_count"))
            if isinstance(created.get("condition_target_count"), int)
            else None
        ),
        is_active=created.get("is_active") is not False,
        recipient_count=0,
        created_at=_parse_iso_datetime(created.get("created_at")),
        updated_at=_parse_iso_datetime(created.get("updated_at")),
    )


@router.patch("/titles/{title_id}", response_model=TitleDefinitionRead)
def update_class_title(
    title_id: int,
    payload: TitleDefinitionUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    definitions = _get_class_title_definitions(db)
    target = next((item for item in definitions if int(item.get("id", -1)) == title_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    if payload.title_name is not None:
        duplicate = next(
            (
                item
                for item in definitions
                if int(item.get("id", -1)) != title_id
                and str(item.get("title_name", "")).strip().lower() == payload.title_name.strip().lower()
            ),
            None,
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="동일한 이름의 칭호가 이미 존재합니다.")
        target["title_name"] = payload.title_name

    if payload.description is not None:
        target["description"] = payload.description
    if payload.condition_text is not None:
        target["condition_text"] = payload.condition_text
    if payload.icon_key is not None:
        target["icon_key"] = payload.icon_key
    if payload.frame_key is not None:
        target["frame_key"] = payload.frame_key
    if payload.icon_public_url is not None:
        target["icon_public_url"] = payload.icon_public_url
    if payload.icon_object_key is not None:
        target["icon_object_key"] = payload.icon_object_key
    if payload.icon_original_filename is not None:
        target["icon_original_filename"] = payload.icon_original_filename
    if payload.icon_content_type is not None:
        target["icon_content_type"] = payload.icon_content_type
    if payload.reward_exp is not None:
        target["reward_exp"] = payload.reward_exp
    if payload.reward_won is not None:
        target["reward_won"] = payload.reward_won
    if payload.achievement_mode is not None:
        target["achievement_mode"] = payload.achievement_mode
    if payload.auto_condition_type is not None:
        target["auto_condition_type"] = payload.auto_condition_type
    if payload.condition_card_id is not None:
        target["condition_card_id"] = payload.condition_card_id
    if payload.condition_stat_key is not None:
        target["condition_stat_key"] = payload.condition_stat_key
    if payload.condition_target_count is not None:
        target["condition_target_count"] = payload.condition_target_count
    if payload.is_active is not None:
        target["is_active"] = payload.is_active

    target["updated_at"] = datetime.now(UTC).isoformat()
    normalized_target = _normalize_title_definition(target)
    for index, item in enumerate(definitions):
        if int(item.get("id", -1)) == title_id:
            definitions[index] = normalized_target
            break
    target = normalized_target

    _set_class_title_definitions(db, definitions)
    db.commit()

    recipient_count = 0
    for student in db.query(Student).all():
        notes = _parse_notes(student)
        if any(int(item.get("title_definition_id", 0)) == title_id for item in _embedded_earned_titles(notes)):
            recipient_count += 1

    return TitleDefinitionRead(
        id=int(target.get("id", 0)),
        title_name=str(target.get("title_name", "")),
        description=(str(target.get("description")) if isinstance(target.get("description"), str) else None),
        condition_text=str(target.get("condition_text", "")),
        icon_key=(str(target.get("icon_key")) if isinstance(target.get("icon_key"), str) else None),
        frame_key=(str(target.get("frame_key")) if isinstance(target.get("frame_key"), str) else None),
        icon_public_url=(str(target.get("icon_public_url")) if isinstance(target.get("icon_public_url"), str) else None),
        icon_object_key=(str(target.get("icon_object_key")) if isinstance(target.get("icon_object_key"), str) else None),
        icon_original_filename=(
            str(target.get("icon_original_filename"))
            if isinstance(target.get("icon_original_filename"), str)
            else None
        ),
        icon_content_type=(
            str(target.get("icon_content_type")) if isinstance(target.get("icon_content_type"), str) else None
        ),
        reward_exp=max(0, int(target.get("reward_exp", 40))),
        reward_won=max(0, int(target.get("reward_won", 80))),
        achievement_mode=str(target.get("achievement_mode", "manual")),
        auto_condition_type=str(target.get("auto_condition_type", "none")),
        condition_card_id=(
            int(target.get("condition_card_id"))
            if isinstance(target.get("condition_card_id"), int)
            else None
        ),
        condition_stat_key=(
            str(target.get("condition_stat_key"))
            if isinstance(target.get("condition_stat_key"), str)
            else None
        ),
        condition_target_count=(
            int(target.get("condition_target_count"))
            if isinstance(target.get("condition_target_count"), int)
            else None
        ),
        is_active=target.get("is_active") is not False,
        recipient_count=recipient_count,
        created_at=_parse_iso_datetime(target.get("created_at")),
        updated_at=_parse_iso_datetime(target.get("updated_at")),
    )


@router.delete("/titles/{title_id}")
def delete_class_title(
    title_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    definitions = _get_class_title_definitions(db)
    filtered = [item for item in definitions if int(item.get("id", -1)) != title_id]
    if len(filtered) == len(definitions):
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    _set_class_title_definitions(db, filtered)

    students = db.query(Student).all()
    for student in students:
        notes = _parse_notes(student)
        earned = _embedded_earned_titles(notes)
        next_earned = [
            row
            for row in earned
            if int(row.get("title_definition_id", -1)) != title_id
        ]
        if len(next_earned) != len(earned):
            notes["earned_titles"] = next_earned
            active_title_id = notes.get("active_title_definition_id")
            if active_title_id == title_id:
                notes["active_title_definition_id"] = None
                if next_earned:
                    first_title_id = int(next_earned[0].get("title_definition_id", 0))
                    replacement = next(
                        (item for item in filtered if int(item.get("id", -1)) == first_title_id),
                        None,
                    )
                    student.title = (
                        str(replacement.get("title_name", student.title))
                        if replacement
                        else student.title
                    )
                else:
                    student.title = "새싹 도전자"
            _save_notes(student, notes)

    db.commit()
    return {"success": True}


@router.get("/titles/{title_id}/recipients", response_model=list[StudentTitleRecipientRead])
def list_title_recipients(
    title_id: int,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    definitions = _get_class_title_definitions(db)
    if not any(int(item.get("id", -1)) == title_id for item in definitions):
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    recipients: list[StudentTitleRecipientRead] = []
    students = db.query(Student).order_by(asc(Student.student_number), asc(Student.id)).all()
    for student in students:
        notes = _parse_notes(student)
        earned = _embedded_earned_titles(notes)
        is_recipient = any(int(item.get("title_definition_id", 0)) == title_id for item in earned)
        if is_recipient:
            recipients.append(
                StudentTitleRecipientRead(
                    student_id=student.id,
                    student_number=student.student_number,
                    student_name=student.name,
                    level=student.level,
                )
            )

    return recipients


@router.post("/titles/{title_id}/issue", response_model=StudentTitleIssueResult)
def issue_title_to_students(
    title_id: int,
    payload: StudentTitleIssueCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)

    definitions = _get_class_title_definitions(db)
    target = next((item for item in definitions if int(item.get("id", -1)) == title_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    result = _issue_title_to_students(
        title_definition=target,
        student_ids=payload.student_ids,
        awarded_reason=payload.awarded_reason,
        awarded_by_user_id=_current_user_id(auth_payload),
        db=db,
        reward_exp_override=payload.reward_exp,
        reward_won_override=payload.reward_won,
    )
    db.commit()
    return result


@router.get("/students/{student_id}/titles", response_model=list[TitleDefinitionRead])
def list_title_definitions_for_student(
    student_id: int,
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    student = _ensure_student(student_id, db)
    available_titles, _ = _build_student_titles(student, db)

    if include_inactive:
        return available_titles
    return [title for title in available_titles if title.is_active]


@router.post("/students/{student_id}/titles/{title_id}/grant", response_model=StudentTitleRead)
def grant_title_to_student(
    student_id: int,
    title_id: int,
    payload: StudentTitleGrantCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_title_management_permission(auth_payload)
    student = _ensure_student(student_id, db)

    definitions = _get_class_title_definitions(db)
    target = next((item for item in definitions if int(item.get("id", -1)) == title_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    result = _issue_title_to_students(
        title_definition=target,
        student_ids=[student_id],
        awarded_reason=payload.awarded_reason,
        awarded_by_user_id=_current_user_id(auth_payload),
        db=db,
    )
    if result.issued_count == 0:
        raise HTTPException(status_code=400, detail="이미 획득한 칭호입니다.")

    db.commit()

    _, earned_titles = _build_student_titles(student, db)
    target_earned = next((item for item in earned_titles if item.title_definition_id == title_id), None)
    if not target_earned:
        raise HTTPException(status_code=500, detail="칭호 지급 후 조회에 실패했습니다.")
    return target_earned


@router.patch("/students/{student_id}/titles/{title_id}/select", response_model=StudentRead)
def select_student_title(
    student_id: int,
    title_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, student_id)
    student = _ensure_student(student_id, db)
    notes = _parse_notes(student)
    earned = _embedded_earned_titles(notes)

    has_target = any(int(item.get("title_definition_id", 0)) == title_id for item in earned)
    if not has_target:
        raise HTTPException(status_code=400, detail="획득한 칭호만 선택할 수 있습니다.")

    definitions = _get_class_title_definitions(db)
    target_definition = next((item for item in definitions if int(item.get("id", -1)) == title_id), None)
    if not target_definition:
        raise HTTPException(status_code=404, detail="칭호를 찾을 수 없습니다.")

    notes["active_title_definition_id"] = title_id
    student.title = str(target_definition.get("title_name", student.title))
    _save_notes(student, notes)

    db.commit()
    db.refresh(student)
    return student


@router.patch("/students/{student_id}/economy", response_model=StudentEconomyRead)
def update_student_economy_as_admin(
    student_id: int,
    payload: StudentAdminEconomyUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    student = _ensure_student(student_id, db)
    _require_student_economy_permission(auth_payload, student)

    if payload.total_exp is not None:
        student.total_exp = payload.total_exp
        student.level = _level_from_total_exp(payload.total_exp)

    if payload.won_balance is not None:
        student.won_balance = payload.won_balance

    if payload.nyang_balance is not None:
        student.nyang_balance = payload.nyang_balance

    if payload.core_balance is not None:
        student.core_balance = payload.core_balance

    if payload.starlight_shard_balance is not None:
        student.starlight_shard_balance = payload.starlight_shard_balance

    if payload.wisdom is not None:
        student.wisdom = payload.wisdom

    if payload.creativity is not None:
        student.creativity = payload.creativity

    if payload.personality is not None:
        student.personality = payload.personality

    if payload.vitality is not None:
        student.vitality = payload.vitality

    if payload.diligence is not None:
        student.diligence = payload.diligence

    if payload.communication is not None:
        student.communication = payload.communication

    _issue_auto_titles_for_students([student.id], db)

    db.commit()
    db.refresh(student)
    return _compute_student_economy(student)


@router.post("/students/{student_id}/photos", response_model=StudentPhotoAssetRead)
def create_student_photo_asset(
    student_id: int,
    payload: StudentPhotoAssetCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, student_id)
    student = _ensure_student(student_id, db)
    notes = _parse_notes(student)
    photos = _embedded_photos(notes)

    photo = {
        "id": _next_embedded_id(photos),
        "public_url": payload.public_url,
        "object_key": payload.object_key,
        "original_filename": payload.original_filename,
        "content_type": payload.content_type,
        "created_at": datetime.now(UTC).isoformat(),
    }
    photos.insert(0, photo)
    notes["photos"] = photos

    _save_notes(student, notes)
    db.commit()

    return StudentPhotoAssetRead(
        id=int(photo["id"]),
        student_id=student_id,
        public_url=payload.public_url,
        object_key=payload.object_key,
        original_filename=payload.original_filename,
        content_type=payload.content_type,
        created_at=datetime.fromisoformat(str(photo["created_at"])),
    )


@router.post("/students/{student_id}/avatars/{avatar_item_id}/equip", response_model=list[StudentAvatarItemRead])
def equip_student_avatar_item(
    student_id: int,
    avatar_item_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, student_id)
    student = _ensure_student(student_id, db)
    notes = _parse_notes(student)
    avatars = _embedded_avatars(student, notes)

    target_item: dict[str, object] | None = None
    for item in avatars:
        if int(item.get("id", -1)) == avatar_item_id and item.get("is_owned") is not False:
            target_item = item
            break

    if not target_item:
        raise HTTPException(status_code=404, detail="아바타 아이템을 찾을 수 없습니다.")

    target_slot = str(target_item.get("slot", "face"))
    for item in avatars:
        if str(item.get("slot", "face")) == target_slot:
            item["is_equipped"] = False
    target_item["is_equipped"] = True

    notes["avatars"] = avatars

    _save_notes(student, notes)
    db.commit()

    return [
        StudentAvatarItemRead(
            id=int(item.get("id", 0)),
            student_id=student.id,
            slot=str(item.get("slot", "face")),
            name=str(item.get("name", "아바타")),
            rarity=str(item.get("rarity", "일반")),
            image_url=(str(item.get("image_url")) if isinstance(item.get("image_url"), str) else None),
            bonus_diligence=int(item.get("bonus_diligence", 0)),
            bonus_stamina=int(item.get("bonus_stamina", 0)),
            bonus_intellect=int(item.get("bonus_intellect", 0)),
            bonus_communication=int(item.get("bonus_communication", 0)),
            bonus_personality=int(item.get("bonus_personality", 0)),
            bonus_leadership=int(item.get("bonus_leadership", 0)),
            is_owned=item.get("is_owned") is not False,
            is_equipped=item.get("is_equipped") is True,
            obtained_at=datetime.fromisoformat(str(item.get("obtained_at", datetime.now(UTC).isoformat()))),
        )
        for item in avatars
    ]


@router.post("/students", response_model=StudentRead)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    existing_code = db.query(Student).filter(Student.access_code == payload.access_code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="이미 사용 중인 참여 코드입니다.")

    student = Student(**payload.model_dump(), created_by_user_id=_current_user_id(auth_payload))
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.post("/students/{student_id}/card-events", response_model=CardEventRead)
def issue_card_event(
    student_id: int,
    payload: CardEventCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    student = _ensure_student(student_id, db)

    signed_delta = payload.stat_delta if payload.event_type == "praise" else -payload.stat_delta
    student.class_points += signed_delta
    student.level = max(1, student.level + payload.level_delta)

    event = CardEvent(
        student_id=student_id,
        issuer_user_id=_current_user_id(auth_payload),
        event_type=payload.event_type,
        stat_delta=payload.stat_delta,
        level_delta=payload.level_delta,
        reason=payload.reason,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/students/{student_id}/bank-transactions", response_model=BankTransactionRead)
def create_bank_transaction(
    student_id: int,
    payload: BankTransactionCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    student = _ensure_student(student_id, db)

    if payload.transaction_type == "withdraw" and student.class_points < payload.amount:
        raise HTTPException(status_code=400, detail="포인트 잔액이 부족합니다.")

    if payload.transaction_type == "deposit":
        student.class_points += payload.amount
    else:
        student.class_points -= payload.amount

    transaction = BankTransaction(
        student_id=student_id,
        teacher_user_id=_current_user_id(auth_payload),
        transaction_type=payload.transaction_type,
        amount=payload.amount,
        memo=payload.memo,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def _build_funding_project_read(project: FundingProject, db: Session) -> FundingProjectRead:
    contribution_count = (
        db.query(FundingContribution).filter(FundingContribution.project_id == project.id).count()
    )
    contributor_count = (
        db.query(func.count(func.distinct(FundingContribution.student_id)))
        .filter(FundingContribution.project_id == project.id)
        .scalar()
        or 0
    )
    progress_percent = 0.0
    if project.target_amount > 0:
        progress_percent = min(100.0, round((project.current_amount / project.target_amount) * 100, 1))

    return FundingProjectRead(
        id=project.id,
        title=project.title,
        description=project.description,
        reward_plan=project.reward_plan,
        target_amount=project.target_amount,
        current_amount=project.current_amount,
        status=project.status,
        progress_percent=progress_percent,
        contributor_count=int(contributor_count),
        contribution_count=int(contribution_count),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("/shop/items", response_model=list[ShopItemRead])
def list_shop_items(
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    return db.query(ShopItem).filter(ShopItem.is_active.is_(True)).order_by(asc(ShopItem.id)).all()


@router.post("/shop/items", response_model=ShopItemRead)
def create_shop_item(
    payload: ShopItemCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    item = ShopItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/shop/purchase", response_model=ShopPurchaseRead)
def purchase_item(
    payload: ShopPurchaseCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    item = db.query(ShopItem).filter(ShopItem.id == payload.item_id, ShopItem.is_active.is_(True)).first()
    if not item:
        raise HTTPException(status_code=404, detail="아이템을 찾을 수 없습니다.")

    if item.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="재고가 부족합니다.")

    total_cost = item.cost_points * payload.quantity
    if student.class_points < total_cost:
        raise HTTPException(status_code=400, detail="포인트가 부족합니다.")

    student.class_points -= total_cost
    item.stock -= payload.quantity

    purchase = ShopPurchase(
        student_id=student.id,
        item_id=item.id,
        quantity=payload.quantity,
        total_cost=total_cost,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


@router.get("/activity-shop/coupons", response_model=list[ActivityCouponRead])
def list_activity_coupons(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    query = db.query(ActivityCoupon)
    if not include_inactive:
        query = query.filter(ActivityCoupon.is_active.is_(True))
    return query.order_by(asc(ActivityCoupon.id)).all()


@router.post("/activity-shop/coupons", response_model=ActivityCouponRead)
def create_activity_coupon(
    payload: ActivityCouponCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="쿠폰은 교사/관리자만 생성할 수 있습니다.")

    coupon = ActivityCoupon(
        **payload.model_dump(),
        created_by_user_id=_current_user_id(auth_payload),
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.patch("/activity-shop/coupons/{coupon_id}", response_model=ActivityCouponRead)
def update_activity_coupon(
    coupon_id: int,
    payload: ActivityCouponUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="쿠폰은 교사/관리자만 수정할 수 있습니다.")

    coupon = db.query(ActivityCoupon).filter(ActivityCoupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="쿠폰을 찾을 수 없습니다.")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return coupon

    for key, value in updates.items():
        setattr(coupon, key, value)

    db.commit()
    db.refresh(coupon)
    return coupon


@router.delete("/activity-shop/coupons/{coupon_id}")
def delete_activity_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="쿠폰은 교사/관리자만 관리할 수 있습니다.")

    coupon = db.query(ActivityCoupon).filter(ActivityCoupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="쿠폰을 찾을 수 없습니다.")

    linked_purchase_count = (
        db.query(func.count(ActivityCouponPurchase.id))
        .filter(ActivityCouponPurchase.coupon_id == coupon.id)
        .scalar()
        or 0
    )
    linked_usage_count = (
        db.query(func.count(ActivityCouponUsage.id))
        .filter(ActivityCouponUsage.coupon_id == coupon.id)
        .scalar()
        or 0
    )
    if linked_purchase_count > 0 or linked_usage_count > 0:
        raise HTTPException(
            status_code=400,
            detail="기록이 있는 쿠폰은 삭제할 수 없습니다. 기록 취소 후 다시 시도해 주세요.",
        )

    db.delete(coupon)
    db.commit()
    return {"success": True}


@router.post("/activity-shop/coupons/purchase", response_model=ActivityCouponPurchaseRead)
def purchase_activity_coupon(
    payload: ActivityCouponPurchaseCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, payload.student_id)

    student = db.query(Student).filter(Student.id == payload.student_id, Student.is_active.is_(True)).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    coupon = (
        db.query(ActivityCoupon)
        .filter(ActivityCoupon.id == payload.coupon_id, ActivityCoupon.is_active.is_(True))
        .first()
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="쿠폰을 찾을 수 없습니다.")

    if coupon.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="쿠폰 재고가 부족합니다.")

    total_price = coupon.price_gold * payload.quantity
    if student.won_balance < total_price:
        raise HTTPException(status_code=400, detail="원이 부족합니다.")

    student.won_balance -= total_price
    coupon.stock -= payload.quantity

    purchase = ActivityCouponPurchase(
        student_id=student.id,
        coupon_id=coupon.id,
        quantity=payload.quantity,
        total_price_gold=total_price,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


@router.post("/activity-shop/coupons/use", response_model=ActivityCouponUsageRead)
def use_activity_coupon(
    payload: ActivityCouponUsageCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, payload.student_id)

    student = db.query(Student).filter(Student.id == payload.student_id, Student.is_active.is_(True)).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    coupon = db.query(ActivityCoupon).filter(ActivityCoupon.id == payload.coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="쿠폰을 찾을 수 없습니다.")

    purchased_quantity = (
        db.query(func.coalesce(func.sum(ActivityCouponPurchase.quantity), 0))
        .filter(
            ActivityCouponPurchase.student_id == student.id,
            ActivityCouponPurchase.coupon_id == coupon.id,
        )
        .scalar()
        or 0
    )
    used_quantity = (
        db.query(func.coalesce(func.sum(ActivityCouponUsage.quantity), 0))
        .filter(
            ActivityCouponUsage.student_id == student.id,
            ActivityCouponUsage.coupon_id == coupon.id,
        )
        .scalar()
        or 0
    )
    remaining_quantity = int(purchased_quantity) - int(used_quantity)

    if remaining_quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="사용 가능한 쿠폰 수량이 부족합니다.")

    usage = ActivityCouponUsage(
        student_id=student.id,
        coupon_id=coupon.id,
        quantity=payload.quantity,
        note=payload.note,
    )
    db.add(usage)
    db.commit()
    db.refresh(usage)
    return usage


@router.get("/activity-shop/students/{student_id}/coupon-inventory", response_model=list[StudentCouponInventoryRow])
def get_student_coupon_inventory(
    student_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_or_teacher(auth_payload, student_id)

    student = db.query(Student).filter(Student.id == student_id, Student.is_active.is_(True)).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    coupons = db.query(ActivityCoupon).order_by(asc(ActivityCoupon.id)).all()
    rows: list[StudentCouponInventoryRow] = []
    for coupon in coupons:
        purchased_quantity = (
            db.query(func.coalesce(func.sum(ActivityCouponPurchase.quantity), 0))
            .filter(
                ActivityCouponPurchase.student_id == student.id,
                ActivityCouponPurchase.coupon_id == coupon.id,
            )
            .scalar()
            or 0
        )
        used_quantity = (
            db.query(func.coalesce(func.sum(ActivityCouponUsage.quantity), 0))
            .filter(
                ActivityCouponUsage.student_id == student.id,
                ActivityCouponUsage.coupon_id == coupon.id,
            )
            .scalar()
            or 0
        )
        remaining_quantity = int(purchased_quantity) - int(used_quantity)
        if purchased_quantity <= 0 and used_quantity <= 0:
            continue

        rows.append(
            StudentCouponInventoryRow(
                coupon_id=coupon.id,
                coupon_name=coupon.name,
                icon_emoji=coupon.icon_emoji,
                purchased_quantity=int(purchased_quantity),
                used_quantity=int(used_quantity),
                remaining_quantity=max(0, remaining_quantity),
            )
        )

    return rows


@router.get("/activity-shop/coupon-ledger", response_model=list[CouponLedgerEntryRead])
def get_coupon_ledger(
    coupon_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    session_student_id = _student_session_student_id(auth_payload)
    is_manager = _has_teacher_mode_access(auth_payload)

    purchase_query = db.query(ActivityCouponPurchase, ActivityCoupon, Student).join(
        ActivityCoupon, ActivityCoupon.id == ActivityCouponPurchase.coupon_id
    ).join(Student, Student.id == ActivityCouponPurchase.student_id)

    usage_query = db.query(ActivityCouponUsage, ActivityCoupon, Student).join(
        ActivityCoupon, ActivityCoupon.id == ActivityCouponUsage.coupon_id
    ).join(Student, Student.id == ActivityCouponUsage.student_id)

    if coupon_id is not None:
        purchase_query = purchase_query.filter(ActivityCouponPurchase.coupon_id == coupon_id)
        usage_query = usage_query.filter(ActivityCouponUsage.coupon_id == coupon_id)

    if not is_manager:
        if session_student_id is None:
            raise HTTPException(status_code=403, detail="쿠폰 기록을 볼 수 있는 권한이 없습니다.")
        purchase_query = purchase_query.filter(ActivityCouponPurchase.student_id == session_student_id)
        usage_query = usage_query.filter(ActivityCouponUsage.student_id == session_student_id)

    purchases = purchase_query.order_by(desc(ActivityCouponPurchase.created_at)).limit(300).all()
    usages = usage_query.order_by(desc(ActivityCouponUsage.created_at)).limit(300).all()

    entries: list[CouponLedgerEntryRead] = []
    for purchase, coupon, student in purchases:
        entries.append(
            CouponLedgerEntryRead(
                entry_id=purchase.id,
                entry_type="purchase",
                coupon_id=coupon.id,
                coupon_name=coupon.name,
                icon_emoji=coupon.icon_emoji,
                student_id=student.id,
                student_number=student.student_number,
                student_name=student.name,
                quantity=purchase.quantity,
                amount_gold=purchase.total_price_gold,
                note=None,
                created_at=purchase.created_at,
            )
        )

    for usage, coupon, student in usages:
        entries.append(
            CouponLedgerEntryRead(
                entry_id=usage.id,
                entry_type="usage",
                coupon_id=coupon.id,
                coupon_name=coupon.name,
                icon_emoji=coupon.icon_emoji,
                student_id=student.id,
                student_number=student.student_number,
                student_name=student.name,
                quantity=usage.quantity,
                amount_gold=0,
                note=usage.note,
                created_at=usage.created_at,
            )
        )

    entries.sort(key=lambda item: item.created_at, reverse=True)
    return entries[:300]


@router.post(
    "/activity-shop/coupon-ledger/{entry_type}/{entry_id}/cancel",
    response_model=CouponLedgerCancelRead,
)
def cancel_coupon_ledger_entry(
    entry_type: str,
    entry_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="구매/사용 취소는 관리자/교사만 가능합니다.")

    normalized_entry_type = entry_type.strip().lower()
    if normalized_entry_type not in {"purchase", "usage"}:
        raise HTTPException(status_code=400, detail="취소 타입은 purchase 또는 usage 여야 합니다.")

    if normalized_entry_type == "usage":
        usage = db.query(ActivityCouponUsage).filter(ActivityCouponUsage.id == entry_id).first()
        if not usage:
            raise HTTPException(status_code=404, detail="사용 기록을 찾을 수 없습니다.")

        db.delete(usage)
        db.commit()
        return CouponLedgerCancelRead(success=True, message="쿠폰 사용 기록을 취소했습니다.")

    purchase = db.query(ActivityCouponPurchase).filter(ActivityCouponPurchase.id == entry_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="구매 기록을 찾을 수 없습니다.")

    student = db.query(Student).filter(Student.id == purchase.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생 정보를 찾을 수 없습니다.")

    coupon = db.query(ActivityCoupon).filter(ActivityCoupon.id == purchase.coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="쿠폰 정보를 찾을 수 없습니다.")

    purchased_quantity = (
        db.query(func.coalesce(func.sum(ActivityCouponPurchase.quantity), 0))
        .filter(
            ActivityCouponPurchase.student_id == purchase.student_id,
            ActivityCouponPurchase.coupon_id == purchase.coupon_id,
        )
        .scalar()
        or 0
    )
    used_quantity = (
        db.query(func.coalesce(func.sum(ActivityCouponUsage.quantity), 0))
        .filter(
            ActivityCouponUsage.student_id == purchase.student_id,
            ActivityCouponUsage.coupon_id == purchase.coupon_id,
        )
        .scalar()
        or 0
    )
    remaining_quantity = int(purchased_quantity) - int(used_quantity)

    if remaining_quantity < purchase.quantity:
        raise HTTPException(
            status_code=400,
            detail="이미 사용된 수량이 포함된 구매 기록은 취소할 수 없습니다.",
        )

    student.won_balance += purchase.total_price_gold
    coupon.stock += purchase.quantity
    db.delete(purchase)
    db.commit()

    return CouponLedgerCancelRead(success=True, message="쿠폰 구매 기록을 취소했습니다.")


@router.get("/activity-shop/funding-projects", response_model=list[FundingProjectRead])
def list_funding_projects(
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    projects = db.query(FundingProject).order_by(desc(FundingProject.created_at)).all()
    return [_build_funding_project_read(project, db) for project in projects]


@router.post("/activity-shop/funding-projects", response_model=FundingProjectRead)
def create_funding_project(
    payload: FundingProjectCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="펀딩 프로젝트는 교사/관리자만 생성할 수 있습니다.")

    project = FundingProject(
        title=payload.title,
        description=payload.description,
        reward_plan=payload.reward_plan,
        target_amount=payload.target_amount,
        current_amount=0,
        status="active",
        created_by_user_id=_current_user_id(auth_payload),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _build_funding_project_read(project, db)


@router.patch("/activity-shop/funding-projects/{project_id}", response_model=FundingProjectRead)
def update_funding_project(
    project_id: int,
    payload: FundingProjectUpdate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="펀딩 프로젝트는 교사/관리자만 수정할 수 있습니다.")

    project = db.query(FundingProject).filter(FundingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    updates = payload.model_dump(exclude_unset=True)
    if "target_amount" in updates:
        target_amount = updates["target_amount"]
        if isinstance(target_amount, int) and target_amount < project.current_amount:
            raise HTTPException(status_code=400, detail="목표 금액은 현재 모금액보다 작을 수 없습니다.")

    for key, value in updates.items():
        setattr(project, key, value)

    if project.status == "completed" and project.completed_at is None:
        project.completed_at = datetime.now(UTC)

    db.commit()
    db.refresh(project)
    return _build_funding_project_read(project, db)


@router.delete("/activity-shop/funding-projects/{project_id}")
def close_funding_project(
    project_id: int,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    if not _has_teacher_mode_access(auth_payload):
        raise HTTPException(status_code=403, detail="펀딩 프로젝트는 교사/관리자만 관리할 수 있습니다.")

    project = db.query(FundingProject).filter(FundingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    project.status = "closed"
    db.commit()
    return {"success": True}


@router.post("/activity-shop/funding-projects/{project_id}/contributions", response_model=FundingContributionRead)
def create_funding_contribution(
    project_id: int,
    payload: FundingContributionCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    _require_student_self_edit_or_teacher(auth_payload, payload.student_id)

    project = db.query(FundingProject).filter(FundingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    if project.status != "active":
        raise HTTPException(status_code=400, detail="진행 중인 프로젝트에만 기부할 수 있습니다.")

    student = db.query(Student).filter(Student.id == payload.student_id, Student.is_active.is_(True)).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    if student.won_balance < payload.amount:
        raise HTTPException(status_code=400, detail="원이 부족합니다.")

    student.won_balance -= payload.amount
    project.current_amount += payload.amount

    if project.current_amount >= project.target_amount:
        project.status = "completed"
        if project.completed_at is None:
            project.completed_at = datetime.now(UTC)

    contribution = FundingContribution(
        project_id=project.id,
        student_id=student.id,
        amount=payload.amount,
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    return FundingContributionRead(
        id=contribution.id,
        project_id=contribution.project_id,
        student_id=contribution.student_id,
        student_number=student.student_number,
        student_name=student.name,
        amount=contribution.amount,
        created_at=contribution.created_at,
    )


@router.get("/activity-shop/funding-projects/{project_id}/detail", response_model=FundingProjectDetailRead)
def get_funding_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    project = db.query(FundingProject).filter(FundingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    contribution_rows = (
        db.query(FundingContribution, Student)
        .join(Student, Student.id == FundingContribution.student_id)
        .filter(FundingContribution.project_id == project.id)
        .order_by(desc(FundingContribution.created_at))
        .all()
    )

    contributions = [
        FundingContributionRead(
            id=contribution.id,
            project_id=contribution.project_id,
            student_id=student.id,
            student_number=student.student_number,
            student_name=student.name,
            amount=contribution.amount,
            created_at=contribution.created_at,
        )
        for contribution, student in contribution_rows
    ]

    return FundingProjectDetailRead(
        project=_build_funding_project_read(project, db),
        contributions=contributions,
    )


@router.post("/question-files", response_model=QuestionFileRead)
def create_question_file_record(
    payload: QuestionFileCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    file_record = QuestionFile(
        teacher_user_id=_current_user_id(auth_payload),
        public_url=payload.public_url,
        object_key=payload.object_key,
        original_filename=payload.original_filename,
        content_type=payload.content_type,
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    return file_record


@router.post("/questions/bulk", response_model=list[QuestionRead])
def bulk_create_questions(
    payload: QuestionBulkCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="업로드할 문제가 없습니다.")

    rows: list[QuestionBankItem] = []
    for row in payload.rows:
        model = QuestionBankItem(
            source_file_id=payload.source_file_id,
            subject=row.subject,
            unit_name=row.unit_name,
            prompt=row.prompt,
            answer=row.answer,
            difficulty=row.difficulty,
            bonus_attack=row.bonus_attack,
        )
        db.add(model)
        rows.append(model)

    db.commit()
    for row in rows:
        db.refresh(row)
    return rows


@router.get("/questions", response_model=list[QuestionRead])
def list_questions(
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    return db.query(QuestionBankItem).order_by(desc(QuestionBankItem.created_at)).all()


@router.post("/raid/sessions", response_model=RaidSessionRead)
def create_raid_session(
    payload: RaidSessionCreate,
    db: Session = Depends(get_db),
    auth_payload: dict[str, object] = Depends(require_auth),
):
    session = RaidSession(
        teacher_user_id=_current_user_id(auth_payload),
        title=payload.title,
        boss_name=payload.boss_name,
        boss_max_hp=payload.boss_max_hp,
        boss_current_hp=payload.boss_max_hp,
        class_max_hp=payload.class_max_hp,
        class_current_hp=payload.class_max_hp,
        status="active",
        started_at=datetime.now(UTC),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/raid/current", response_model=RaidSessionRead | None)
def get_current_raid(
    db: Session = Depends(get_db),
):
    return (
        db.query(RaidSession)
        .filter(RaidSession.status.in_(["scheduled", "active", "paused"]))
        .order_by(desc(RaidSession.created_at))
        .first()
    )


@router.post("/raid/sessions/{raid_id}/state", response_model=RaidSessionRead)
def update_raid_state(
    raid_id: int,
    payload: RaidStateUpdate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_auth),
):
    raid = db.query(RaidSession).filter(RaidSession.id == raid_id).first()
    if not raid:
        raise HTTPException(status_code=404, detail="레이드 세션을 찾을 수 없습니다.")

    raid.boss_current_hp = min(payload.boss_current_hp, raid.boss_max_hp)
    raid.class_current_hp = min(payload.class_current_hp, raid.class_max_hp)
    raid.status = payload.status
    if payload.status == "completed" and not raid.ended_at:
        raid.ended_at = datetime.now(UTC)

    db.commit()
    db.refresh(raid)
    return raid


@router.post("/raid/sessions/{raid_id}/actions", response_model=RaidActionRead)
def create_raid_action(
    raid_id: int,
    payload: RaidActionCreate,
    db: Session = Depends(get_db),
):
    raid = db.query(RaidSession).filter(RaidSession.id == raid_id).first()
    if not raid:
        raise HTTPException(status_code=404, detail="레이드 세션을 찾을 수 없습니다.")

    if raid.status not in {"active", "paused", "scheduled"}:
        raise HTTPException(status_code=400, detail="진행 중인 레이드가 아닙니다.")

    action = RaidActionLog(raid_session_id=raid_id, **payload.model_dump())
    db.add(action)

    raid.boss_current_hp = max(0, raid.boss_current_hp - payload.damage)
    raid.class_current_hp = min(raid.class_max_hp, raid.class_current_hp + payload.healing)
    if raid.boss_current_hp == 0:
        raid.status = "completed"
        raid.ended_at = datetime.now(UTC)

    db.commit()
    db.refresh(action)
    return action


@router.get("/raid/sessions/{raid_id}/log", response_model=list[RaidActionRead])
def get_raid_log(
    raid_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(RaidActionLog)
        .filter(RaidActionLog.raid_session_id == raid_id)
        .order_by(desc(RaidActionLog.created_at))
        .limit(150)
        .all()
    )


@router.get("/student-portal/{access_code}", response_model=StudentPortalSnapshot)
def get_student_snapshot(access_code: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.access_code == access_code).first()
    if not student:
        raise HTTPException(status_code=404, detail="참여 코드를 확인해주세요.")

    active_raid = (
        db.query(RaidSession)
        .filter(RaidSession.status.in_(["scheduled", "active", "paused"]))
        .order_by(desc(RaidSession.created_at))
        .first()
    )

    return StudentPortalSnapshot(student=student, active_raid=active_raid)


@router.post("/student-portal/{access_code}/strike", response_model=RaidActionRead)
def student_strike(access_code: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.access_code == access_code).first()
    if not student:
        raise HTTPException(status_code=404, detail="참여 코드를 확인해주세요.")

    raid = (
        db.query(RaidSession)
        .filter(RaidSession.status == "active")
        .order_by(desc(RaidSession.created_at))
        .first()
    )
    if not raid:
        raise HTTPException(status_code=400, detail="현재 진행 중인 레이드가 없습니다.")

    damage = max(1, student.attack_power + student.level)
    action = RaidActionLog(
        raid_session_id=raid.id,
        student_id=student.id,
        actor_name=student.name,
        action_type="strike",
        damage=damage,
        healing=0,
        message=f"{student.name}의 일격! {damage} 데미지",
    )
    db.add(action)

    raid.boss_current_hp = max(0, raid.boss_current_hp - damage)
    if raid.boss_current_hp == 0:
        raid.status = "completed"
        raid.ended_at = datetime.now(UTC)

    db.commit()
    db.refresh(action)
    return action
