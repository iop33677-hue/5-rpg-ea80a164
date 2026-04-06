import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  Activity,
  ArrowLeft,
  BadgePlus,
  Bell,
  BookOpen,
  BookMarked,
  Brain,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Coins,
  Compass,
  Crown,
  Eye,
  FileSpreadsheet,
  Flame,
  Gift,
  HandHeart,
  Heart,
  History,
  House,
  ImagePlus,
  Landmark,
  LibraryBig,
  Lightbulb,
  Lock,
  LogIn,
  Mail,
  Medal,
  MessageCircleHeart,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Pencil,
  Play,
  Rocket,
  ScrollText,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Sword,
  Swords,
  Target,
  TriangleAlert,
  Trophy,
  Trash2,
  Upload,
  UserRound,
  Dices,
  Users,
  WandSparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentUser, signIn, signOut, type User } from '@/lib/auth'
import { signInStudent } from '@/lib/api'
import {
  api,
  type ClassroomCard,
  type ClassroomCardCreatePayload,
  type ClassroomCardHistoryResponse,
  type ClassroomCardIssueResult,
  type ClassroomCardUpdatePayload,
  type ActivityCoupon,
  type ActivityCouponCreatePayload,
  type ActivityCouponPurchase,
  type ActivityCouponPurchasePayload,
  type ActivityCouponUpdatePayload,
  type ActivityCouponUsage,
  type ActivityCouponUsagePayload,
  type ClassroomOverview,
  type CouponLedgerCancelResponse,
  type CouponLedgerEntry,
  type FundingContribution,
  type FundingContributionPayload,
  type FundingProject,
  type FundingProjectCreatePayload,
  type FundingProjectDetail,
  type FundingProjectUpdatePayload,
  type LearningBoard,
  type LearningBoardComment,
  type LearningBoardCommentCreatePayload,
  type LearningBoardLikeToggleResponse,
  type LearningBoardPost,
  type LearningBoardPostCreatePayload,
  type LearningBoardUpdatePayload,
  type LearningBoardCreatePayload,
  type LearningBoardPostUpdatePayload,
  type QuestionItem,
  type MissionAchieverUpdateResult,
  type MissionCreatePayload,
  type MissionItem,
  type MissionUpdatePayload,
  type PublicStudentLoginItem,
  type RaidAction,
  type RaidSession,
  type ShopItem,
  type Student,
  type StudentDetail,
  type StudentEconomyUpdatePayload,
  type StudentCouponInventoryRow,
  type StudentLoginAccount,
  type StudentTitleRecipient,
  type TitleAchievementMode,
  type TitleAutoConditionType,
  type TitleDefinition,
  type TitleIssueResult,
  type UploadContract,
} from '@/lib/api'

interface ParsedQuestionRow {
  subject: string
  unit_name: string | null
  prompt: string
  answer: string
  difficulty: string
  bonus_attack: number
}

interface SidebarMenuItem {
  label: string
  icon: LucideIcon
  section: '학급 운영' | '학습 확장' | '상점 및 관리'
}

type ActivityFilterKey = 'all' | 'mission' | 'praise_card' | 'warning_card' | 'title' | 'raid'

interface TitleIconPreset {
  key: string
  label: string
  icon: LucideIcon
  className: string
}

interface TitleFramePreset {
  key: string
  label: string
  className: string
}

interface TitleFormState {
  title_name: string
  description: string
  condition_text: string
  icon_key: string
  frame_key: string
  reward_exp: string
  reward_won: string
  achievement_mode: TitleAchievementMode
  auto_condition_type: TitleAutoConditionType
  condition_card_id: string
  condition_stat_key: string
  condition_target_count: string
  icon_public_url: string | null
  icon_object_key: string | null
  icon_original_filename: string | null
  icon_content_type: string | null
}

interface TitleRewardConfig {
  reward_exp: number
  reward_won: number
}

interface MissionIconPreset {
  key: string
  label: string
  icon: LucideIcon
  className: string
}

interface MissionStatOption {
  key: string
  label: string
}

interface MissionFormState {
  title: string
  description: string
  icon_key: string
  target_stat_key: string
  target_stat_label: string
  reward_exp: string
  reward_won: string
  reward_nyang: string
  repeatable: boolean
  weekly_reset: boolean
  goal_count: string
}

interface CardIconPreset {
  key: string
  label: string
  icon: LucideIcon
  className: string
}

interface CardTabKey {
  key: 'praise' | 'warning'
  label: string
}

interface CardFormState {
  title: string
  description: string
  icon_key: string
  reward_exp: string
  reward_won: string
  reward_nyang: string
  level_delta: string
  selected_stat_keys: string[]
  stat_delta: string
}

type ClassToolTab = 'picker' | 'timer' | 'roulette'
type TimerMode = 'clock' | 'timer' | 'stopwatch'

interface DrawResult {
  student: Student
  drawOrder: number
}

interface TeamBucket {
  teamNumber: number
  students: Student[]
}

interface StopwatchLap {
  id: number
  timestamp: number
}

type ActivityShopTab = 'coupon-store' | 'coupon-record' | 'funding'
type LearningBoardSort = 'number' | 'latest' | 'likes'

interface LearningBoardFormState {
  title: string
  description: string
  cover_image_url: string
  is_active: boolean
}

interface LearningBoardPostFormState {
  content: string
  image_url: string
  image_object_key: string
  image_original_filename: string
}

interface LearningBoardCommentDraftState {
  [postId: number]: string
}

interface CouponFormState {
  name: string
  description: string
  icon_emoji: string
  price_gold: string
  stock: string
  is_active: boolean
}

interface CouponUseFormState {
  coupon_id: string
  quantity: string
  note: string
}

interface FundingFormState {
  title: string
  description: string
  reward_plan: string
  target_amount: string
}

type PickerPopupMode = 'single' | 'multi' | 'team'

interface PickerPopupState {
  mode: PickerPopupMode
  drawnStudents: DrawResult[]
  teamBuckets: TeamBucket[]
  teamCount: number | null
}

const titleIconPresets: TitleIconPreset[] = [
  { key: 'shield', label: '호위대', icon: Shield, className: 'from-[#285da8] to-[#152e58]' },
  { key: 'sparkles', label: '청금광', icon: Sparkles, className: 'from-[#39a7d7] to-[#0f546f]' },
  { key: 'crown', label: '왕실', icon: Crown, className: 'from-[#c68e2f] to-[#7b4c14]' },
  { key: 'star', label: '천궁성', icon: Star, className: 'from-[#7ca8f0] to-[#3448a4]' },
  { key: 'medal', label: '훈장', icon: Medal, className: 'from-[#8a83ff] to-[#4237a8]' },
  { key: 'sword', label: '검객', icon: Sword, className: 'from-[#d16d5f] to-[#6f1d21]' },
  { key: 'lock', label: '문지기', icon: Lock, className: 'from-[#5f768f] to-[#1c2a3f]' },
  { key: 'compass', label: '나침반', icon: Compass, className: 'from-[#33b2af] to-[#176b6f]' },
  { key: 'scroll', label: '비문', icon: ScrollText, className: 'from-[#a98758] to-[#5e4327]' },
  { key: 'archive', label: '기록자', icon: LibraryBig, className: 'from-[#7ea2d5] to-[#2e4f86]' },
  { key: 'gift', label: '축복', icon: Gift, className: 'from-[#d78ec8] to-[#7f3270]' },
  { key: 'coins', label: '금고', icon: Coins, className: 'from-[#d9a34c] to-[#84511a]' },
  { key: 'activity', label: '각성', icon: Activity, className: 'from-[#48a6bc] to-[#1a5567]' },
  { key: 'alert', label: '징벌', icon: Bell, className: 'from-[#d36f73] to-[#7a2527]' },
  { key: 'book', label: '서고', icon: BookOpen, className: 'from-[#58a3d4] to-[#224471]' },
  { key: 'badge', label: '명예', icon: BadgePlus, className: 'from-[#6fc89a] to-[#1f6a53]' },
  { key: 'landmark', label: '궁성', icon: Landmark, className: 'from-[#88a3bc] to-[#33485c]' },
  { key: 'wrench', label: '공학', icon: Wrench, className: 'from-[#90a2b6] to-[#38495c]' },
  { key: 'house', label: '가문', icon: House, className: 'from-[#8d8adb] to-[#433f83]' },
  { key: 'store', label: '장터', icon: Store, className: 'from-[#be8456] to-[#623820]' },
  { key: 'clipboard', label: '수행', icon: ClipboardCheck, className: 'from-[#58b495] to-[#1f6652]' },
  { key: 'mail', label: '전령', icon: Mail, className: 'from-[#5a9ec6] to-[#1c4a68]' },
  { key: 'notebook', label: '도감', icon: NotebookPen, className: 'from-[#9f83d9] to-[#4e3679]' },
  { key: 'users', label: '연맹', icon: Users, className: 'from-[#4ea5ac] to-[#1f595f]' },
]

const titleFramePresets: TitleFramePreset[] = [
  {
    key: 'royal',
    label: '황실 금장',
    className: 'ring-2 ring-[#f5d08d]/80 shadow-[0_0_0_1px_rgba(245,208,141,0.55),0_0_24px_rgba(245,173,66,0.35)]',
  },
  {
    key: 'aurora',
    label: '청월 광륜',
    className: 'ring-2 ring-[#74d4f5]/80 shadow-[0_0_0_1px_rgba(116,212,245,0.5),0_0_24px_rgba(63,195,255,0.3)]',
  },
  {
    key: 'flame',
    label: '화염 인장',
    className: 'ring-2 ring-[#f69c8f]/80 shadow-[0_0_0_1px_rgba(246,156,143,0.5),0_0_24px_rgba(250,94,73,0.32)]',
  },
  {
    key: 'arcane',
    label: '비전 주술',
    className: 'ring-2 ring-[#b8a9ff]/80 shadow-[0_0_0_1px_rgba(184,169,255,0.5),0_0_24px_rgba(143,121,255,0.3)]',
  },
  {
    key: 'jade',
    label: '비취 문양',
    className: 'ring-2 ring-[#8ad9bf]/80 shadow-[0_0_0_1px_rgba(138,217,191,0.55),0_0_24px_rgba(42,176,128,0.3)]',
  },
  {
    key: 'onyx',
    label: '흑철 장갑',
    className: 'ring-2 ring-[#8c95b1]/80 shadow-[0_0_0_1px_rgba(140,149,177,0.55),0_0_20px_rgba(68,77,106,0.35)]',
  },
  {
    key: 'sunrise',
    label: '해오름 빛살',
    className: 'ring-2 ring-[#f6bba1]/80 shadow-[0_0_0_1px_rgba(246,187,161,0.5),0_0_24px_rgba(252,133,74,0.28)]',
  },
  {
    key: 'frost',
    label: '한설 결정',
    className: 'ring-2 ring-[#bdd9ff]/80 shadow-[0_0_0_1px_rgba(189,217,255,0.5),0_0_24px_rgba(107,165,255,0.28)]',
  },
  {
    key: 'bloodmoon',
    label: '적월 문장',
    className: 'ring-2 ring-[#f18e95]/80 shadow-[0_0_0_1px_rgba(241,142,149,0.55),0_0_24px_rgba(232,70,84,0.3)]',
  },
  {
    key: 'bronze',
    label: '청동 투각',
    className: 'ring-2 ring-[#d2ad7e]/80 shadow-[0_0_0_1px_rgba(210,173,126,0.5),0_0_24px_rgba(164,111,52,0.3)]',
  },
]

const missionIconPresets: MissionIconPreset[] = [
  { key: 'scroll', label: '문서', icon: ScrollText, className: 'from-[#2f6ea8] to-[#1d3f63]' },
  { key: 'sword', label: '전투', icon: Sword, className: 'from-[#3a7bb9] to-[#214f82]' },
  { key: 'shield', label: '방어', icon: Shield, className: 'from-[#2c86a8] to-[#1b5575]' },
  { key: 'star', label: '도전', icon: Star, className: 'from-[#608fd6] to-[#385aa4]' },
  { key: 'sparkles', label: '특별', icon: Sparkles, className: 'from-[#5fa9d8] to-[#2e6fa5]' },
  { key: 'book', label: '학습', icon: BookOpen, className: 'from-[#4f7ec5] to-[#294d88]' },
  { key: 'users', label: '협동', icon: Users, className: 'from-[#4d9dbd] to-[#2e6787]' },
  { key: 'coins', label: '보상', icon: Coins, className: 'from-[#5f86bf] to-[#324f7e]' },
  { key: 'gift', label: '이벤트', icon: Gift, className: 'from-[#6a9ac9] to-[#3e5f92]' },
  { key: 'activity', label: '성장', icon: Activity, className: 'from-[#3f8aaa] to-[#1f5c79]' },
  { key: 'target', label: '목표', icon: Target, className: 'from-[#4f91cc] to-[#27577f]' },
  { key: 'trophy', label: '업적', icon: Trophy, className: 'from-[#477ab7] to-[#234f84]' },
  { key: 'rocket', label: '돌파', icon: Rocket, className: 'from-[#3a8eb9] to-[#1e5f7d]' },
  { key: 'flame', label: '열정', icon: Flame, className: 'from-[#527fc0] to-[#294f85]' },
  { key: 'book-marked', label: '복습', icon: BookMarked, className: 'from-[#3f74b4] to-[#244f87]' },
  { key: 'wand', label: '기술', icon: WandSparkles, className: 'from-[#4e97cb] to-[#286a96]' },
  { key: 'zap', label: '속도', icon: Zap, className: 'from-[#5e90c3] to-[#335f90]' },
  { key: 'swords', label: '대결', icon: Swords, className: 'from-[#37689f] to-[#1e436e]' },
  { key: 'lightbulb', label: '발상', icon: Lightbulb, className: 'from-[#4f88bf] to-[#255382]' },
  { key: 'brain', label: '집중', icon: Brain, className: 'from-[#4179ad] to-[#234f7e]' },
]

const missionStatOptions: MissionStatOption[] = [
  { key: 'wisdom', label: '지혜' },
  { key: 'creativity', label: '창의성' },
  { key: 'personality', label: '인성' },
  { key: 'vitality', label: '체력' },
  { key: 'diligence', label: '성실성' },
  { key: 'communication', label: '의사소통' },
]

const missionStatLabelMap: Record<string, string> = missionStatOptions.reduce<Record<string, string>>(
  (accumulator, option) => {
    accumulator[option.key] = option.label
    return accumulator
  },
  {},
)

const studentStatLabelMap: Record<string, string> = {
  wisdom: '지혜',
  creativity: '창의성',
  personality: '인성',
  vitality: '체력',
  diligence: '성실성',
  communication: '의사소통',
  지혜: '지혜',
  창의성: '창의성',
  인성: '인성',
  체력: '체력',
  성실성: '성실성',
  의사소통: '의사소통',
}

const TITLE_REWARD_STORAGE_KEY = 'arcane_title_reward_config_v1'

const emptyTitleForm = (): TitleFormState => ({
  title_name: '',
  description: '',
  condition_text: '',
  icon_key: titleIconPresets[0]?.key ?? 'shield',
  frame_key: titleFramePresets[0]?.key ?? 'royal',
  reward_exp: '40',
  reward_won: '80',
  achievement_mode: 'manual',
  auto_condition_type: 'none',
  condition_card_id: '',
  condition_stat_key: missionStatOptions[0]?.key ?? 'diligence',
  condition_target_count: '1',
  icon_public_url: null,
  icon_object_key: null,
  icon_original_filename: null,
  icon_content_type: null,
})

const cardTabs: CardTabKey[] = [
  { key: 'praise', label: '칭찬카드' },
  { key: 'warning', label: '주의카드' },
]

const cardIconPresetsByType: Record<'praise' | 'warning', CardIconPreset[]> = {
  praise: [
    { key: 'praise-heart', label: '하트', icon: Heart, className: 'from-[#ff7a9b] to-[#f43f5e]' },
    { key: 'praise-hand-heart', label: '격려', icon: HandHeart, className: 'from-[#ff6b8a] to-[#e11d48]' },
    { key: 'praise-sparkles', label: '빛남', icon: Sparkles, className: 'from-[#ff8fab] to-[#f43f5e]' },
    { key: 'praise-message', label: '소통', icon: MessageCircleHeart, className: 'from-[#ff718f] to-[#db2777]' },
    { key: 'praise-trophy', label: '성취', icon: Trophy, className: 'from-[#ff9b70] to-[#f97316]' },
    { key: 'praise-crown', label: '우수', icon: Crown, className: 'from-[#ff8e7a] to-[#ef4444]' },
    { key: 'praise-star', label: '별빛', icon: Star, className: 'from-[#ff899e] to-[#f43f5e]' },
    { key: 'praise-gift', label: '선물', icon: Gift, className: 'from-[#ff7fa8] to-[#ec4899]' },
    { key: 'praise-medal', label: '훈장', icon: Medal, className: 'from-[#ff9f68] to-[#f97316]' },
    { key: 'praise-book', label: '학습', icon: BookOpen, className: 'from-[#ff7b7b] to-[#dc2626]' },
    { key: 'praise-lightbulb', label: '아이디어', icon: Lightbulb, className: 'from-[#ff8f7a] to-[#ef4444]' },
    { key: 'praise-rocket', label: '도약', icon: Rocket, className: 'from-[#ff6f91] to-[#db2777]' },
    { key: 'praise-wand', label: '반짝', icon: WandSparkles, className: 'from-[#ff82aa] to-[#f43f5e]' },
    { key: 'praise-users', label: '협동', icon: Users, className: 'from-[#ff7c92] to-[#e11d48]' },
    { key: 'praise-badge', label: '칭찬', icon: BadgePlus, className: 'from-[#ff9a76] to-[#f97316]' },
  ],
  warning: [
    { key: 'warning-triangle', label: '경고', icon: TriangleAlert, className: 'from-[#60a5fa] to-[#2563eb]' },
    { key: 'warning-shield', label: '주의', icon: ShieldAlert, className: 'from-[#4f9cf8] to-[#1d4ed8]' },
    { key: 'warning-bell', label: '알림', icon: Bell, className: 'from-[#5ba5ff] to-[#2563eb]' },
    { key: 'warning-flame', label: '과열', icon: Flame, className: 'from-[#67a6ff] to-[#2563eb]' },
    { key: 'warning-zap', label: '과속', icon: Zap, className: 'from-[#75b4ff] to-[#2563eb]' },
    { key: 'warning-lock', label: '규칙', icon: Lock, className: 'from-[#7cb5ff] to-[#1d4ed8]' },
    { key: 'warning-scroll', label: '기록', icon: ScrollText, className: 'from-[#64a4ff] to-[#1e40af]' },
    { key: 'warning-target', label: '집중', icon: Target, className: 'from-[#6daeff] to-[#1d4ed8]' },
    { key: 'warning-swords', label: '충돌', icon: Swords, className: 'from-[#5d9bff] to-[#1e3a8a]' },
    { key: 'warning-wrench', label: '점검', icon: Wrench, className: 'from-[#71abff] to-[#1e40af]' },
    { key: 'warning-search', label: '확인', icon: Search, className: 'from-[#76b0ff] to-[#1d4ed8]' },
    { key: 'warning-compass', label: '방향', icon: Compass, className: 'from-[#69a6ff] to-[#1e3a8a]' },
    { key: 'warning-clipboard', label: '규정', icon: ClipboardCheck, className: 'from-[#6ca7ff] to-[#1e40af]' },
    { key: 'warning-book', label: '생활', icon: BookMarked, className: 'from-[#5ea0ff] to-[#1d4ed8]' },
    { key: 'warning-activity', label: '관리', icon: Activity, className: 'from-[#78b5ff] to-[#1e40af]' },
  ],
}

const emptyMissionForm = (): MissionFormState => ({
  title: '',
  description: '',
  icon_key: missionIconPresets[0]?.key ?? 'scroll',
  target_stat_key: missionStatOptions[0]?.key ?? 'diligence',
  target_stat_label: missionStatOptions[0]?.label ?? '성실성',
  reward_exp: '20',
  reward_won: '50',
  reward_nyang: '0',
  repeatable: false,
  weekly_reset: false,
  goal_count: '1',
})

const emptyCardForm = (cardType: 'praise' | 'warning'): CardFormState => ({
  title: '',
  description: '',
  icon_key:
    cardIconPresetsByType[cardType][0]?.key ??
    (cardType === 'praise' ? 'praise-heart' : 'warning-triangle'),
  reward_exp: cardType === 'praise' ? '30' : '100',
  reward_won: cardType === 'praise' ? '30' : '100',
  reward_nyang: '0',
  level_delta: cardType === 'praise' ? '1' : '0',
  selected_stat_keys: [cardType === 'praise' ? 'personality' : 'diligence'],
  stat_delta: '1',
})

const couponEmojiPresets = ['🎟️', '🎁', '🍿', '🥤', '📚', '🧩', '🎨', '🎵', '⚽', '🛴', '🎮', '🍔', '🍕', '🧃', '🎬', '🚌', '📷', '🎯', '🏸', '🧸'] as const

const emptyCouponForm: CouponFormState = {
  name: '',
  description: '',
  icon_emoji: couponEmojiPresets[0],
  price_gold: '250',
  stock: '10',
  is_active: true,
}

const emptyCouponUseForm: CouponUseFormState = {
  coupon_id: '',
  quantity: '1',
  note: '',
}

const emptyFundingForm: FundingFormState = {
  title: '',
  description: '',
  reward_plan: '',
  target_amount: '20000',
}

const emptyLearningBoardForm: LearningBoardFormState = {
  title: '',
  description: '',
  cover_image_url: '',
  is_active: true,
}

const emptyLearningBoardPostForm: LearningBoardPostFormState = {
  content: '',
  image_url: '',
  image_object_key: '',
  image_original_filename: '',
}

const sidebarMenuItems: SidebarMenuItem[] = [
  { label: '학생 목록', icon: Users, section: '학급 운영' },
  { label: '미션', icon: ScrollText, section: '학급 운영' },
  { label: '칭찬/주의 카드', icon: BadgePlus, section: '학급 운영' },
  { label: '칭호', icon: Medal, section: '학급 운영' },
  { label: '클래스 툴', icon: Wrench, section: '학급 운영' },
  { label: '학생 로그인', icon: LogIn, section: '상점 및 관리' },
  { label: '1인1역', icon: Star, section: '학급 운영' },
  { label: '나의 성장일지', icon: NotebookPen, section: '학습 확장' },
  { label: '문제 던전', icon: FileSpreadsheet, section: '학습 확장' },
  { label: '제출 미션', icon: ClipboardCheck, section: '학습 확장' },
  { label: '학습 게시판', icon: LibraryBig, section: '학습 확장' },
  { label: '학생 성장 도감', icon: Compass, section: '학습 확장' },
  { label: '아바타 상점', icon: ShoppingBag, section: '상점 및 관리' },
  { label: '학급 활동 상점', icon: Store, section: '상점 및 관리' },
  { label: '던전 탐험', icon: Sword, section: '상점 및 관리' },
  { label: '마이룸', icon: House, section: '상점 및 관리' },
  { label: '은행 관리', icon: Landmark, section: '상점 및 관리' },
  { label: '학급 관리', icon: Settings2, section: '상점 및 관리' },
]

function parseCsvRows(content: string): ParsedQuestionRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    const getValue = (keyCandidates: string[]) => {
      const idx = headers.findIndex((h) => keyCandidates.includes(h))
      return idx >= 0 ? cols[idx] || '' : ''
    }

    return {
      subject: getValue(['subject', '과목']) || '일반',
      unit_name: getValue(['unit', 'unit_name', '단원']) || null,
      prompt: getValue(['prompt', 'question', '문제']),
      answer: getValue(['answer', '정답']) || '미입력',
      difficulty: getValue(['difficulty', '난이도']) || '보통',
      bonus_attack: Number(getValue(['bonus_attack', 'attack', '보너스공격력']) || 5),
    }
  })
}

function parseXlsxRows(data: ArrayBuffer): ParsedQuestionRow[] {
  const workbook = XLSX.read(data)
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, { defval: '' })

  return rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), String(value ?? '').trim()]),
    )

    return {
      subject: normalized.subject || normalized['과목'] || '일반',
      unit_name: normalized.unit || normalized.unit_name || normalized['단원'] || null,
      prompt: normalized.prompt || normalized.question || normalized['문제'] || '',
      answer: normalized.answer || normalized['정답'] || '미입력',
      difficulty: normalized.difficulty || normalized['난이도'] || '보통',
      bonus_attack: Number(normalized.bonus_attack || normalized['보너스공격력'] || '5'),
    }
  })
}

function shuffleStudents<T>(items: T[]): T[] {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[randomIndex]
    cloned[randomIndex] = temp
  }
  return cloned
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatSecondsToClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds)
  const minute = Math.floor(safeSeconds / 60)
  const second = safeSeconds % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

function formatStopwatch(centiseconds: number): string {
  const safeValue = Math.max(0, centiseconds)
  const minute = Math.floor(safeValue / 6000)
  const second = Math.floor((safeValue % 6000) / 100)
  const cs = safeValue % 100
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

const classToolTimerPresets = [3, 5, 10, 20] as const

function App() {
  const [authUser, setAuthUser] = useState<User | null>(getCurrentUser())
  const [email, setEmail] = useState('iop3367@naver.com')
  const [password, setPassword] = useState('ClassQuest123!')
  const [authError, setAuthError] = useState('')
  const [publicStudentItems, setPublicStudentItems] = useState<PublicStudentLoginItem[]>([])
  const [selectedStudentForPin, setSelectedStudentForPin] = useState<PublicStudentLoginItem | null>(null)
  const [studentPinCode, setStudentPinCode] = useState('')
  const [studentPinSubmitting, setStudentPinSubmitting] = useState(false)

  const [overview, setOverview] = useState<ClassroomOverview | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [studentLoginAccounts, setStudentLoginAccounts] = useState<StudentLoginAccount[]>([])
  const [studentLoginMessage, setStudentLoginMessage] = useState('')
  const [studentLoginNickname, setStudentLoginNickname] = useState('')
  const [studentLoginLoading, setStudentLoginLoading] = useState(false)
  const [studentLoginActionStudentId, setStudentLoginActionStudentId] = useState<number | null>(null)
  const [studentLoginActionType, setStudentLoginActionType] = useState<'delete' | 'reset-pin' | null>(null)
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [activityShopTab, setActivityShopTab] = useState<ActivityShopTab>('coupon-store')
  const [activityCoupons, setActivityCoupons] = useState<ActivityCoupon[]>([])
  const [couponLedger, setCouponLedger] = useState<CouponLedgerEntry[]>([])
  const [couponInventory, setCouponInventory] = useState<StudentCouponInventoryRow[]>([])
  const [fundingProjects, setFundingProjects] = useState<FundingProject[]>([])
  const [selectedFundingProjectId, setSelectedFundingProjectId] = useState<number | null>(null)
  const [fundingProjectDetail, setFundingProjectDetail] = useState<FundingProjectDetail | null>(null)
  const [selectedStudentForActivityShop, setSelectedStudentForActivityShop] = useState<number | null>(null)
  const [couponForm, setCouponForm] = useState<CouponFormState>(emptyCouponForm)
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponHistoryCouponId, setCouponHistoryCouponId] = useState<number | null>(null)
  const [couponPurchaseDrafts, setCouponPurchaseDrafts] = useState<Record<number, string>>({})
  const [couponUseForm, setCouponUseForm] = useState<CouponUseFormState>(emptyCouponUseForm)
  const [fundingForm, setFundingForm] = useState<FundingFormState>(emptyFundingForm)
  const [editingFundingProjectId, setEditingFundingProjectId] = useState<number | null>(null)
  const [showFundingModal, setShowFundingModal] = useState(false)
  const [fundingContributionAmount, setFundingContributionAmount] = useState('100')
  const [learningBoards, setLearningBoards] = useState<LearningBoard[]>([])
  const [selectedLearningBoardId, setSelectedLearningBoardId] = useState<number | null>(null)
  const [learningBoardSort, setLearningBoardSort] = useState<LearningBoardSort>('number')
  const [learningBoardScreen, setLearningBoardScreen] = useState<'list' | 'detail'>('list')
  const [learningBoardPosts, setLearningBoardPosts] = useState<LearningBoardPost[]>([])
  const [learningBoardForm, setLearningBoardForm] = useState<LearningBoardFormState>(emptyLearningBoardForm)
  const [editingLearningBoardId, setEditingLearningBoardId] = useState<number | null>(null)
  const [showLearningBoardModal, setShowLearningBoardModal] = useState(false)
  const [learningBoardPostForm, setLearningBoardPostForm] = useState<LearningBoardPostFormState>(emptyLearningBoardPostForm)
  const [editingLearningPostId, setEditingLearningPostId] = useState<number | null>(null)
  const [learningBoardCommentDrafts, setLearningBoardCommentDrafts] = useState<LearningBoardCommentDraftState>({})
  const [uploadingLearningPostImage, setUploadingLearningPostImage] = useState(false)
  const learningPostImageInputRef = useRef<HTMLInputElement | null>(null)
  const [activityShopMessage, setActivityShopMessage] = useState('')
  const [learningBoardMessage, setLearningBoardMessage] = useState('')
  const [activityShopLoading, setActivityShopLoading] = useState(false)
  const [learningBoardLoading, setLearningBoardLoading] = useState(false)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [raid, setRaid] = useState<RaidSession | null>(null)
  const [raidLogs, setRaidLogs] = useState<RaidAction[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  const [sortBy, setSortBy] = useState<'student_number' | 'level'>('student_number')
  const [cards, setCards] = useState<ClassroomCard[]>([])
  const [activeCardTab, setActiveCardTab] = useState<'praise' | 'warning'>('praise')
  const [showCardEditorModal, setShowCardEditorModal] = useState(false)
  const [editingCard, setEditingCard] = useState<ClassroomCard | null>(null)
  const [cardForm, setCardForm] = useState<CardFormState>(emptyCardForm('praise'))
  const [showCardIssueModal, setShowCardIssueModal] = useState(false)
  const [issuingCard, setIssuingCard] = useState<ClassroomCard | null>(null)
  const [selectedCardStudentIds, setSelectedCardStudentIds] = useState<number[]>([])
  const [cardIssueKeyword, setCardIssueKeyword] = useState('')
  const [cardIssueNote, setCardIssueNote] = useState('')
  const [cardHistory, setCardHistory] = useState<ClassroomCardHistoryResponse | null>(null)
  const [loadingCardHistory, setLoadingCardHistory] = useState(false)
  const [savingCard, setSavingCard] = useState(false)
  const [issuingCardLoading, setIssuingCardLoading] = useState(false)
  const [cardMessage, setCardMessage] = useState('')
  const [missions, setMissions] = useState<MissionItem[]>([])
  const [missionForm, setMissionForm] = useState<MissionFormState>(emptyMissionForm)
  const [editingMission, setEditingMission] = useState<MissionItem | null>(null)
  const [showMissionModal, setShowMissionModal] = useState(false)
  const [showMissionAchieverModal, setShowMissionAchieverModal] = useState(false)
  const [achieverTargetMission, setAchieverTargetMission] = useState<MissionItem | null>(null)
  const [selectedMissionStudentIds, setSelectedMissionStudentIds] = useState<number[]>([])
  const [missionSearchKeyword, setMissionSearchKeyword] = useState('')
  const [savingMission, setSavingMission] = useState(false)
  const [updatingMissionAchievers, setUpdatingMissionAchievers] = useState(false)
  const [missionMessage, setMissionMessage] = useState('')

  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null)
  const [studentDetailTab, setStudentDetailTab] = useState<'info' | 'activity' | 'photos' | 'avatar'>('info')
  const [studentDetailLoading, setStudentDetailLoading] = useState(false)
  const [studentDetailError, setStudentDetailError] = useState('')
  const [profileNameDraft, setProfileNameDraft] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingTitleSelection, setSavingTitleSelection] = useState(false)
  const [selectedEarnedTitleId, setSelectedEarnedTitleId] = useState<number | null>(null)
  const [activityFilter, setActivityFilter] = useState<ActivityFilterKey>('all')
  const [classTitles, setClassTitles] = useState<TitleDefinition[]>([])
  const [titleFilterMode, setTitleFilterMode] = useState<TitleAchievementMode>('manual')
  const [titleTabError, setTitleTabError] = useState('')
  const [titleTabMessage, setTitleTabMessage] = useState('')
  const [showTitleEditorModal, setShowTitleEditorModal] = useState(false)
  const [editingTitle, setEditingTitle] = useState<TitleDefinition | null>(null)
  const [titleForm, setTitleForm] = useState<TitleFormState>(emptyTitleForm)
  const [savingTitleForm, setSavingTitleForm] = useState(false)
  const [uploadingTitleIcon, setUploadingTitleIcon] = useState(false)
  const [showTitleIssueModal, setShowTitleIssueModal] = useState(false)
  const [issuingTitle, setIssuingTitle] = useState<TitleDefinition | null>(null)
  const [showTitlePreviewModal, setShowTitlePreviewModal] = useState(false)
  const [previewTitle, setPreviewTitle] = useState<TitleDefinition | null>(null)
  const [titleMissionRewardExp, setTitleMissionRewardExp] = useState('40')
  const [titleMissionRewardWon, setTitleMissionRewardWon] = useState('80')
  const [titleRewardById, setTitleRewardById] = useState<Record<number, TitleRewardConfig>>({})
  const [celebratingTitleIds, setCelebratingTitleIds] = useState<number[]>([])
  const celebrationTimeoutRef = useRef<number[]>([])
  const [titleRecipients, setTitleRecipients] = useState<StudentTitleRecipient[]>([])
  const [loadingTitleRecipients, setLoadingTitleRecipients] = useState(false)
  const [issueSearchKeyword, setIssueSearchKeyword] = useState('')
  const [issueAwardReason, setIssueAwardReason] = useState('')
  const [selectedIssueStudentIds, setSelectedIssueStudentIds] = useState<number[]>([])
  const [submittingTitleIssue, setSubmittingTitleIssue] = useState(false)
  const [photoUploadMessage, setPhotoUploadMessage] = useState('')
  const [adminEconomyDraft, setAdminEconomyDraft] = useState({
    total_exp: '',
    won_balance: '',
    nyang_balance: '',
    core_balance: '',
    starlight_shard_balance: '',
    wisdom: '',
    creativity: '',
    personality: '',
    vitality: '',
    diligence: '',
    communication: '',
  })
  const [savingAdminEconomy, setSavingAdminEconomy] = useState(false)
  const [showAdminEconomyEditor, setShowAdminEconomyEditor] = useState(false)
  const economyEditorRef = useRef<HTMLDivElement | null>(null)

  const [uploadMessage, setUploadMessage] = useState('')
  const [activeMenu, setActiveMenu] = useState('학생 목록')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileTabDrawerOpen, setIsMobileTabDrawerOpen] = useState(false)

  const [classToolTab, setClassToolTab] = useState<ClassToolTab>('picker')
  const [pickedStudentIds, setPickedStudentIds] = useState<number[]>([])
  const [drawHistory, setDrawHistory] = useState<DrawResult[]>([])
  const [pickerPopup, setPickerPopup] = useState<PickerPopupState | null>(null)
  const [classToolMessage, setClassToolMessage] = useState('')
  const [teamBuckets, setTeamBuckets] = useState<TeamBucket[]>([])
  const [lastTeamCount, setLastTeamCount] = useState<number | null>(null)
  const drawSoundContextRef = useRef<AudioContext | null>(null)
  const rouletteSpinTimeoutRef = useRef<number | null>(null)

  const [timerMode, setTimerMode] = useState<TimerMode>('clock')
  const [clockNow, setClockNow] = useState<Date>(() => new Date())
  const [timerMinuteInput, setTimerMinuteInput] = useState('5')
  const [timerSecondInput, setTimerSecondInput] = useState('0')
  const [remainingSeconds, setRemainingSeconds] = useState(300)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const [stopwatchCentiseconds, setStopwatchCentiseconds] = useState(0)
  const [stopwatchLaps, setStopwatchLaps] = useState<StopwatchLap[]>([])
  const [nextStopwatchLapId, setNextStopwatchLapId] = useState(1)

  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false)
  const [rouletteWinner, setRouletteWinner] = useState<Student | null>(null)
  const [rouletteCurrentStudent, setRouletteCurrentStudent] = useState<Student | null>(null)

  const raidBossRate = useMemo(() => {
    if (!raid) {
      return 0
    }
    return ((raid.boss_max_hp - raid.boss_current_hp) / raid.boss_max_hp) * 100
  }, [raid])

  const classHpRate = useMemo(() => {
    if (!raid) {
      return 0
    }
    return (raid.class_current_hp / raid.class_max_hp) * 100
  }, [raid])

  const studentGridSlots = useMemo(() => {
    const slots: Array<Student | null> = [...students]
    while (slots.length < 25) {
      slots.push(null)
    }
    return slots
  }, [students])

  const classToolStudents = useMemo(
    () => [...students].sort((a, b) => a.student_number - b.student_number),
    [students],
  )

  const remainingDrawStudents = useMemo(
    () => classToolStudents.filter((student) => !pickedStudentIds.includes(student.id)),
    [classToolStudents, pickedStudentIds],
  )

  const pickerProgressPercent = useMemo(() => {
    if (classToolStudents.length === 0) {
      return 0
    }
    return Math.min(100, Math.round((pickedStudentIds.length / classToolStudents.length) * 100))
  }, [classToolStudents.length, pickedStudentIds.length])

  const latestSingleDraw = useMemo(() => {
    if (pickerPopup?.mode !== 'single') {
      return null
    }
    return pickerPopup.drawnStudents[0] ?? null
  }, [pickerPopup])

  const filteredIssueStudents = useMemo(() => {
    const keyword = issueSearchKeyword.trim().toLowerCase()
    if (!keyword) {
      return students
    }

    return students.filter((student) => {
      const byName = student.name.toLowerCase().includes(keyword)
      const byNumber = String(student.student_number).includes(keyword)
      return byName || byNumber
    })
  }, [issueSearchKeyword, students])

  const filteredMissionStudents = useMemo(() => {
    const keyword = missionSearchKeyword.trim().toLowerCase()
    if (!keyword) {
      return students
    }

    return students.filter((student) => {
      const byName = student.name.toLowerCase().includes(keyword)
      const byNumber = String(student.student_number).includes(keyword)
      return byName || byNumber
    })
  }, [missionSearchKeyword, students])

  const filteredCardStudents = useMemo(() => {
    const keyword = cardIssueKeyword.trim().toLowerCase()
    if (!keyword) {
      return students
    }

    return students.filter((student) => {
      const byName = student.name.toLowerCase().includes(keyword)
      const byNumber = String(student.student_number).includes(keyword)
      return byName || byNumber
    })
  }, [cardIssueKeyword, students])

  const isAllFilteredCardStudentsSelected =
    filteredCardStudents.length > 0 &&
    filteredCardStudents.every((student) => selectedCardStudentIds.includes(student.id))

  const isAllFilteredMissionStudentsSelected =
    filteredMissionStudents.length > 0 &&
    filteredMissionStudents.every((student) => selectedMissionStudentIds.includes(student.id))

  const isAllFilteredStudentsSelected =
    filteredIssueStudents.length > 0 &&
    filteredIssueStudents.every((student) => selectedIssueStudentIds.includes(student.id))

  const issueTitleRecipientIdSet = useMemo(
    () => new Set(titleRecipients.map((recipient) => recipient.student_id)),
    [titleRecipients],
  )

  const cardsByActiveTab = useMemo(
    () => cards.filter((card) => card.card_type === activeCardTab),
    [cards, activeCardTab],
  )

  const activeCardIconPresets = useMemo(
    () => cardIconPresetsByType[activeCardTab],
    [activeCardTab],
  )

  const filteredClassTitles = useMemo(
    () =>
      classTitles.filter((title) =>
        titleFilterMode === 'manual'
          ? title.achievement_mode !== 'auto'
          : title.achievement_mode === 'auto',
      ),
    [classTitles, titleFilterMode],
  )

  const getTitleRewardConfig = (titleId: number): TitleRewardConfig => {
    const reward = titleRewardById[titleId]
    if (reward) {
      return reward
    }

    const matchedTitle = classTitles.find((title) => title.id === titleId)
    return {
      reward_exp: matchedTitle?.reward_exp ?? 40,
      reward_won: matchedTitle?.reward_won ?? 80,
    }
  }

  const findLinkedTitleForMission = (mission: MissionItem): TitleDefinition | null => {
    const normalizedMissionTitle = mission.title.trim().toLowerCase()
    const strictMatch = classTitles.find(
      (title) => normalizedMissionTitle === `${title.title_name.trim().toLowerCase()} 칭호 미션`,
    )
    if (strictMatch) {
      return strictMatch
    }

    const fallbackMatch = classTitles.find((title) => {
      const normalizedTitleName = title.title_name.trim().toLowerCase()
      if (!normalizedMissionTitle.includes(normalizedTitleName)) {
        return false
      }

      if (!mission.description || !title.condition_text) {
        return false
      }

      return mission.description.trim() === title.condition_text.trim()
    })

    return fallbackMatch ?? null
  }

  const isStudentDetailView = activeMenu === '학생 목록' && studentDetail !== null
  const normalizedAuthRole = (authUser as User & { role?: string } | null)?.role?.trim().toLowerCase() ?? ''
  const studentSessionId = (authUser as User & { student_id?: number } | null)?.student_id ?? null
  const isStudentSession = normalizedAuthRole === 'student' || Number.isFinite(studentSessionId)
  const normalizedAuthEmail = (authUser?.email ?? '').trim().toLowerCase()
  const isForcedAdminEmail =
    normalizedAuthEmail === 'admin@arcaneclass.quest' || normalizedAuthEmail === 'iop3367@naver.com'
  const hasTeacherModeAccess = Boolean(authUser?.id) && !isStudentSession
  const roleDisplayLabel =
    normalizedAuthRole === 'admin' || isForcedAdminEmail
      ? '관리자'
      : normalizedAuthRole === 'teacher' || hasTeacherModeAccess
        ? '교사'
        : isStudentSession
          ? '학생'
          : '일반'
  const isPrivilegedUser =
    !isStudentSession &&
    (normalizedAuthRole === 'admin' ||
      normalizedAuthRole === 'teacher' ||
      isForcedAdminEmail ||
      hasTeacherModeAccess)
  const canManageClassContent = isPrivilegedUser
  const canEditBasicProfile =
    canManageClassContent ||
    (isStudentSession && Boolean(studentDetail?.student.id) && studentDetail?.student.id === studentSessionId)
  const canManageStudentEconomy = Boolean(studentDetail?.can_manage_economy || isPrivilegedUser)
  const canEditStudentBySession = (targetStudentId: number | null | undefined): boolean => {
    if (!targetStudentId) {
      return false
    }

    if (canManageClassContent) {
      return true
    }

    if (!isStudentSession) {
      return false
    }

    return studentSessionId === targetStudentId
  }
  const sidebarItems = isStudentSession
    ? sidebarMenuItems.filter((item) => item.label !== '학생 로그인')
    : sidebarMenuItems

  const handleSidebarMenuSelect = (label: string): void => {
    setActiveMenu(label)
    setIsMobileTabDrawerOpen(false)
  }

  const activityShopSelectableStudents = useMemo(() => {
    if (isStudentSession && Number.isFinite(studentSessionId)) {
      return students.filter((student) => student.id === studentSessionId)
    }
    return students
  }, [isStudentSession, studentSessionId, students])

  const selectedActivityStudent = useMemo(() => {
    if (!selectedStudentForActivityShop) {
      return null
    }
    return students.find((student) => student.id === selectedStudentForActivityShop) ?? null
  }, [selectedStudentForActivityShop, students])

  const selectedFundingProject = useMemo(() => {
    if (!selectedFundingProjectId) {
      return null
    }
    return fundingProjects.find((project) => project.id === selectedFundingProjectId) ?? null
  }, [fundingProjects, selectedFundingProjectId])

  const selectedLearningBoard = useMemo(() => {
    if (!selectedLearningBoardId) {
      return null
    }
    return learningBoards.find((board) => board.id === selectedLearningBoardId) ?? null
  }, [learningBoards, selectedLearningBoardId])

  const selectedCouponForHistory = useMemo(() => {
    if (!couponHistoryCouponId) {
      return null
    }
    return activityCoupons.find((coupon) => coupon.id === couponHistoryCouponId) ?? null
  }, [activityCoupons, couponHistoryCouponId])

  const couponHistoryEntries = useMemo(() => {
    if (!couponHistoryCouponId) {
      return []
    }
    return couponLedger.filter((entry) => entry.coupon_id === couponHistoryCouponId)
  }, [couponHistoryCouponId, couponLedger])

  const studentDetailExpRate = useMemo(() => {
    if (!studentDetail) {
      return 0
    }

    return Math.max(
      6,
      Math.min(
        100,
        (studentDetail.economy.current_exp / Math.max(1, studentDetail.economy.max_exp)) * 100,
      ),
    )
  }, [studentDetail])

  const activityCounts = useMemo(() => {
    const base = {
      all: 0,
      mission: 0,
      praise_card: 0,
      warning_card: 0,
      title: 0,
      raid: 0,
    }

    if (!studentDetail) {
      return base
    }

    const withoutAvatarLogs = studentDetail.activities.filter((item) => item.log_type !== 'avatar')
    for (const activity of withoutAvatarLogs) {
      const key = activity.log_type as ActivityFilterKey
      if (key in base && key !== 'all') {
        base[key as Exclude<ActivityFilterKey, 'all'>] += 1
      }
    }

    base.all = withoutAvatarLogs.length
    return base
  }, [studentDetail])

  const filteredActivities = useMemo(() => {
    if (!studentDetail) {
      return []
    }

    const withoutAvatarLogs = studentDetail.activities.filter((item) => item.log_type !== 'avatar')
    if (activityFilter === 'all') {
      return withoutAvatarLogs
    }

    return withoutAvatarLogs.filter((item) => item.log_type === activityFilter)
  }, [activityFilter, studentDetail])

  const refreshTeacherData = async () => {
    setLoadingDashboard(true)
    try {
      const [
        overviewData,
        studentData,
        loginAccountData,
        shopData,
        questionData,
        raidData,
        titleData,
        missionData,
        cardData,
        couponData,
        couponLedgerData,
        fundingProjectData,
      ] = await Promise.all([
        api.get<ClassroomOverview>('/classroom/overview'),
        api.get<Student[]>(`/classroom/students?sort_by=${sortBy}`),
        canManageClassContent
          ? api.get<StudentLoginAccount[]>('/classroom/students/login-accounts')
          : Promise.resolve([]),
        api.get<ShopItem[]>('/classroom/shop/items'),
        api.get<QuestionItem[]>('/classroom/questions'),
        api.get<RaidSession | null>('/classroom/raid/current'),
        api.get<TitleDefinition[]>('/classroom/titles?include_inactive=true'),
        api.get<MissionItem[]>('/classroom/missions?include_inactive=true'),
        api.get<ClassroomCard[]>('/classroom/cards?include_inactive=true'),
        api.get<ActivityCoupon[]>('/classroom/activity-shop/coupons?include_inactive=true'),
        api.get<CouponLedgerEntry[]>('/classroom/activity-shop/coupon-ledger'),
        api.get<FundingProject[]>('/classroom/activity-shop/funding-projects'),
      ])

      setOverview(overviewData)
      setStudents(studentData)
      setStudentLoginAccounts(loginAccountData)
      setShopItems(shopData)
      setQuestions(questionData)
      setRaid(raidData)
      setClassTitles(titleData)
      setTitleRewardById((prev) => {
        const next = { ...prev }
        for (const title of titleData) {
          next[title.id] = {
            reward_exp: title.reward_exp,
            reward_won: title.reward_won,
          }
        }
        return next
      })
      setMissions(missionData)
      setCards(cardData)
      setActivityCoupons(couponData)
      setCouponLedger(couponLedgerData)
      setFundingProjects(fundingProjectData)
      if (fundingProjectData.length > 0) {
        setSelectedFundingProjectId((prev) => prev ?? fundingProjectData[0]?.id ?? null)
      } else {
        setSelectedFundingProjectId(null)
      }

      if (raidData) {
        const logs = await api.get<RaidAction[]>(`/classroom/raid/sessions/${raidData.id}/log`)
        setRaidLogs(logs)
      } else {
        setRaidLogs([])
      }
    } catch {
      setAuthError('데이터를 불러오지 못했습니다. 다시 로그인해 주세요.')
    } finally {
      setLoadingDashboard(false)
    }
  }

  const refreshStudentData = async () => {
    setLoadingDashboard(true)
    try {
      const [
        overviewData,
        studentData,
        shopData,
        questionData,
        raidData,
        titleData,
        missionData,
        cardData,
        couponData,
        couponLedgerData,
        fundingProjectData,
      ] = await Promise.all([
        api.get<ClassroomOverview>('/classroom/overview'),
        api.get<Student[]>(`/classroom/students?sort_by=${sortBy}`),
        api.get<ShopItem[]>('/classroom/shop/items'),
        api.get<QuestionItem[]>('/classroom/questions'),
        api.get<RaidSession | null>('/classroom/raid/current'),
        api.get<TitleDefinition[]>('/classroom/titles?include_inactive=true'),
        api.get<MissionItem[]>('/classroom/missions?include_inactive=true'),
        api.get<ClassroomCard[]>('/classroom/cards?include_inactive=true'),
        api.get<ActivityCoupon[]>('/classroom/activity-shop/coupons'),
        api.get<CouponLedgerEntry[]>('/classroom/activity-shop/coupon-ledger'),
        api.get<FundingProject[]>('/classroom/activity-shop/funding-projects'),
      ])

      setOverview(overviewData)
      setStudents(studentData)
      setStudentLoginAccounts([])
      setShopItems(shopData)
      setQuestions(questionData)
      setRaid(raidData)
      setClassTitles(titleData)
      setTitleRewardById((prev) => {
        const next = { ...prev }
        for (const title of titleData) {
          next[title.id] = {
            reward_exp: title.reward_exp,
            reward_won: title.reward_won,
          }
        }
        return next
      })
      setMissions(missionData)
      setCards(cardData)
      setActivityCoupons(couponData)
      setCouponLedger(couponLedgerData)
      setFundingProjects(fundingProjectData)
      if (fundingProjectData.length > 0) {
        setSelectedFundingProjectId((prev) => prev ?? fundingProjectData[0]?.id ?? null)
      } else {
        setSelectedFundingProjectId(null)
      }

      if (raidData) {
        const logs = await api.get<RaidAction[]>(`/classroom/raid/sessions/${raidData.id}/log`)
        setRaidLogs(logs)
      } else {
        setRaidLogs([])
      }
    } catch {
      setAuthError('학생 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoadingDashboard(false)
    }
  }

  const refreshActivityShopData = async (): Promise<void> => {
    const couponEndpoint = canManageClassContent
      ? '/classroom/activity-shop/coupons?include_inactive=true'
      : '/classroom/activity-shop/coupons'

    const [couponData, couponLedgerData, fundingProjectData] = await Promise.all([
      api.get<ActivityCoupon[]>(couponEndpoint),
      api.get<CouponLedgerEntry[]>('/classroom/activity-shop/coupon-ledger'),
      api.get<FundingProject[]>('/classroom/activity-shop/funding-projects'),
    ])

    setActivityCoupons(couponData)
    setCouponLedger(couponLedgerData)
    setFundingProjects(fundingProjectData)

    if (fundingProjectData.length > 0) {
      setSelectedFundingProjectId((prev) => prev ?? fundingProjectData[0]?.id ?? null)
    } else {
      setSelectedFundingProjectId(null)
      setFundingProjectDetail(null)
    }
  }

  const handleOpenCreateCoupon = (): void => {
    if (!canManageClassContent) {
      return
    }
    setEditingCouponId(null)
    setCouponForm(emptyCouponForm)
    setShowCouponModal(true)
  }

  const handleOpenEditCoupon = (coupon: ActivityCoupon): void => {
    if (!canManageClassContent) {
      return
    }
    setEditingCouponId(coupon.id)
    setCouponForm({
      name: coupon.name,
      description: coupon.description ?? '',
      icon_emoji: coupon.icon_emoji,
      price_gold: String(coupon.price_gold),
      stock: String(coupon.stock),
      is_active: coupon.is_active,
    })
    setShowCouponModal(true)
  }

  const closeCouponModal = (): void => {
    setShowCouponModal(false)
    setEditingCouponId(null)
    setCouponForm(emptyCouponForm)
  }

  const handleSaveCoupon = async (): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    const name = couponForm.name.trim()
    if (!name) {
      setActivityShopMessage('쿠폰 이름을 입력해 주세요.')
      return
    }

    const priceGold = Number(couponForm.price_gold)
    const stock = Number(couponForm.stock)
    if (!Number.isFinite(priceGold) || priceGold <= 0 || !Number.isFinite(stock) || stock < 0) {
      setActivityShopMessage('가격과 재고를 올바르게 입력해 주세요.')
      return
    }

    const payload: ActivityCouponCreatePayload = {
      name,
      description: couponForm.description.trim() || null,
      icon_emoji: couponForm.icon_emoji,
      price_gold: Math.round(priceGold),
      stock: Math.round(stock),
      is_active: couponForm.is_active,
    }

    const updatePayload: ActivityCouponUpdatePayload = {
      ...payload,
    }

    setActivityShopLoading(true)
    try {
      if (editingCouponId) {
        await api.patch<ActivityCoupon>(`/classroom/activity-shop/coupons/${editingCouponId}`, updatePayload)
        setActivityShopMessage('쿠폰 정보를 수정했습니다.')
      } else {
        await api.post<ActivityCoupon>('/classroom/activity-shop/coupons', payload)
        setActivityShopMessage('새 쿠폰을 만들었습니다.')
      }

      closeCouponModal()
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('쿠폰 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const handleDeleteCoupon = async (couponId: number): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    setActivityShopLoading(true)
    try {
      await api.delete<{ success: boolean }>(`/classroom/activity-shop/coupons/${couponId}`)
      setActivityShopMessage('쿠폰을 삭제했습니다.')
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('기록이 있는 쿠폰은 삭제할 수 없습니다. 먼저 기록을 취소해 주세요.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const handlePurchaseCoupon = async (coupon: ActivityCoupon): Promise<void> => {
    if (!selectedStudentForActivityShop) {
      setActivityShopMessage('학생을 먼저 선택해 주세요.')
      return
    }

    const quantityDraft = couponPurchaseDrafts[coupon.id] ?? '1'
    const quantity = Number(quantityDraft)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setActivityShopMessage('구매 수량을 올바르게 입력해 주세요.')
      return
    }

    const payload: ActivityCouponPurchasePayload = {
      student_id: selectedStudentForActivityShop,
      coupon_id: coupon.id,
      quantity: Math.min(20, Math.round(quantity)),
    }

    setActivityShopLoading(true)
    try {
      await api.post<ActivityCouponPurchase>('/classroom/activity-shop/coupons/purchase', payload)
      setActivityShopMessage(`${coupon.name} 쿠폰을 구매했습니다.`)
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('쿠폰 구매에 실패했습니다. 원/재고를 확인해 주세요.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const handleUseCoupon = async (): Promise<void> => {
    if (!selectedStudentForActivityShop) {
      setActivityShopMessage('학생을 먼저 선택해 주세요.')
      return
    }

    const couponId = Number(couponUseForm.coupon_id)
    const quantity = Number(couponUseForm.quantity)
    if (!Number.isFinite(couponId) || couponId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      setActivityShopMessage('사용할 쿠폰과 수량을 선택해 주세요.')
      return
    }

    const payload: ActivityCouponUsagePayload = {
      student_id: selectedStudentForActivityShop,
      coupon_id: couponId,
      quantity: Math.min(20, Math.round(quantity)),
      note: couponUseForm.note.trim() || null,
    }

    setActivityShopLoading(true)
    try {
      await api.post<ActivityCouponUsage>('/classroom/activity-shop/coupons/use', payload)
      setActivityShopMessage('쿠폰 사용 기록이 저장되었습니다.')
      setCouponUseForm(emptyCouponUseForm)
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('쿠폰 사용 처리에 실패했습니다.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const handleCancelCouponLedgerEntry = async (entry: CouponLedgerEntry): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    setActivityShopLoading(true)
    try {
      const response = await api.post<CouponLedgerCancelResponse>(
        `/classroom/activity-shop/coupon-ledger/${entry.entry_type}/${entry.entry_id}/cancel`,
        {},
      )
      setActivityShopMessage(response.message)
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('기록 취소에 실패했습니다. 이미 사용된 구매 기록인지 확인해 주세요.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const closeFundingModal = (): void => {
    setShowFundingModal(false)
    setEditingFundingProjectId(null)
    setFundingForm(emptyFundingForm)
  }

  const handleOpenCreateFunding = (): void => {
    setEditingFundingProjectId(null)
    setFundingForm(emptyFundingForm)
    setShowFundingModal(true)
  }

  const handleOpenEditFunding = (project: FundingProject): void => {
    setEditingFundingProjectId(project.id)
    setFundingForm({
      title: project.title,
      description: project.description ?? '',
      reward_plan: project.reward_plan ?? '',
      target_amount: String(project.target_amount),
    })
    setShowFundingModal(true)
  }

  const handleSaveFundingProject = async (): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    const title = fundingForm.title.trim()
    const targetAmount = Number(fundingForm.target_amount)
    if (!title || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setActivityShopMessage('프로젝트 이름과 목표 금액을 확인해 주세요.')
      return
    }

    const payload: FundingProjectCreatePayload = {
      title,
      description: fundingForm.description.trim() || null,
      reward_plan: fundingForm.reward_plan.trim() || null,
      target_amount: Math.round(targetAmount),
    }

    const updatePayload: FundingProjectUpdatePayload = {
      ...payload,
    }

    setActivityShopLoading(true)
    try {
      if (editingFundingProjectId) {
        await api.patch<FundingProject>(`/classroom/activity-shop/funding-projects/${editingFundingProjectId}`, updatePayload)
        setActivityShopMessage('펀딩 프로젝트를 수정했습니다.')
      } else {
        await api.post<FundingProject>('/classroom/activity-shop/funding-projects', payload)
        setActivityShopMessage('펀딩 프로젝트를 만들었습니다.')
      }

      closeFundingModal()
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('프로젝트 저장에 실패했습니다.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const handleCloseFundingProject = async (projectId: number): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    setActivityShopLoading(true)
    try {
      await api.delete<{ success: boolean }>(`/classroom/activity-shop/funding-projects/${projectId}`)
      setActivityShopMessage('프로젝트를 마감했습니다.')
      await refreshActivityShopData()
    } catch {
      setActivityShopMessage('프로젝트 마감에 실패했습니다.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const handleContributeFunding = async (projectId: number): Promise<void> => {
    if (!selectedStudentForActivityShop) {
      setActivityShopMessage('학생을 먼저 선택해 주세요.')
      return
    }

    const targetProject = fundingProjects.find((project) => project.id === projectId)
    if (!targetProject || targetProject.status !== 'active' || targetProject.current_amount >= targetProject.target_amount) {
      setActivityShopMessage('목표 금액을 달성했거나 마감된 프로젝트는 기부할 수 없습니다.')
      return
    }

    const amount = Number(fundingContributionAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActivityShopMessage('기부 금액을 올바르게 입력해 주세요.')
      return
    }

    const payload: FundingContributionPayload = {
      student_id: selectedStudentForActivityShop,
      amount: Math.round(amount),
    }

    setActivityShopLoading(true)
    try {
      await api.post<FundingContribution>(`/classroom/activity-shop/funding-projects/${projectId}/contributions`, payload)
      setActivityShopMessage('기부가 반영되었습니다.')
      await refreshActivityShopData()
      const detail = await api.get<FundingProjectDetail>(`/classroom/activity-shop/funding-projects/${projectId}/detail`)
      setFundingProjectDetail(detail)
    } catch {
      setActivityShopMessage('기부 처리에 실패했습니다. 잔액을 확인해 주세요.')
    } finally {
      setActivityShopLoading(false)
    }
  }

  const closeLearningBoardModal = (): void => {
    setShowLearningBoardModal(false)
    setEditingLearningBoardId(null)
    setLearningBoardForm(emptyLearningBoardForm)
  }

  const handleOpenCreateLearningBoard = (): void => {
    setEditingLearningBoardId(null)
    setLearningBoardForm(emptyLearningBoardForm)
    setShowLearningBoardModal(true)
  }

  const handleOpenEditLearningBoard = (board: LearningBoard): void => {
    setEditingLearningBoardId(board.id)
    setLearningBoardForm({
      title: board.title,
      description: board.description ?? '',
      cover_image_url: board.cover_image_url ?? '',
      is_active: board.is_active,
    })
    setShowLearningBoardModal(true)
  }

  const refreshLearningBoards = async (): Promise<void> => {
    const endpoint = canManageClassContent
      ? '/classroom/learning-boards?include_inactive=true'
      : '/classroom/learning-boards'
    const boardRows = await api.get<LearningBoard[]>(endpoint)
    setLearningBoards(boardRows)
    if (boardRows.length > 0) {
      setSelectedLearningBoardId((prev) => prev ?? boardRows[0]?.id ?? null)
    } else {
      setSelectedLearningBoardId(null)
      setLearningBoardPosts([])
    }
  }

  const refreshLearningBoardPosts = async (
    boardId: number,
    sortOverride?: LearningBoardSort,
  ): Promise<void> => {
    if (!boardId) {
      setLearningBoardPosts([])
      return
    }

    const activeSort = sortOverride ?? learningBoardSort
    const viewerId = selectedStudentForActivityShop ? `&viewer_student_id=${selectedStudentForActivityShop}` : ''
    const rows = await api.get<LearningBoardPost[]>(
      `/classroom/learning-boards/${boardId}/posts?sort=${activeSort}${viewerId}`,
    )
    setLearningBoardPosts(rows)
  }

  const handleSaveLearningBoard = async (): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    const title = learningBoardForm.title.trim()
    if (!title) {
      setLearningBoardMessage('게시판 제목을 입력해 주세요.')
      return
    }

    if (title.length < 2) {
      setLearningBoardMessage('게시판 제목은 2자 이상 입력해 주세요.')
      return
    }

    const payload: LearningBoardCreatePayload = {
      title,
      description: learningBoardForm.description.trim() || null,
      cover_image_url: learningBoardForm.cover_image_url.trim() || null,
      is_active: learningBoardForm.is_active,
    }

    const updatePayload: LearningBoardUpdatePayload = { ...payload }

    setLearningBoardLoading(true)
    try {
      if (editingLearningBoardId) {
        await api.patch<LearningBoard>(`/classroom/learning-boards/${editingLearningBoardId}`, updatePayload)
        setLearningBoardMessage('게시판을 수정했습니다.')
      } else {
        const createdBoard = await api.post<LearningBoard>('/classroom/learning-boards', payload)
        setSelectedLearningBoardId(createdBoard.id)
        setLearningBoardMessage('게시판을 만들었습니다.')
      }
      closeLearningBoardModal()
      await refreshLearningBoards()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ''
      setLearningBoardMessage(errorMessage || '게시판 저장에 실패했습니다.')
    } finally {
      setLearningBoardLoading(false)
    }
  }

  const handleDeleteLearningBoard = async (boardId: number): Promise<void> => {
    if (!canManageClassContent) {
      return
    }

    setLearningBoardLoading(true)
    try {
      await api.delete<{ success: boolean }>(`/classroom/learning-boards/${boardId}`)
      setLearningBoardMessage('게시판을 삭제했습니다.')
      await refreshLearningBoards()
    } catch {
      setLearningBoardMessage('게시판 삭제에 실패했습니다.')
    } finally {
      setLearningBoardLoading(false)
    }
  }

  const handleUploadLearningBoardPostImage = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      setLearningBoardMessage('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    setUploadingLearningPostImage(true)
    setLearningBoardMessage('게시글 이미지를 업로드 중입니다...')

    try {
      const presign = await api.post<UploadContract>('/runtime-uploads/presign', {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        category: 'learning-board-post',
      })

      await fetch(presign.upload_url, {
        method: 'PUT',
        headers: presign.headers,
        body: file,
      })

      setLearningBoardPostForm((prev) => ({
        ...prev,
        image_url: presign.public_url,
        image_object_key: presign.object_key,
        image_original_filename: presign.original_filename,
      }))
      setLearningBoardMessage('이미지를 첨부했습니다.')
    } catch {
      setLearningBoardMessage('이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingLearningPostImage(false)
      if (learningPostImageInputRef.current) {
        learningPostImageInputRef.current.value = ''
      }
    }
  }

  const handleSaveLearningBoardPost = async (): Promise<void> => {
    if (!selectedLearningBoardId || !selectedStudentForActivityShop) {
      setLearningBoardMessage('게시판과 학생을 먼저 선택해 주세요.')
      return
    }

    const content = learningBoardPostForm.content.trim()
    if (!content) {
      setLearningBoardMessage('글 내용을 입력해 주세요.')
      return
    }

    setLearningBoardLoading(true)
    try {
      if (editingLearningPostId) {
        const updatePayload: LearningBoardPostUpdatePayload = {
          content,
          image_url: learningBoardPostForm.image_url.trim() || null,
          image_object_key: learningBoardPostForm.image_object_key.trim() || null,
          image_original_filename: learningBoardPostForm.image_original_filename.trim() || null,
        }
        await api.patch<LearningBoardPost>(`/classroom/learning-boards/posts/${editingLearningPostId}`, updatePayload)
        setLearningBoardMessage('게시글을 수정했습니다.')
      } else {
        const payload: LearningBoardPostCreatePayload = {
          student_id: selectedStudentForActivityShop,
          content,
          image_url: learningBoardPostForm.image_url.trim() || null,
          image_object_key: learningBoardPostForm.image_object_key.trim() || null,
          image_original_filename: learningBoardPostForm.image_original_filename.trim() || null,
        }
        await api.post<LearningBoardPost>(`/classroom/learning-boards/${selectedLearningBoardId}/posts`, payload)
        setLearningBoardMessage('게시글을 등록했습니다.')
      }

      setLearningBoardSort('number')
      setLearningBoardPostForm(emptyLearningBoardPostForm)
      setEditingLearningPostId(null)
      await refreshLearningBoardPosts(selectedLearningBoardId, 'number')
      await refreshLearningBoards()
    } catch {
      setLearningBoardMessage('게시글 저장에 실패했습니다.')
    } finally {
      setLearningBoardLoading(false)
    }
  }

  const handleDeleteLearningPost = async (postId: number): Promise<void> => {
    if (!selectedLearningBoardId) {
      return
    }

    setLearningBoardLoading(true)
    try {
      await api.delete<{ success: boolean }>(`/classroom/learning-boards/posts/${postId}`)
      setLearningBoardMessage('게시글을 삭제했습니다.')
      await refreshLearningBoardPosts(selectedLearningBoardId)
      await refreshLearningBoards()
    } catch {
      setLearningBoardMessage('게시글 삭제에 실패했습니다.')
    } finally {
      setLearningBoardLoading(false)
    }
  }

  const handleToggleLearningPostLike = async (postId: number): Promise<void> => {
    if (!selectedStudentForActivityShop || !selectedLearningBoardId) {
      setLearningBoardMessage('학생을 먼저 선택해 주세요.')
      return
    }

    try {
      await api.post<LearningBoardLikeToggleResponse>(
        `/classroom/learning-boards/posts/${postId}/likes?student_id=${selectedStudentForActivityShop}`,
      )
      await refreshLearningBoardPosts(selectedLearningBoardId)
    } catch {
      setLearningBoardMessage('좋아요 처리에 실패했습니다.')
    }
  }

  const handleAddLearningComment = async (postId: number): Promise<void> => {
    if (!selectedStudentForActivityShop || !selectedLearningBoardId) {
      setLearningBoardMessage('학생을 먼저 선택해 주세요.')
      return
    }

    const comment = (learningBoardCommentDrafts[postId] ?? '').trim()
    if (!comment) {
      return
    }

    const payload: LearningBoardCommentCreatePayload = {
      student_id: selectedStudentForActivityShop,
      content: comment,
    }

    try {
      await api.post<LearningBoardComment>(`/classroom/learning-boards/posts/${postId}/comments`, payload)
      setLearningBoardCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      await refreshLearningBoardPosts(selectedLearningBoardId)
      await refreshLearningBoards()
    } catch {
      setLearningBoardMessage('댓글 등록에 실패했습니다.')
    }
  }

  const handleDeleteLearningComment = async (commentId: number): Promise<void> => {
    if (!selectedLearningBoardId) {
      return
    }

    try {
      await api.delete<{ success: boolean }>(`/classroom/learning-boards/comments/${commentId}`)
      await refreshLearningBoardPosts(selectedLearningBoardId)
    } catch {
      setLearningBoardMessage('댓글 삭제에 실패했습니다.')
    }
  }

  useEffect(() => {
    if (authUser) {
      return
    }

    const loadPublicStudents = async () => {
      try {
        const items = await api.get<PublicStudentLoginItem[]>('/classroom/public/students')
        setPublicStudentItems(items)
      } catch {
        setPublicStudentItems([])
      }
    }

    void loadPublicStudents()
  }, [authUser])

  useEffect(() => {
    if (!authUser || isStudentSession) {
      return
    }
    void refreshTeacherData()
  }, [authUser, isStudentSession, sortBy])

  useEffect(() => {
    if (!authUser || !isStudentSession) {
      return
    }

    setActiveMenu('학생 목록')
    setStudentDetail(null)
    void refreshStudentData()
  }, [authUser, isStudentSession, sortBy])

  useEffect(() => {
    if (isStudentSession && activeMenu === '학생 로그인') {
      setActiveMenu('학생 목록')
    }
  }, [isStudentSession, activeMenu])

  useEffect(() => {
    if (activityShopSelectableStudents.length === 0) {
      setSelectedStudentForActivityShop(null)
      return
    }

    const studentExists = activityShopSelectableStudents.some((student) => student.id === selectedStudentForActivityShop)
    if (!selectedStudentForActivityShop || !studentExists) {
      setSelectedStudentForActivityShop(activityShopSelectableStudents[0]?.id ?? null)
    }
  }, [activityShopSelectableStudents, selectedStudentForActivityShop])

  useEffect(() => {
    if (!authUser || !selectedStudentForActivityShop) {
      setCouponInventory([])
      return
    }

    const loadCouponInventory = async () => {
      try {
        const rows = await api.get<StudentCouponInventoryRow[]>(`/classroom/activity-shop/students/${selectedStudentForActivityShop}/coupon-inventory`)
        setCouponInventory(rows)
      } catch {
        setCouponInventory([])
      }
    }

    void loadCouponInventory()
  }, [authUser, selectedStudentForActivityShop, activityCoupons.length, couponLedger.length])

  useEffect(() => {
    if (!authUser || !selectedFundingProjectId) {
      setFundingProjectDetail(null)
      return
    }

    const loadFundingDetail = async () => {
      try {
        const detail = await api.get<FundingProjectDetail>(`/classroom/activity-shop/funding-projects/${selectedFundingProjectId}/detail`)
        setFundingProjectDetail(detail)
      } catch {
        setFundingProjectDetail(null)
      }
    }

    void loadFundingDetail()
  }, [authUser, selectedFundingProjectId, fundingProjects.length])

  useEffect(() => {
    if (!authUser || activeMenu !== '학습 게시판') {
      return
    }

    setLearningBoardScreen('list')
    setLearningBoardSort('number')

    const loadBoards = async () => {
      try {
        await refreshLearningBoards()
      } catch {
        setLearningBoardMessage('게시판 목록을 불러오지 못했습니다.')
      }
    }

    void loadBoards()
  }, [authUser, activeMenu, canManageClassContent])

  useEffect(() => {
    if (!authUser || activeMenu !== '학습 게시판' || !selectedLearningBoardId) {
      setLearningBoardPosts([])
      return
    }

    const loadPosts = async () => {
      try {
        await refreshLearningBoardPosts(selectedLearningBoardId)
      } catch (error) {
        setLearningBoardPosts([])
        const errorMessage = error instanceof Error ? error.message : ''
        setLearningBoardMessage(errorMessage || '게시판을 열지 못했습니다.')
      }
    }

    void loadPosts()
  }, [authUser, activeMenu, selectedLearningBoardId, learningBoardSort, selectedStudentForActivityShop])


  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(TITLE_REWARD_STORAGE_KEY)
    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as Record<string, TitleRewardConfig>
      const normalized: Record<number, TitleRewardConfig> = {}
      Object.entries(parsed).forEach(([key, value]) => {
        const numericId = Number(key)
        if (!Number.isFinite(numericId)) {
          return
        }

        const rewardExp = Number(value.reward_exp)
        const rewardWon = Number(value.reward_won)
        normalized[numericId] = {
          reward_exp: Number.isFinite(rewardExp) && rewardExp >= 0 ? Math.floor(rewardExp) : 40,
          reward_won: Number.isFinite(rewardWon) && rewardWon >= 0 ? Math.floor(rewardWon) : 80,
        }
      })
      setTitleRewardById(normalized)
    } catch {
      setTitleRewardById({})
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TITLE_REWARD_STORAGE_KEY, JSON.stringify(titleRewardById))
  }, [titleRewardById])

  useEffect(() => {
    return () => {
      for (const timeoutId of celebrationTimeoutRef.current) {
        window.clearTimeout(timeoutId)
      }
      celebrationTimeoutRef.current = []

      if (rouletteSpinTimeoutRef.current !== null) {
        window.clearTimeout(rouletteSpinTimeoutRef.current)
        rouletteSpinTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!isTimerRunning) {
      return
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          setIsTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isTimerRunning])

  useEffect(() => {
    if (!isStopwatchRunning) {
      return
    }

    const intervalId = window.setInterval(() => {
      setStopwatchCentiseconds((prev) => prev + 1)
    }, 10)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isStopwatchRunning])

  const loadStudentDetail = async (studentId: number) => {
    setStudentDetailLoading(true)
    setStudentDetailError('')

    try {
      const detail = await api.get<StudentDetail>(`/classroom/students/${studentId}/detail`)
      setStudentDetail(detail)
      setProfileNameDraft(detail.student.name)
      const activeTitle = detail.earned_titles.find((item) => item.is_selected) ?? null
      setSelectedEarnedTitleId(activeTitle?.title_definition_id ?? null)
      setStudentDetailTab('info')
      setActivityFilter('all')
      setAdminEconomyDraft({
        total_exp: String(detail.economy.total_exp),
        won_balance: String(detail.economy.won),
        nyang_balance: String(detail.economy.nyang),
        core_balance: String(detail.economy.core),
        starlight_shard_balance: String(detail.economy.starlight_shard),
        wisdom: String(detail.student.wisdom),
        creativity: String(detail.student.creativity),
        personality: String(detail.student.personality),
        vitality: String(detail.student.vitality),
        diligence: String(detail.student.diligence),
        communication: String(detail.student.communication),
      })
      setShowAdminEconomyEditor(false)
    } catch {
      setStudentDetailError('학생 상세정보를 불러오지 못했습니다.')
    } finally {
      setStudentDetailLoading(false)
    }
  }

  const handleOpenStudentDetail = async (studentId: number) => {
    await loadStudentDetail(studentId)
  }

  const handleBackToStudentList = () => {
    setStudentDetail(null)
    setStudentDetailError('')
    setPhotoUploadMessage('')
    setSelectedEarnedTitleId(null)
    setActivityFilter('all')
    setTitleTabMessage('')
    setAdminEconomyDraft({
      total_exp: '',
      won_balance: '',
      nyang_balance: '',
      core_balance: '',
      starlight_shard_balance: '',
      wisdom: '',
      creativity: '',
      personality: '',
      vitality: '',
      diligence: '',
      communication: '',
    })
    setShowAdminEconomyEditor(false)
  }

  const handleCreateStudentLoginAccount = async () => {
    setStudentLoginLoading(true)
    setStudentLoginMessage('')

    try {
      const nickname = studentLoginNickname.trim()
      await api.post<StudentLoginAccount>('/classroom/students/login-accounts/add', {
        nickname: nickname.length > 0 ? nickname : null,
      })
      setStudentLoginNickname('')
      setStudentLoginMessage('학생이 추가되었습니다.')
      await refreshTeacherData()
    } catch {
      setStudentLoginMessage('학생 추가에 실패했습니다.')
    } finally {
      setStudentLoginLoading(false)
    }
  }

  const getDefaultStudentPin = (studentNumber: number) => `${1000 + studentNumber}`

  const handleDeleteStudentLoginAccount = async (account: StudentLoginAccount) => {
    const confirmed = window.confirm(`${account.student_number}번 학생(${account.nickname})을(를) 삭제할까요?`)
    if (!confirmed) {
      return
    }

    setStudentLoginActionStudentId(account.id)
    setStudentLoginActionType('delete')
    setStudentLoginMessage('')

    try {
      await api.delete(`/classroom/students/${account.id}`)
      setStudentLoginMessage(`${account.student_number}번 학생을 삭제했습니다.`)
      if (studentDetail?.student.id === account.id) {
        handleBackToStudentList()
      }
      await refreshTeacherData()
    } catch {
      setStudentLoginMessage('학생 삭제 API가 아직 연결되지 않았습니다. 백엔드에서 삭제 엔드포인트가 필요합니다.')
    } finally {
      setStudentLoginActionStudentId(null)
      setStudentLoginActionType(null)
    }
  }

  const handleResetStudentPinToDefault = async (account: StudentLoginAccount) => {
    const defaultPin = getDefaultStudentPin(account.student_number)

    setStudentLoginActionStudentId(account.id)
    setStudentLoginActionType('reset-pin')
    setStudentLoginMessage('')

    try {
      await api.patch(`/classroom/students/${account.id}/access-code`, {
        access_code: defaultPin,
      })
      setStudentLoginMessage(`${account.student_number}번 학생 PIN을 기본값(${defaultPin})으로 복원했습니다.`)
      await refreshTeacherData()
    } catch {
      setStudentLoginMessage('PIN 복원 API가 아직 연결되지 않았습니다. 백엔드에서 PIN 변경 엔드포인트가 필요합니다.')
    } finally {
      setStudentLoginActionStudentId(null)
      setStudentLoginActionType(null)
    }
  }

  const handleSaveStudentProfile = async () => {
    if (!studentDetail) {
      return
    }

    if (!canEditStudentBySession(studentDetail.student.id)) {
      setStudentDetailError('PIN으로 로그인한 학생은 본인 정보만 수정할 수 있습니다.')
      return
    }

    setSavingProfile(true)
    setStudentDetailError('')

    try {
      await api.patch<Student>(`/classroom/students/${studentDetail.student.id}/profile`, {
        name: profileNameDraft,
      })
      await refreshTeacherData()
      await loadStudentDetail(studentDetail.student.id)
    } catch {
      setStudentDetailError('이름 또는 칭호를 저장하지 못했습니다.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSelectStudentTitle = async () => {
    if (!studentDetail || !selectedEarnedTitleId) {
      setStudentDetailError('선택할 칭호가 없습니다.')
      return
    }

    if (!canEditStudentBySession(studentDetail.student.id)) {
      setStudentDetailError('PIN으로 로그인한 학생은 본인 칭호만 변경할 수 있습니다.')
      return
    }

    setSavingTitleSelection(true)
    setStudentDetailError('')

    try {
      await api.patch<Student>(
        `/classroom/students/${studentDetail.student.id}/titles/${selectedEarnedTitleId}/select`,
      )
      await loadStudentDetail(studentDetail.student.id)
      await refreshTeacherData()
    } catch {
      setStudentDetailError('칭호 선택 저장에 실패했습니다.')
    } finally {
      setSavingTitleSelection(false)
    }
  }

  const openCreateTitleModal = () => {
    setEditingTitle(null)
    setTitleForm(emptyTitleForm())
    setTitleTabError('')
    setTitleTabMessage('')
    setShowTitleEditorModal(true)
  }

  const openEditTitleModal = (title: TitleDefinition) => {
    setEditingTitle(title)
    setTitleForm({
      title_name: title.title_name,
      description: title.description ?? '',
      condition_text: title.condition_text,
      icon_key: title.icon_key ?? titleIconPresets[0]?.key ?? 'shield',
      frame_key: title.frame_key ?? titleFramePresets[0]?.key ?? 'royal',
      reward_exp: String(title.reward_exp),
      reward_won: String(title.reward_won),
      achievement_mode: title.achievement_mode,
      auto_condition_type: title.auto_condition_type,
      condition_card_id: title.condition_card_id ? String(title.condition_card_id) : '',
      condition_stat_key: title.condition_stat_key ?? missionStatOptions[0]?.key ?? 'diligence',
      condition_target_count: title.condition_target_count ? String(title.condition_target_count) : '1',
      icon_public_url: title.icon_public_url,
      icon_object_key: title.icon_object_key,
      icon_original_filename: title.icon_original_filename,
      icon_content_type: title.icon_content_type,
    })
    setTitleTabError('')
    setTitleTabMessage('')
    setShowTitleEditorModal(true)
  }

  const closeTitleEditorModal = () => {
    setShowTitleEditorModal(false)
    setEditingTitle(null)
    setTitleForm(emptyTitleForm())
  }

  const handleUploadTitleIcon = async (file: File) => {
    setUploadingTitleIcon(true)
    setTitleTabError('')
    setTitleTabMessage('칭호 아이콘 업로드 중입니다...')

    try {
      const presign = await api.post<UploadContract>('/runtime-uploads/presign', {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        category: 'title-icon',
      })

      await fetch(presign.upload_url, {
        method: 'PUT',
        headers: presign.headers,
        body: file,
      })

      setTitleForm((prev) => ({
        ...prev,
        icon_public_url: presign.public_url,
        icon_object_key: presign.object_key,
        icon_original_filename: presign.original_filename,
        icon_content_type: file.type || 'application/octet-stream',
      }))
      setTitleTabMessage('직접 업로드한 아이콘이 적용되었습니다.')
    } catch {
      setTitleTabError('아이콘 업로드에 실패했습니다.')
    } finally {
      setUploadingTitleIcon(false)
    }
  }

  const handleSubmitTitleForm = async () => {
    const titleName = titleForm.title_name.trim()
    const conditionText = titleForm.condition_text.trim()
    if (!titleName || !conditionText) {
      setTitleTabError('칭호명과 획득 조건을 입력해 주세요.')
      return
    }

    const rewardExp = Number(titleForm.reward_exp)
    const rewardWon = Number(titleForm.reward_won)
    if (!Number.isFinite(rewardExp) || !Number.isFinite(rewardWon) || rewardExp < 0 || rewardWon < 0) {
      setTitleTabError('칭호 보상 EXP/원은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    let parsedConditionCardId: number | null = null
    let parsedConditionStatKey: string | null = null
    let parsedConditionTargetCount: number | null = null

    if (titleForm.achievement_mode === 'auto') {
      const parsedTargetCount = Number(titleForm.condition_target_count)
      if (!Number.isFinite(parsedTargetCount) || parsedTargetCount < 1) {
        setTitleTabError('자동 달성 목표 횟수/수치는 1 이상의 숫자로 입력해 주세요.')
        return
      }
      parsedConditionTargetCount = Math.floor(parsedTargetCount)

      if (titleForm.auto_condition_type === 'card_issue_count') {
        const parsedCardId = Number(titleForm.condition_card_id)
        if (!Number.isFinite(parsedCardId) || parsedCardId < 1) {
          setTitleTabError('자동 달성 카드 조건은 발급 기준 카드를 선택해야 합니다.')
          return
        }
        parsedConditionCardId = Math.floor(parsedCardId)
      } else if (titleForm.auto_condition_type === 'stat_threshold') {
        const statKey = titleForm.condition_stat_key.trim()
        if (!statKey) {
          setTitleTabError('자동 달성 스탯 조건은 기준 스탯을 선택해야 합니다.')
          return
        }
        parsedConditionStatKey = statKey
      } else {
        setTitleTabError('자동 달성 조건 유형을 선택해 주세요.')
        return
      }
    }

    setSavingTitleForm(true)
    setTitleTabError('')

    const payload = {
      title_name: titleName,
      description: titleForm.description.trim() || null,
      condition_text: conditionText,
      icon_key: titleForm.icon_key,
      frame_key: titleForm.frame_key,
      icon_public_url: titleForm.icon_public_url,
      icon_object_key: titleForm.icon_object_key,
      icon_original_filename: titleForm.icon_original_filename,
      icon_content_type: titleForm.icon_content_type,
      reward_exp: Math.floor(rewardExp),
      reward_won: Math.floor(rewardWon),
      achievement_mode: titleForm.achievement_mode,
      auto_condition_type:
        titleForm.achievement_mode === 'auto' ? titleForm.auto_condition_type : 'none',
      condition_card_id: titleForm.achievement_mode === 'auto' ? parsedConditionCardId : null,
      condition_stat_key: titleForm.achievement_mode === 'auto' ? parsedConditionStatKey : null,
      condition_target_count:
        titleForm.achievement_mode === 'auto' ? parsedConditionTargetCount : null,
      is_active: true,
    }

    try {
      if (editingTitle) {
        const updatedTitle = await api.patch<TitleDefinition>(`/classroom/titles/${editingTitle.id}`, payload)
        setTitleRewardById((prev) => ({
          ...prev,
          [updatedTitle.id]: {
            reward_exp: Math.floor(rewardExp),
            reward_won: Math.floor(rewardWon),
          },
        }))
        setTitleTabMessage('칭호가 수정되었습니다.')
      } else {
        const createdTitle = await api.post<TitleDefinition>('/classroom/titles', payload)
        setTitleRewardById((prev) => ({
          ...prev,
          [createdTitle.id]: {
            reward_exp: Math.floor(rewardExp),
            reward_won: Math.floor(rewardWon),
          },
        }))
        setTitleTabMessage('새 칭호가 생성되었습니다.')
      }
      closeTitleEditorModal()
      await refreshTeacherData()
    } catch {
      setTitleTabError('칭호 저장에 실패했습니다.')
    } finally {
      setSavingTitleForm(false)
    }
  }

  const handleDeleteTitle = async (title: TitleDefinition) => {
    const confirmed = window.confirm(`'${title.title_name}' 칭호를 삭제할까요?`)
    if (!confirmed) {
      return
    }

    setTitleTabError('')
    setTitleTabMessage('')

    try {
      await api.delete<{ success: boolean }>(`/classroom/titles/${title.id}`)
      setTitleRewardById((prev) => {
        const next = { ...prev }
        delete next[title.id]
        return next
      })
      setTitleTabMessage('칭호가 삭제되었습니다.')
      await refreshTeacherData()
    } catch {
      setTitleTabError('칭호 삭제에 실패했습니다.')
    }
  }

  const handleOpenIssueModal = async (
    title: TitleDefinition,
    options?: {
      preselectedStudentIds?: number[]
      defaultAwardReason?: string
    },
  ) => {
    setIssuingTitle(title)
    setShowTitleIssueModal(true)
    setIssueSearchKeyword('')
    setIssueAwardReason(options?.defaultAwardReason ?? '')
    setSelectedIssueStudentIds(options?.preselectedStudentIds ?? [])
    setLoadingTitleRecipients(true)

    try {
      const recipients = await api.get<StudentTitleRecipient[]>(`/classroom/titles/${title.id}/recipients`)
      setTitleRecipients(recipients)
    } catch {
      setTitleRecipients([])
    } finally {
      setLoadingTitleRecipients(false)
    }
  }

  const openTitlePreviewModal = (title: TitleDefinition) => {
    const rewardConfig = getTitleRewardConfig(title.id)
    setPreviewTitle(title)
    setTitleMissionRewardExp(String(rewardConfig.reward_exp))
    setTitleMissionRewardWon(String(rewardConfig.reward_won))
    setTitleTabError('')
    setShowTitlePreviewModal(true)
  }

  const handleCreateMissionFromTitle = () => {
    if (!previewTitle) {
      return
    }

    const rewardExp = Number(titleMissionRewardExp)
    const rewardWon = Number(titleMissionRewardWon)

    if (!Number.isFinite(rewardExp) || !Number.isFinite(rewardWon) || rewardExp < 0 || rewardWon < 0) {
      setTitleTabError('칭호 미션 보상은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    setTitleRewardById((prev) => ({
      ...prev,
      [previewTitle.id]: {
        reward_exp: Math.floor(rewardExp),
        reward_won: Math.floor(rewardWon),
      },
    }))

    setMissionForm({
      ...emptyMissionForm(),
      title: `${previewTitle.title_name} 칭호 미션`,
      description: previewTitle.condition_text,
      icon_key: 'trophy',
      target_stat_key: 'personality',
      target_stat_label: missionStatLabelMap.personality,
      reward_exp: String(Math.floor(rewardExp)),
      reward_won: String(Math.floor(rewardWon)),
      reward_nyang: '0',
      repeatable: false,
      weekly_reset: false,
      goal_count: '1',
    })

    setEditingMission(null)
    setMissionMessage('칭호 기반 미션 초안을 불러왔습니다. 필요한 값만 조정 후 저장하세요.')
    setShowMissionModal(true)
    setShowTitlePreviewModal(false)
    setPreviewTitle(null)
    setActiveMenu('미션')
  }

  const handleToggleIssueStudent = (studentId: number) => {
    setSelectedIssueStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleToggleSelectAllIssueStudents = () => {
    if (isAllFilteredStudentsSelected) {
      const filteredIds = new Set(filteredIssueStudents.map((student) => student.id))
      setSelectedIssueStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)))
      return
    }

    setSelectedIssueStudentIds((prev) => {
      const next = new Set(prev)
      for (const student of filteredIssueStudents) {
        next.add(student.id)
      }
      return Array.from(next)
    })
  }

  const handleSubmitIssue = async () => {
    if (!issuingTitle) {
      return
    }

    if (selectedIssueStudentIds.length === 0) {
      setTitleTabError('발급할 학생을 선택해 주세요.')
      return
    }

    const currentTitle = issuingTitle
    const rewardConfig = getTitleRewardConfig(currentTitle.id)

    setSubmittingTitleIssue(true)
    setTitleTabError('')

    try {
      const result = await api.post<TitleIssueResult>(`/classroom/titles/${currentTitle.id}/issue`, {
        student_ids: selectedIssueStudentIds,
        awarded_reason: issueAwardReason.trim() || null,
        reward_exp: rewardConfig.reward_exp,
        reward_won: rewardConfig.reward_won,
      })
      setTitleTabMessage(`칭호를 ${result.issued_count}명에게 발급했습니다.`)
      setCelebratingTitleIds((prev) =>
        prev.includes(currentTitle.id) ? prev : [...prev, currentTitle.id],
      )
      const timeoutId = window.setTimeout(() => {
        setCelebratingTitleIds((prev) => prev.filter((id) => id !== currentTitle.id))
      }, 2400)
      celebrationTimeoutRef.current.push(timeoutId)

      setShowTitleIssueModal(false)
      setIssuingTitle(null)
      await refreshTeacherData()
    } catch {
      setTitleTabError('칭호 발급에 실패했습니다.')
    } finally {
      setSubmittingTitleIssue(false)
    }
  }

  const handleOpenAdminEconomyEditor = () => {
    if (!canManageStudentEconomy) {
      setStudentDetailError('현재 계정으로는 경험치/재화/스탯 수정 권한이 없습니다.')
      return
    }

    setStudentDetailError('')
    setShowAdminEconomyEditor(true)

    window.requestAnimationFrame(() => {
      economyEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleToggleAdminEconomyEditor = () => {
    if (!canManageStudentEconomy) {
      setStudentDetailError('현재 계정으로는 경험치/재화/스탯 수정 권한이 없습니다.')
      return
    }

    setStudentDetailError('')
    setShowAdminEconomyEditor((prev) => !prev)
  }

  const handleSaveStudentEconomyAsAdmin = async () => {
    if (!studentDetail || !canManageStudentEconomy) {
      setStudentDetailError('해당 학생의 경험치/재화/스탯을 수정할 권한이 없습니다.')
      return
    }

    const entries = Object.entries(adminEconomyDraft)
    const payload: StudentEconomyUpdatePayload = {}

    for (const [key, value] of entries) {
      const trimmed = value.trim()
      if (trimmed === '') {
        continue
      }

      const numericValue = Number(trimmed)
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        setStudentDetailError('경험치/재화/스탯은 0 이상의 숫자로 입력해 주세요.')
        return
      }

      payload[key as keyof StudentEconomyUpdatePayload] = Math.floor(numericValue)
    }

    if (Object.keys(payload).length === 0) {
      setStudentDetailError('수정할 경험치/재화/스탯 값을 입력해 주세요.')
      return
    }

    setSavingAdminEconomy(true)
    setStudentDetailError('')

    try {
      await api.patch(`/classroom/students/${studentDetail.student.id}/economy`, payload)
      await refreshTeacherData()
      await loadStudentDetail(studentDetail.student.id)
    } catch {
      setStudentDetailError('값 저장에 실패했습니다. 권한 또는 입력값을 확인해 주세요.')
    } finally {
      setSavingAdminEconomy(false)
    }
  }

  const handleUploadStudentPhoto = async (file: File) => {
    if (!studentDetail) {
      return
    }

    if (!canEditStudentBySession(studentDetail.student.id)) {
      setPhotoUploadMessage('본인 계정에서만 사진을 업로드할 수 있습니다.')
      return
    }

    setPhotoUploadMessage('사진 업로드 준비 중...')

    try {
      const presign = await api.post<UploadContract>('/runtime-uploads/presign', {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        category: 'student-photo',
      })

      await fetch(presign.upload_url, {
        method: 'PUT',
        headers: presign.headers,
        body: file,
      })

      await api.post(`/classroom/students/${studentDetail.student.id}/photos`, {
        public_url: presign.public_url,
        object_key: presign.object_key,
        original_filename: presign.original_filename,
        content_type: file.type || 'application/octet-stream',
      })

      setPhotoUploadMessage('사진이 저장되었습니다.')
      await loadStudentDetail(studentDetail.student.id)
    } catch {
      setPhotoUploadMessage('사진 업로드에 실패했습니다.')
    }
  }

  const handleEquipAvatar = async (avatarItemId: number) => {
    if (!studentDetail) {
      return
    }

    if (!canEditStudentBySession(studentDetail.student.id)) {
      setStudentDetailError('PIN으로 로그인한 학생은 본인 아바타만 장착할 수 있습니다.')
      return
    }

    try {
      await api.post(`/classroom/students/${studentDetail.student.id}/avatars/${avatarItemId}/equip`)
      await loadStudentDetail(studentDetail.student.id)
    } catch {
      setStudentDetailError('아바타 장착에 실패했습니다.')
    }
  }

  const handleOpenStudentPinModal = (student: PublicStudentLoginItem) => {
    setSelectedStudentForPin(student)
    setStudentPinCode('')
    setAuthError('')
  }

  const handleStudentPinSubmit = async () => {
    if (!selectedStudentForPin) {
      return
    }

    setAuthError('')
    setStudentPinSubmitting(true)

    try {
      const result = await signInStudent(selectedStudentForPin.id, studentPinCode.trim())
      if (!result.success) {
        setAuthError(result.error ?? 'PIN 인증에 실패했습니다.')
        return
      }

      setAuthUser(getCurrentUser())
      setSelectedStudentForPin(null)
      setStudentPinCode('')
      setActiveMenu('학생 목록')
    } finally {
      setStudentPinSubmitting(false)
    }
  }

  const handleAuthSubmit = async () => {
    setAuthError('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setAuthError('이메일을 입력해 주세요.')
      return
    }

    const result = await signIn(normalizedEmail, password)

    if (!result.success) {
      setAuthError(result.error ?? '로그인에 실패했습니다.')
      return
    }

    setAuthUser(getCurrentUser())
    setActiveMenu('학생 목록')
    window.location.href = '/dashboard'
  }

  const openCreateCardModal = (cardType: 'praise' | 'warning') => {
    setEditingCard(null)
    setActiveCardTab(cardType)
    setCardForm(emptyCardForm(cardType))
    setCardMessage('')
    setShowCardEditorModal(true)
  }

  const openEditCardModal = (card: ClassroomCard) => {
    const availableKeys = new Set(cardIconPresetsByType[card.card_type].map((preset) => preset.key))
    const selectedStatKeys = missionStatOptions
      .map((option) => option.key)
      .filter((key) => card.stat_changes.some((stat) => stat.stat_key === key))
      .slice(0, 6)
    const firstStat = card.stat_changes[0]

    setEditingCard(card)
    setActiveCardTab(card.card_type)
    setCardForm({
      title: card.title,
      description: card.description ?? '',
      icon_key: availableKeys.has(card.icon_key)
        ? card.icon_key
        : (cardIconPresetsByType[card.card_type][0]?.key ?? emptyCardForm(card.card_type).icon_key),
      reward_exp: String(card.reward_exp),
      reward_won: String(card.reward_won),
      reward_nyang: String(card.reward_nyang),
      level_delta: String(card.level_delta),
      selected_stat_keys:
        selectedStatKeys.length > 0
          ? selectedStatKeys
          : [card.card_type === 'praise' ? 'personality' : 'diligence'],
      stat_delta: String(firstStat?.delta ?? 1),
    })
    setCardMessage('')
    setShowCardEditorModal(true)
  }

  const closeCardEditorModal = () => {
    setShowCardEditorModal(false)
    setEditingCard(null)
    setCardForm(emptyCardForm(activeCardTab))
  }

  const handleToggleCardStat = (statKey: string) => {
    setCardForm((prev) => {
      const currentlySelected = prev.selected_stat_keys.includes(statKey)
      if (currentlySelected) {
        return {
          ...prev,
          selected_stat_keys: prev.selected_stat_keys.filter((key) => key !== statKey),
        }
      }

      if (prev.selected_stat_keys.length >= 6) {
        setCardMessage('스탯은 최대 6개까지 선택할 수 있습니다.')
        return prev
      }

      return {
        ...prev,
        selected_stat_keys: [...prev.selected_stat_keys, statKey],
      }
    })
  }

  const handleSubmitCard = async () => {
    const title = cardForm.title.trim()
    if (!title) {
      setCardMessage('카드 이름을 입력해 주세요.')
      return
    }

    const rewardExp = Number(cardForm.reward_exp)
    const rewardWon = Number(cardForm.reward_won)
    const rewardNyang = Number(cardForm.reward_nyang)
    const levelDelta = Number(cardForm.level_delta)
    const statDelta = Number(cardForm.stat_delta)
    const selectedStatKeys = missionStatOptions
      .map((option) => option.key)
      .filter((key) => cardForm.selected_stat_keys.includes(key))
      .slice(0, 6)

    if (
      !Number.isFinite(rewardExp) ||
      !Number.isFinite(rewardWon) ||
      !Number.isFinite(rewardNyang) ||
      !Number.isFinite(levelDelta) ||
      !Number.isFinite(statDelta) ||
      rewardExp < 0 ||
      rewardWon < 0 ||
      rewardNyang < 0 ||
      levelDelta < 0 ||
      statDelta < 1
    ) {
      setCardMessage('보상/스탯 값은 올바른 숫자로 입력해 주세요.')
      return
    }

    if (selectedStatKeys.length === 0) {
      setCardMessage('상승/감소 스탯을 최소 1개 선택해 주세요.')
      return
    }

    const allowedIconKeys = new Set(activeCardIconPresets.map((preset) => preset.key))
    const normalizedIconKey =
      allowedIconKeys.has(cardForm.icon_key) && cardForm.icon_key
        ? cardForm.icon_key
        : (activeCardIconPresets[0]?.key ?? emptyCardForm(activeCardTab).icon_key)

    const payload: ClassroomCardCreatePayload = {
      card_type: activeCardTab,
      title,
      description: cardForm.description.trim() || null,
      icon_key: normalizedIconKey,
      category: activeCardTab === 'praise' ? '칭찬카드' : '주의카드',
      reward_exp: Math.floor(rewardExp),
      reward_won: Math.floor(rewardWon),
      reward_nyang: Math.floor(rewardNyang),
      level_delta: Math.floor(levelDelta),
      stat_changes: selectedStatKeys.map((key) => ({
        stat_key: key,
        stat_label: missionStatLabelMap[key] ?? key,
        delta: Math.floor(statDelta),
      })),
    }

    setSavingCard(true)
    setCardMessage('')

    try {
      if (editingCard) {
        const updatePayload: ClassroomCardUpdatePayload = { ...payload }
        await api.patch<ClassroomCard>(`/classroom/cards/${editingCard.id}`, updatePayload)
        setCardMessage('카드가 수정되었습니다.')
      } else {
        await api.post<ClassroomCard>('/classroom/cards', payload)
        setCardMessage('새 카드가 생성되었습니다.')
      }
      closeCardEditorModal()
      await refreshTeacherData()
    } catch {
      setCardMessage('카드 저장에 실패했습니다.')
    } finally {
      setSavingCard(false)
    }
  }

  const handleCloseCard = async (card: ClassroomCard) => {
    try {
      await api.patch<ClassroomCard>(`/classroom/cards/${card.id}`, { is_active: false })
      setCardMessage('카드를 비활성화했습니다.')
      await refreshTeacherData()
    } catch {
      setCardMessage('카드 상태 변경에 실패했습니다.')
    }
  }

  const handleOpenCardIssueModal = async (card: ClassroomCard) => {
    setIssuingCard(card)
    setSelectedCardStudentIds([])
    setCardIssueKeyword('')
    setCardIssueNote('')
    setShowCardIssueModal(true)
    setLoadingCardHistory(true)

    try {
      const history = await api.get<ClassroomCardHistoryResponse>(`/classroom/cards/${card.id}/history`)
      setCardHistory(history)
    } catch {
      setCardHistory({ card_id: card.id, recipients: [], history: [] })
    } finally {
      setLoadingCardHistory(false)
    }
  }

  const handleToggleCardStudent = (studentId: number) => {
    setSelectedCardStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleToggleSelectAllCardStudents = () => {
    if (isAllFilteredCardStudentsSelected) {
      const filteredIds = new Set(filteredCardStudents.map((student) => student.id))
      setSelectedCardStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)))
      return
    }

    setSelectedCardStudentIds((prev) => {
      const next = new Set(prev)
      for (const student of filteredCardStudents) {
        next.add(student.id)
      }
      return Array.from(next)
    })
  }

  const handleSubmitCardIssue = async () => {
    if (!issuingCard) {
      return
    }
    if (selectedCardStudentIds.length === 0) {
      setCardMessage('발급할 학생을 선택해 주세요.')
      return
    }

    setIssuingCardLoading(true)
    setCardMessage('')

    try {
      const result = await api.post<ClassroomCardIssueResult>(`/classroom/cards/${issuingCard.id}/issue`, {
        student_ids: selectedCardStudentIds,
        issued_note: cardIssueNote.trim() || null,
      })
      setCardMessage(`카드를 ${result.issued_count}명에게 발급했습니다.`)
      const history = await api.get<ClassroomCardHistoryResponse>(`/classroom/cards/${issuingCard.id}/history`)
      setCardHistory(history)
      setSelectedCardStudentIds([])
      setCardIssueNote('')
      await refreshTeacherData()
      if (studentDetail && selectedCardStudentIds.includes(studentDetail.student.id)) {
        await loadStudentDetail(studentDetail.student.id)
      }
    } catch {
      setCardMessage('카드 발급에 실패했습니다.')
    } finally {
      setIssuingCardLoading(false)
    }
  }

  const openCreateMissionModal = () => {
    setEditingMission(null)
    setMissionForm(emptyMissionForm())
    setMissionMessage('')
    setShowMissionModal(true)
  }

  const openEditMissionModal = (mission: MissionItem) => {
    setEditingMission(mission)
    setMissionForm({
      title: mission.title,
      description: mission.description ?? '',
      icon_key: mission.icon_key,
      target_stat_key: mission.target_stat_key,
      target_stat_label: mission.target_stat_label,
      reward_exp: String(mission.reward_exp),
      reward_won: String(mission.reward_won),
      reward_nyang: String(mission.reward_nyang),
      repeatable: mission.repeatable,
      weekly_reset: mission.weekly_reset,
      goal_count: String(mission.goal_count),
    })
    setMissionMessage('')
    setShowMissionModal(true)
  }

  const closeMissionModal = () => {
    setShowMissionModal(false)
    setEditingMission(null)
    setMissionForm(emptyMissionForm())
  }

  const handleSubmitMission = async () => {
    const title = missionForm.title.trim()
    if (!title) {
      setMissionMessage('미션 이름을 입력해 주세요.')
      return
    }

    const selectedStat = missionStatOptions.find((option) => option.key === missionForm.target_stat_key)
    const rewardExp = Number(missionForm.reward_exp)
    const rewardWon = Number(missionForm.reward_won)
    const rewardNyang = Number(missionForm.reward_nyang)
    const goalCount = Number(missionForm.goal_count)

    if (
      !Number.isFinite(rewardExp) ||
      !Number.isFinite(rewardWon) ||
      !Number.isFinite(rewardNyang) ||
      !Number.isFinite(goalCount) ||
      rewardExp < 0 ||
      rewardWon < 0 ||
      rewardNyang < 0 ||
      goalCount < 1
    ) {
      setMissionMessage('경험치/원/냥/목표 횟수는 올바른 숫자로 입력해 주세요.')
      return
    }

    const payload: MissionCreatePayload = {
      title,
      description: missionForm.description.trim() || null,
      icon_key: missionForm.icon_key,
      target_stat_key: missionForm.target_stat_key,
      target_stat_label: selectedStat?.label ?? missionForm.target_stat_label,
      reward_exp: Math.floor(rewardExp),
      reward_won: Math.floor(rewardWon),
      reward_nyang: Math.floor(rewardNyang),
      repeatable: missionForm.repeatable,
      weekly_reset: missionForm.repeatable ? missionForm.weekly_reset : false,
      goal_count: Math.floor(goalCount),
    }

    setSavingMission(true)
    setMissionMessage('')

    try {
      if (editingMission) {
        const updatePayload: MissionUpdatePayload = {
          ...payload,
        }
        await api.patch<MissionItem>(`/classroom/missions/${editingMission.id}`, updatePayload)
        setMissionMessage('미션이 수정되었습니다.')
      } else {
        await api.post<MissionItem>('/classroom/missions', payload)
        setMissionMessage('미션이 생성되었습니다.')
      }
      closeMissionModal()
      await refreshTeacherData()
    } catch {
      setMissionMessage('미션 저장에 실패했습니다.')
    } finally {
      setSavingMission(false)
    }
  }

  const handleCloseMission = async (mission: MissionItem) => {
    try {
      await api.patch<MissionItem>(`/classroom/missions/${mission.id}`, { is_active: false })
      setMissionMessage('미션이 종료되었습니다.')
      await refreshTeacherData()
    } catch {
      setMissionMessage('미션 종료에 실패했습니다.')
    }
  }

  const handleOpenMissionAchieverModal = (mission: MissionItem) => {
    setAchieverTargetMission(mission)
    setMissionSearchKeyword('')
    setSelectedMissionStudentIds([])
    setShowMissionAchieverModal(true)
  }

  const handleToggleMissionStudent = (studentId: number) => {
    setSelectedMissionStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleToggleSelectAllMissionStudents = () => {
    if (isAllFilteredMissionStudentsSelected) {
      const filteredIds = new Set(filteredMissionStudents.map((student) => student.id))
      setSelectedMissionStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)))
      return
    }

    setSelectedMissionStudentIds((prev) => {
      const next = new Set(prev)
      for (const student of filteredMissionStudents) {
        next.add(student.id)
      }
      return Array.from(next)
    })
  }

  const handleSubmitMissionAchievers = async () => {
    if (!achieverTargetMission) {
      return
    }

    if (selectedMissionStudentIds.length === 0) {
      setMissionMessage('달성자를 한 명 이상 선택해 주세요.')
      return
    }

    const currentMission = achieverTargetMission
    const completedStudentIds = [...selectedMissionStudentIds]

    setUpdatingMissionAchievers(true)
    setMissionMessage('')

    try {
      const result = await api.post<MissionAchieverUpdateResult>(
        `/classroom/missions/${currentMission.id}/achievers`,
        {
          student_ids: completedStudentIds,
        },
      )
      setMissionMessage(`달성자 ${result.updated_count}명을 반영했습니다.`)
      setShowMissionAchieverModal(false)
      setAchieverTargetMission(null)
      await refreshTeacherData()
      if (studentDetail && completedStudentIds.includes(studentDetail.student.id)) {
        await loadStudentDetail(studentDetail.student.id)
      }

      const linkedTitle = findLinkedTitleForMission(currentMission)
      if (linkedTitle && completedStudentIds.length > 0 && result.updated_count > 0) {
        await handleOpenIssueModal(linkedTitle, {
          preselectedStudentIds: Array.from(new Set(completedStudentIds)),
          defaultAwardReason: `${currentMission.title} 달성 보상`,
        })
        setMissionMessage(
          `달성자 ${result.updated_count}명을 반영하고 '${linkedTitle.title_name}' 칭호 발급 모달을 자동으로 열었습니다.`,
        )
      }
    } catch {
      setMissionMessage('달성자 반영에 실패했습니다.')
    } finally {
      setUpdatingMissionAchievers(false)
    }
  }

  const handleCreateRaid = async () => {
    await api.post('/classroom/raid/sessions', {
      title: '월간 네오-한양 레이드',
      boss_name: '흑룡 기관장 도윤',
      boss_max_hp: 6000,
      class_max_hp: 3400,
    })
    await refreshTeacherData()
  }


  const uploadQuestionFile = async (file: File) => {
    setUploadMessage('업로드 준비 중...')

    const presign = await api.post<{
      upload_url: string
      object_key: string
      original_filename: string
      public_url: string
      headers: Record<string, string>
    }>('/runtime-uploads/presign', {
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
      category: 'question-bank',
    })

    await fetch(presign.upload_url, {
      method: 'PUT',
      headers: presign.headers,
      body: file,
    })

    const fileRecord = await api.post<{ id: number }>('/classroom/question-files', {
      public_url: presign.public_url,
      object_key: presign.object_key,
      original_filename: presign.original_filename,
      content_type: file.type,
    })

    let rows: ParsedQuestionRow[] = []
    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text()
      rows = parseCsvRows(text)
    } else {
      rows = parseXlsxRows(await file.arrayBuffer())
    }

    const validRows = rows.filter((row) => row.prompt.length > 0)
    await api.post('/classroom/questions/bulk', {
      source_file_id: fileRecord.id,
      rows: validRows,
    })

    setUploadMessage(`${validRows.length}개 문제를 문제 은행에 반영했습니다.`)
    await refreshTeacherData()
  }

  const playClassToolEffectSound = (mode: PickerPopupMode) => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextCtor) {
      return
    }

    const audioContext = drawSoundContextRef.current ?? new AudioContextCtor()
    drawSoundContextRef.current = audioContext

    if (audioContext.state === 'suspended') {
      void audioContext.resume()
    }

    const now = audioContext.currentTime
    const frequencies =
      mode === 'single' ? [520, 700] : mode === 'multi' ? [430, 590, 740] : [390, 470, 560, 680]

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(frequency, now)

      const startTime = now + index * 0.08
      const endTime = startTime + 0.14
      gainNode.gain.setValueAtTime(0.0001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(startTime)
      oscillator.stop(endTime)
    })
  }

  const handleDrawStudents = (drawCount: number) => {
    if (remainingDrawStudents.length === 0) {
      setClassToolMessage('모든 학생을 이미 뽑았습니다. 초기화를 눌러 다시 시작하세요.')
      return
    }

    const count = Math.max(1, Math.min(drawCount, remainingDrawStudents.length))
    const selected = shuffleStudents(remainingDrawStudents).slice(0, count)
    const startOrder = pickedStudentIds.length + 1
    const selectedResults = selected.map((student, index) => ({
      student,
      drawOrder: startOrder + index,
    }))

    setPickedStudentIds((prev) => [...prev, ...selected.map((student) => student.id)])
    setDrawHistory((prev) => [...prev, ...selectedResults])
    setPickerPopup({
      mode: count === 1 ? 'single' : 'multi',
      drawnStudents: selectedResults,
      teamBuckets: [],
      teamCount: null,
    })
    playClassToolEffectSound(count === 1 ? 'single' : 'multi')

    if (count === 1) {
      setClassToolMessage(`학생 한 명을 뽑았습니다: ${selected[0].student_number}번 ${selected[0].name}`)
      return
    }

    setClassToolMessage(`${count}명을 뽑았습니다: ${selected.map((student) => student.name).join(', ')}`)
  }

  const handleResetDraw = () => {
    setPickedStudentIds([])
    setDrawHistory([])
    setPickerPopup(null)
    setTeamBuckets([])
    setLastTeamCount(null)
    setClassToolMessage('뽑기 기록을 초기화했습니다.')
  }

  const handleGiveMiniPraise = async () => {
    if (!latestSingleDraw) {
      return
    }

    setClassToolMessage(`${latestSingleDraw.student.name} 학생에게 경험치 10과 골드 10을 지급했습니다.`)
  }

  const handleSplitTeams = (teamCount: number) => {
    if (classToolStudents.length === 0) {
      setClassToolMessage('팀을 나눌 학생이 없습니다.')
      return
    }

    const buckets: TeamBucket[] = Array.from({ length: teamCount }, (_, index) => ({
      teamNumber: index + 1,
      students: [],
    }))

    shuffleStudents(classToolStudents).forEach((student, index) => {
      buckets[index % teamCount].students.push(student)
    })

    setTeamBuckets(buckets)
    setLastTeamCount(teamCount)
    setPickerPopup({
      mode: 'team',
      drawnStudents: [],
      teamBuckets: buckets,
      teamCount,
    })
    playClassToolEffectSound('team')
    setClassToolMessage(`${teamCount}개 팀으로 랜덤 배정했습니다.`)
  }

  const applyTimerPreset = (presetMinutes?: number, presetSeconds = 0) => {
    const sourceMinutes = presetMinutes ?? Number(timerMinuteInput)
    const sourceSeconds = presetMinutes !== undefined ? presetSeconds : Number(timerSecondInput)

    const safeMinutes = Number.isFinite(sourceMinutes)
      ? Math.max(0, Math.min(180, Math.floor(sourceMinutes)))
      : 0
    const safeSeconds = Number.isFinite(sourceSeconds)
      ? Math.max(0, Math.min(59, Math.floor(sourceSeconds)))
      : 0

    setTimerMinuteInput(String(safeMinutes))
    setTimerSecondInput(String(safeSeconds))
    setRemainingSeconds(safeMinutes * 60 + safeSeconds)
    setIsTimerRunning(false)
  }

  const handleRecordStopwatchLap = () => {
    if (stopwatchCentiseconds <= 0) {
      return
    }

    setNextStopwatchLapId((prevId) => {
      setStopwatchLaps((prevLaps) => [
        {
          id: prevId,
          timestamp: stopwatchCentiseconds,
        },
        ...prevLaps,
      ])
      return prevId + 1
    })
  }

  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false)
    setStopwatchCentiseconds(0)
    setStopwatchLaps([])
    setNextStopwatchLapId(1)
  }

  const handleSpinRoulette = () => {
    if (isRouletteSpinning || classToolStudents.length === 0) {
      return
    }

    if (rouletteSpinTimeoutRef.current !== null) {
      window.clearTimeout(rouletteSpinTimeoutRef.current)
      rouletteSpinTimeoutRef.current = null
    }

    const marbleOrder = shuffleStudents(classToolStudents)
    const winner = marbleOrder[Math.floor(Math.random() * marbleOrder.length)]
    const totalTicks = 26 + Math.floor(Math.random() * 10)

    let tickCount = 0
    let candidateIndex = 0

    setIsRouletteSpinning(true)
    setRouletteWinner(null)
    setRouletteCurrentStudent(marbleOrder[0] ?? null)

    const runTick = () => {
      tickCount += 1
      candidateIndex = (candidateIndex + 1 + Math.floor(Math.random() * 2)) % marbleOrder.length
      setRouletteCurrentStudent(marbleOrder[candidateIndex])

      if (tickCount >= totalTicks) {
        setRouletteCurrentStudent(winner)
        setRouletteWinner(winner)
        setClassToolMessage(`마블 룰렛 결과: ${winner.student_number}번 ${winner.name}`)
        setIsRouletteSpinning(false)
        rouletteSpinTimeoutRef.current = null
        return
      }

      const progress = tickCount / totalTicks
      const nextDelay = 55 + Math.floor(progress * 210)
      rouletteSpinTimeoutRef.current = window.setTimeout(runTick, nextDelay)
    }

    rouletteSpinTimeoutRef.current = window.setTimeout(runTick, 70)
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(64,169,201,0.2),transparent_40%),radial-gradient(circle_at_84%_8%,rgba(189,128,54,0.18),transparent_32%),linear-gradient(180deg,rgba(5,10,18,0.96),rgba(10,20,35,0.98))]" />
        <div className="joseon-grid absolute inset-0 opacity-35" />
        <div className="joseon-noise absolute inset-0 opacity-20" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[#2f4f77] bg-[linear-gradient(90deg,rgba(9,18,30,0.92)_0%,rgba(19,36,58,0.9)_42%,rgba(27,53,84,0.9)_100%)] text-[#e8f1ff] backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={isMobileTabDrawerOpen ? '탭 닫기' : '탭 열기'}
              onClick={() => setIsMobileTabDrawerOpen((prev) => !prev)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#456592] bg-[#173256]/75 transition-colors duration-200 hover:bg-[#214877] lg:hidden"
            >
              {isMobileTabDrawerOpen ? <X className="size-4" /> : <PanelLeftOpen className="size-4" />}
            </button>
            <button
              type="button"
              aria-label="뒤로가기"
              onClick={() => window.history.back()}
              className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#456592] bg-[#173256]/75 transition-colors duration-200 hover:bg-[#214877] lg:flex"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <p className="font-heading text-lg font-semibold tracking-[0.08em] text-[#f0f6ff]">상태창</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8dc2f3]">Arcane Class Quest</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="쪽지함"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#456592] bg-[#173256]/75 transition-colors duration-200 hover:bg-[#214877]"
            >
              <Mail className="size-4" />
            </button>
            <button
              type="button"
              aria-label="알림"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#456592] bg-[#173256]/75 transition-colors duration-200 hover:bg-[#214877]"
            >
              <Bell className="size-4" />
            </button>
            <button
              type="button"
              aria-label="내 정보"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#456592] bg-[#173256]/75 transition-colors duration-200 hover:bg-[#214877]"
            >
              <UserRound className="size-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-[#2b4a71] bg-[#101f35]/95 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs tracking-[0.14em] text-[#8dc2f3]">
              {authUser ? `${roleDisplayLabel} 모드` : '학생 선택 또는 교사 로그인'}
            </p>
            {authUser ? (
              <Button
                variant="ghost"
                className="h-10 cursor-pointer text-[#e7f0ff] hover:bg-[#234670] hover:text-white"
                onClick={async () => {
                  await signOut()
                  setAuthUser(null)
                  setActiveMenu('학생 목록')
                  setIsMobileTabDrawerOpen(false)
                }}
              >
                로그아웃
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="h-10 cursor-pointer border-[#476694] bg-[#18335a] text-[#e7f0ff] hover:bg-[#234670]"
                onClick={() => {
                  setAuthError('')
                }}
              >
                교사 로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {authUser ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsMobileTabDrawerOpen(false)}
            className={`fixed inset-0 z-40 bg-[#050b14]/60 transition-opacity duration-300 lg:hidden ${
              isMobileTabDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[#2e4a6f] bg-[linear-gradient(180deg,rgba(10,22,37,0.98)_0%,rgba(12,26,43,0.98)_45%,rgba(8,18,31,1)_100%)] shadow-[0_24px_44px_rgba(1,8,18,0.72)] transition-transform duration-300 ease-out lg:hidden ${
              isMobileTabDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            aria-label="탭 메뉴"
          >
            <div className="flex h-14 items-center justify-between border-b border-[#264666] px-4">
              <p className="font-heading text-sm font-semibold tracking-[0.08em] text-[#e9f2ff]">탭 메뉴</p>
              <button
                type="button"
                aria-label="탭 닫기"
                onClick={() => setIsMobileTabDrawerOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#48688f] bg-[#132a47] text-[#9ec2ec] transition-colors duration-200 hover:bg-[#1c3b61]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="border-b border-[#264666] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#7f9ec2]">{isStudentSession ? '학생 모드' : '교사 모드'}</p>
              <p className="mt-1 text-xs text-[#9bb4d0]">원하는 탭을 선택해 바로 이동하세요.</p>
            </div>

            <nav className="h-[calc(100%-111px)] overflow-y-auto px-3 py-3">
              {(['학급 운영', '학습 확장', '상점 및 관리'] as const).map((sectionName) => (
                <div key={sectionName} className="mb-3 border-b border-[#223f5f] pb-3 last:mb-0 last:border-none last:pb-0">
                  <p className="px-1 pb-1 text-[10px] font-semibold tracking-[0.1em] text-[#6f8fb4]">{sectionName}</p>
                  <div className="space-y-1">
                    {sidebarItems
                      .filter((item) => item.section === sectionName)
                      .map((item) => {
                        const Icon = item.icon
                        const isActive = activeMenu === item.label

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleSidebarMenuSelect(item.label)}
                            className={`menu-item-motion flex h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left transition-all duration-[220ms] ${
                              isActive
                                ? 'bg-[linear-gradient(90deg,#255189_0%,#2f6ea8_100%)] text-[#eff7ff] shadow-[0_8px_24px_rgba(10,42,80,0.35)]'
                                : 'text-[#aac2dd] hover:bg-[#163558] hover:text-[#e8f2ff]'
                            }`}
                          >
                            <Icon className="size-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-4 lg:gap-6">
            <aside
              className={`relative hidden shrink-0 border border-[#2e4a6f] bg-[linear-gradient(180deg,rgba(10,22,37,0.94)_0%,rgba(12,26,43,0.96)_45%,rgba(8,18,31,0.98)_100%)] shadow-[0_18px_45px_rgba(1,8,18,0.5)] lg:block ${
                isSidebarCollapsed ? 'w-[68px]' : 'w-[170px] xl:w-[190px]'
              }`}
            >
              <button
                type="button"
                aria-label={isSidebarCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="absolute -right-3 top-5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[#48688f] bg-[#132a47] text-[#9ec2ec] shadow-sm transition-colors duration-200 hover:bg-[#1c3b61]"
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
              </button>

              <div className={`border-b border-[#264666] py-3 ${isSidebarCollapsed ? 'px-1.5' : 'px-2.5'}`}>
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#5477a0] bg-[#173257] text-[#95c6f4]">
                    <BookOpen className="size-4" />
                  </div>
                  {!isSidebarCollapsed ? (
                    <div>
                      <p className="font-heading text-[12px] font-semibold tracking-[0.04em] text-[#e9f2ff]">2026 5학년 국화반</p>
                      <p className="text-[10px] text-[#8eaed2]">{overview?.total_students ?? 0}명 학생</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <nav className="px-1.5 py-2">
                {(['학급 운영', '학습 확장', '상점 및 관리'] as const).map((sectionName) => (
                  <div key={sectionName} className="mb-1.5 border-b border-[#223f5f] pb-1.5 last:mb-0 last:border-none last:pb-0">
                    {!isSidebarCollapsed ? (
                      <p className="px-1.5 pb-1 text-[9px] font-semibold tracking-[0.1em] text-[#6f8fb4]">{sectionName}</p>
                    ) : null}
                    <div className="space-y-0.5">
                      {sidebarItems
                        .filter((item) => item.section === sectionName)
                        .map((item) => {
                          const Icon = item.icon
                          const isActive = activeMenu === item.label

                          return (
                            <button
                              key={item.label}
                              type="button"
                              title={item.label}
                              onClick={() => handleSidebarMenuSelect(item.label)}
                              className={`menu-item-motion flex h-8 w-full cursor-pointer items-center transition-all duration-[220ms] ${
                                isSidebarCollapsed ? 'justify-center rounded-md' : 'justify-start gap-1.5 rounded-md px-2'
                              } ${
                                isActive
                                  ? 'translate-x-1 bg-[linear-gradient(90deg,#255189_0%,#2f6ea8_100%)] text-[#eff7ff] shadow-[0_8px_24px_rgba(10,42,80,0.35)]'
                                  : 'text-[#aac2dd] hover:bg-[#163558] hover:text-[#e8f2ff]'
                              }`}
                            >
                              <Icon className="size-3.5" />
                              {!isSidebarCollapsed ? <span className="text-xs font-medium">{item.label}</span> : null}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            <section className="min-w-0 flex-1 border border-[#2b4667] bg-[linear-gradient(180deg,rgba(9,20,35,0.9)_0%,rgba(10,24,40,0.96)_16%,rgba(7,16,29,0.98)_100%)] shadow-[0_18px_45px_rgba(2,8,18,0.55)]">
              <div className="border-b border-[#294564] px-4 py-4 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7f9ec2]">{isStudentSession ? '학생 페이지' : '교사 대시보드'}</p>
                <h1 className="mt-1 font-heading text-2xl font-semibold tracking-[0.06em] text-[#eef5ff]">{isStudentDetailView ? '학생 상세 정보' : activeMenu}</h1>
                <p className="mt-1 text-sm text-[#9ab2cd]">
                  {isStudentDetailView
                    ? '학생의 칭호/이름 편집, 스탯·재화, 활동기록, 아바타, 사진 관리를 한 화면에서 제공합니다.'
                    : activeMenu === '학생 목록'
                      ? '학생 카드 클릭 시 상세정보 전용 화면으로 이동합니다.'
                      : activeMenu === '클래스 툴'
                        ? '랜덤 뽑기, 타이머, 돌림판을 교실 활동 흐름에 맞춰 빠르게 사용할 수 있습니다.'
                        : activeMenu === '던전 탐험'
                          ? '보스 관련 운영은 던전 탐험 메뉴에서 관리합니다.'
                          : '선택한 메뉴에 맞춰 필요한 운영 도구를 제공합니다.'}
                </p>
              </div>

              <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
                {activeMenu === '학생 목록' ? (
                  studentDetail ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#304f72] bg-[#0f223a]/80 px-4 py-3">
                        <button
                          type="button"
                          onClick={handleBackToStudentList}
                          className="flex h-10 items-center gap-2 rounded-lg border border-[#48688f] bg-[#163257] px-3 text-sm font-medium text-[#d7e8ff] transition-colors duration-200 hover:bg-[#21456f]"
                        >
                          <ArrowLeft className="size-4" /> 학생 목록으로
                        </button>
                        <p className="text-sm text-[#9bb4d0]">학생 상세정보 페이지에서 칭호/이름 수정, 활동기록, 아바타, 사진을 관리합니다.</p>
                      </div>

                      <div className="rounded-xl border border-[#3c5c83] bg-[linear-gradient(90deg,#1e3d68_0%,#28578f_56%,#3e739d_100%)] px-4 py-4 text-white sm:px-5">
                        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                          <div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <label className="text-xs text-blue-100">
                                학생 이름
                                <input
                                  className="mt-1 h-11 w-full border border-white/35 bg-white/10 px-3 text-sm text-white placeholder:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                                  value={profileNameDraft}
                                  onChange={(event) => setProfileNameDraft(event.target.value)}
                                  disabled={!canEditBasicProfile}
                                />
                              </label>
                              <label className="text-xs text-blue-100">
                                획득 칭호 선택
                                <select
                                  className="mt-1 h-11 w-full border border-white/35 bg-[#1d4f8f] px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  value={selectedEarnedTitleId ?? ''}
                                  onChange={(event) =>
                                    setSelectedEarnedTitleId(Number(event.target.value) || null)
                                  }
                                  disabled={!canEditBasicProfile}
                                >
                                  <option value="">획득한 칭호 선택</option>
                                  {studentDetail.earned_titles.map((title) => (
                                    <option key={title.id} value={title.title_definition_id}>
                                      {title.title_name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="bg-white/20 px-2 py-1 text-xs">{studentDetail.student.student_number}번</span>
                              <span className="bg-white/20 px-2 py-1 text-xs">Lv.{studentDetail.student.level}</span>
                              <span className="bg-white/20 px-2 py-1 text-xs">{studentDetail.student.character_class}</span>
                              <span className="border border-white/40 bg-white/15 px-2 py-1 text-xs font-semibold">
                                현재 권한: {roleDisplayLabel}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-semibold ${
                                  canManageStudentEconomy
                                    ? 'border border-emerald-200 bg-emerald-500/25 text-emerald-50'
                                    : 'border border-rose-200 bg-rose-500/25 text-rose-50'
                                }`}
                              >
                                {canManageStudentEconomy ? '수정 가능' : '수정 불가'}
                              </span>
                              <Button
                                className="h-10 cursor-pointer border border-white/30 bg-white/20 text-white hover:bg-white/30"
                                onClick={handleSaveStudentProfile}
                                disabled={savingProfile || !canEditBasicProfile}
                              >
                                {savingProfile ? '저장 중...' : '이름 저장'}
                              </Button>
                              <Button
                                className="h-10 cursor-pointer border border-amber-200 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
                                onClick={handleSelectStudentTitle}
                                disabled={savingTitleSelection || !selectedEarnedTitleId || !canEditBasicProfile}
                              >
                                {savingTitleSelection ? '적용 중...' : '선택 칭호 적용'}
                              </Button>
                              {!isStudentSession && canManageStudentEconomy ? (
                                <Button
                                  type="button"
                                  className="h-10 cursor-pointer border border-cyan-200 bg-cyan-500/20 text-cyan-50 hover:bg-cyan-500/30"
                                  onClick={handleOpenAdminEconomyEditor}
                                >
                                  재화/스탯 수정하기
                                </Button>
                              ) : null}
                            </div>
                            <div className="mt-4 border border-white/30 bg-white/10 p-3">
                              <div className="mb-2 flex items-center justify-between text-xs text-blue-100">
                                <span>경험치</span>
                                <span>{studentDetail.economy.current_exp} / {studentDetail.economy.max_exp} EXP · 누적 {studentDetail.economy.total_exp}</span>
                              </div>
                              <div className="h-2 w-full bg-white/25">
                                <div className="h-2 bg-[#93c5fd] transition-all duration-500" style={{ width: `${studentDetailExpRate}%` }} />
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div className="border border-white/25 bg-white/10 px-3 py-[7px]">
                                  <p className="text-xs text-blue-100">원</p>
                                  <p className="font-heading text-2xl font-semibold">{studentDetail.economy.won.toLocaleString('ko-KR')}</p>
                                </div>
                                <div className="border border-white/25 bg-white/10 px-3 py-[7px]">
                                  <p className="text-xs text-blue-100">냥</p>
                                  <p className="font-heading text-2xl font-semibold">{studentDetail.economy.nyang.toLocaleString('ko-KR')}</p>
                                </div>
                                <div className="border border-white/25 bg-white/10 px-3 py-[7px]">
                                  <p className="text-xs text-blue-100">코어</p>
                                  <p className="font-heading text-2xl font-semibold">{studentDetail.economy.core.toLocaleString('ko-KR')}</p>
                                </div>
                                <div className="border border-white/25 bg-white/10 px-3 py-[7px]">
                                  <p className="text-xs text-blue-100">별빛 조각</p>
                                  <p className="font-heading text-2xl font-semibold">{studentDetail.economy.starlight_shard.toLocaleString('ko-KR')}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {studentDetail.stats.map((stat) => {
                              const statLabel = studentStatLabelMap[stat.key] ?? stat.key
                              return (
                                <div key={stat.key} className="border border-white/25 bg-white/10 px-3 py-2">
                                  <p className="text-xs text-blue-100">{statLabel}</p>
                                  <p className="text-2xl font-semibold">{stat.value}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div ref={economyEditorRef} className="border border-[#d8e4f2] bg-[#f7fbff] px-4 py-4 sm:px-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#1e3a8a]">경험치/재화/스탯 수정</p>
                          {!isStudentSession && canManageStudentEconomy ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 cursor-pointer"
                              onClick={handleToggleAdminEconomyEditor}
                            >
                              {showAdminEconomyEditor ? '수정 패널 닫기' : '수정하기'}
                            </Button>
                          ) : null}
                        </div>

                        {canManageStudentEconomy ? (
                          showAdminEconomyEditor ? (
                            <>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {[
                                  { key: 'total_exp', label: '누적 EXP' },
                                  { key: 'won_balance', label: '원' },
                                  { key: 'nyang_balance', label: '냥' },
                                  { key: 'core_balance', label: '코어' },
                                  { key: 'starlight_shard_balance', label: '별빛 조각' },
                                  { key: 'wisdom', label: '지혜' },
                                  { key: 'creativity', label: '창의성' },
                                  { key: 'personality', label: '인성' },
                                  { key: 'vitality', label: '체력' },
                                  { key: 'diligence', label: '성실성' },
                                  { key: 'communication', label: '의사소통' },
                                ].map((field) => (
                                  <label key={field.key} className="text-xs text-slate-600">
                                    {field.label}
                                    <input
                                      type="number"
                                      min={0}
                                      value={adminEconomyDraft[field.key as keyof typeof adminEconomyDraft]}
                                      onChange={(event) =>
                                        setAdminEconomyDraft((prev) => ({
                                          ...prev,
                                          [field.key as keyof typeof adminEconomyDraft]: event.target.value,
                                        }))
                                      }
                                      className="mt-1 h-11 w-full border border-[#c9d9f0] bg-white px-3 text-sm text-slate-900"
                                    />
                                  </label>
                                ))}
                              </div>
                              <Button
                                className="mt-3 h-10 cursor-pointer"
                                onClick={handleSaveStudentEconomyAsAdmin}
                                disabled={savingAdminEconomy}
                              >
                                {savingAdminEconomy ? '저장 중...' : '값 저장'}
                              </Button>
                            </>
                          ) : (
                            <p className="text-sm text-slate-600">수정하기 버튼을 눌러 경험치, 재화, 스탯 수정 폼을 열어주세요.</p>
                          )
                        ) : (
                          <p className="text-sm text-slate-600">현재 권한({roleDisplayLabel})으로는 학생 재화/스탯 수정 권한이 없습니다. 관리자 또는 담당 교사 권한을 확인해 주세요.</p>
                        )}
                      </div>

                      <div className="border border-[#d8e4f2] bg-white">
                        <div className="flex flex-wrap gap-2 border-b border-[#e3edf8] px-4 py-3 sm:px-5">
                          {[
                            { key: 'info', label: '정보' },
                            { key: 'activity', label: '활동 기록' },
                            { key: 'photos', label: '사진' },
                            { key: 'avatar', label: '아바타' },
                          ].map((tab) => (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => setStudentDetailTab(tab.key as 'info' | 'activity' | 'photos' | 'avatar')}
                              className={`h-10 border px-4 text-sm font-medium transition-colors duration-200 ${
                                studentDetailTab === tab.key
                                  ? 'border-[#2563eb] bg-[#eaf2ff] text-[#1d4ed8]'
                                  : 'border-[#d3e1f4] bg-white text-slate-600 hover:bg-[#f7faff]'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {studentDetailTab === 'info' ? (
                          <div className="space-y-3 p-4 sm:p-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="border border-[#dde8f5] bg-[#f7fbff] p-4">
                                <p className="text-xs text-slate-500">현재 칭호</p>
                                <p className="mt-1 font-heading text-xl font-semibold text-slate-900">{studentDetail.student.title || '칭호 없음'}</p>
                              </div>
                              <div className="border border-[#dde8f5] bg-[#f7fbff] p-4">
                                <p className="text-xs text-slate-500">참여 코드</p>
                                <p className="mt-1 font-heading text-xl font-semibold text-slate-900">{studentDetail.student.access_code}</p>
                              </div>
                            </div>

                            <div className="border border-[#dde8f5] bg-[#f7fbff] p-4">
                              <p className="text-sm font-semibold text-[#1e3a8a]">칭호 도감 및 획득 조건</p>
                              <p className="mt-2 text-sm text-slate-600">
                                칭호 관리 기능은 왼쪽 메뉴의 <span className="font-semibold">칭호</span> 탭으로 이동되었습니다.
                                여기서는 학생이 획득한 칭호 중에서 대표 칭호만 선택할 수 있습니다.
                              </p>
                              <p className="mt-2 text-xs text-slate-500">현재 획득 칭호: {studentDetail.earned_titles.length}개</p>
                            </div>
                          </div>
                        ) : null}

                        {studentDetailTab === 'activity' ? (
                          <div className="space-y-3 p-4 sm:p-5">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                              {[
                                { key: 'all', label: '전체', count: activityCounts.all },
                                { key: 'mission', label: '미션', count: activityCounts.mission },
                                { key: 'praise_card', label: '칭찬카드', count: activityCounts.praise_card },
                                { key: 'warning_card', label: '주의카드', count: activityCounts.warning_card },
                                { key: 'title', label: '칭호', count: activityCounts.title },
                                { key: 'raid', label: '레이드기록', count: activityCounts.raid },
                              ].map((tab) => (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() => setActivityFilter(tab.key as ActivityFilterKey)}
                                  className={`h-[42px] cursor-pointer border px-2 text-sm font-semibold transition-colors duration-200 ${
                                    activityFilter === tab.key
                                      ? 'border-[#2563eb] bg-[#eaf2ff] text-[#1d4ed8]'
                                      : 'border-[#d3e1f4] bg-white text-slate-600 hover:bg-[#f7faff]'
                                  }`}
                                >
                                  <span>{tab.label}</span>
                                  <span className="ml-1 text-xs">{tab.count}</span>
                                </button>
                              ))}
                            </div>

                            {filteredActivities.length > 0 ? (
                              filteredActivities.map((activity) => (
                                <div key={activity.id} className="border border-[#dde8f5] bg-[#f7fbff] p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-medium text-slate-900">{activity.title}</p>
                                    <span className="bg-[#eaf2ff] px-2 py-0.5 text-xs font-semibold text-[#1d4ed8]">{activity.category}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-600">{activity.description || '활동 설명 없음'}</p>
                                  <p className="mt-2 text-xs text-slate-500">원 +{activity.reward_won} · 냥 +{activity.reward_nyang} · {new Date(activity.created_at).toLocaleDateString('ko-KR')}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">선택한 분류의 활동 기록이 없습니다.</p>
                            )}
                          </div>
                        ) : null}

                        {studentDetailTab === 'photos' ? (
                          <div className="space-y-3 p-4 sm:p-5">
                            <label className={`flex h-28 flex-col items-center justify-center border border-dashed border-[#bfd3ee] bg-[#f7fbff] text-center transition-colors duration-200 ${
                              canEditBasicProfile ? 'cursor-pointer hover:bg-[#eef6ff]' : 'cursor-not-allowed opacity-60'
                            }`}>
                              <Upload className="mb-2 size-5 text-[#2563eb]" />
                              <span className="text-sm font-medium text-slate-700">학생 사진 업로드</span>
                              <span className="text-xs text-slate-500">업로드 후 상세정보 사진 탭에서 바로 확인할 수 있어요.</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={!canEditBasicProfile}
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file && canEditBasicProfile) {
                                    void handleUploadStudentPhoto(file)
                                  }
                                }}
                              />
                            </label>
                            {photoUploadMessage ? <p className="text-sm text-[#1d4ed8]">{photoUploadMessage}</p> : null}
                            <p className="text-xs text-slate-500">
                              내 컴퓨터 파일을 바로 올리면 안전한 업로드 저장소에 저장되고, 학생 정보에는 사진 경로만 기록됩니다.
                            </p>
                            {!canEditBasicProfile ? (
                              <p className="text-sm text-slate-500">다른 학생의 사진은 열람만 가능하며 업로드는 본인 계정에서만 가능합니다.</p>
                            ) : null}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {studentDetail.photos.map((photo) => (
                                <div key={photo.id} className="border border-[#dde8f5] bg-[#f7fbff] p-2">
                                  <img src={photo.public_url} alt={photo.original_filename} className="h-36 w-full object-cover" />
                                  <p className="mt-2 truncate text-xs text-slate-600">{photo.original_filename}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {studentDetailTab === 'avatar' ? (
                          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
                            {studentDetail.avatars.map((avatar) => (
                              <div
                                key={avatar.id}
                                className={`border p-3 ${
                                  avatar.is_equipped
                                    ? 'border-[#2563eb] bg-[#eaf2ff]'
                                    : 'border-[#dde8f5] bg-[#f7fbff]'
                                }`}
                              >
                                <div className="h-32 w-full border border-[#d3e1f4] bg-white">
                                  {avatar.image_url ? (
                                    <img src={avatar.image_url} alt={avatar.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400">이미지 없음</div>
                                  )}
                                </div>
                                <p className="mt-2 font-medium text-slate-900">{avatar.name}</p>
                                <p className="text-xs text-slate-500">{avatar.slot} · {avatar.rarity}</p>
                                <p className="mt-1 text-xs text-slate-500">보너스: 성실 +{avatar.bonus_diligence} / 지력 +{avatar.bonus_intellect}</p>
                                <Button
                                  className="mt-2 h-10 w-full cursor-pointer"
                                  variant={avatar.is_equipped ? 'secondary' : 'default'}
                                  onClick={() => void handleEquipAvatar(avatar.id)}
                                  disabled={avatar.is_equipped || !canEditBasicProfile}
                                >
                                  {avatar.is_equipped ? '장착중' : '장착하기'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {studentDetailError ? (
                        <div className="border border-[#f4c8cd] bg-[#fff4f5] px-4 py-3 text-sm text-[#b42338]">{studentDetailError}</div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="border border-[#cddff3] bg-[#edf4fd] px-4 py-3">
                        <p className="flex items-center gap-2 text-sm font-medium text-[#1e3a8a]"><Bell className="size-4" /> 선생님이 전합니다</p>
                        <p className="mt-1 font-heading text-xl font-semibold text-[#0f172a]">학생을 클릭하면 상세정보 페이지로 이동해요.</p>
                      </div>

                      <div className="border border-[#d8e4f2] bg-white">
                        <div className="border-b border-[#dce8f6] bg-[#f1f6fd] px-4 py-4 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h2 className="font-heading text-2xl font-semibold text-slate-900">학생 목록</h2>
                              <p className="text-sm text-slate-600">현재 {students.length}/{overview?.total_students ?? students.length}명 학생 사용 중 · 5x5 배치 스타일</p>
                              {studentLoginMessage ? <p className="mt-1 text-xs text-[#1d4f8a]">{studentLoginMessage}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant={sortBy === 'student_number' ? 'default' : 'outline'}
                                className="h-10 cursor-pointer"
                                onClick={() => setSortBy('student_number')}
                              >
                                번호순
                              </Button>
                              <Button
                                variant={sortBy === 'level' ? 'default' : 'outline'}
                                className="h-10 cursor-pointer"
                                onClick={() => setSortBy('level')}
                              >
                                레벨순
                              </Button>
                              {canManageClassContent ? (
                                <Button
                                  className="h-10 cursor-pointer"
                                  onClick={() => void handleCreateStudentLoginAccount()}
                                  disabled={studentLoginLoading}
                                >
                                  + 학생 추가
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-[#e3edf8] bg-[#f8fbff] px-4 py-4 sm:px-5">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {studentGridSlots.map((student, index) => {
                              if (!student) {
                                return (
                                  <div
                                    key={`empty-${index}`}
                                    aria-hidden="true"
                                    className="h-28 border border-dashed border-[#d9e6f6] bg-[#f8fbff]"
                                  />
                                )
                              }

                              const colorBand = ['#e8f1ff', '#eef7ff', '#f1f8ff', '#eaf4ff', '#edf3ff'][index % 5]

                              const canOpenDetail = true

                              return (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => {
                                    if (canOpenDetail) {
                                      void handleOpenStudentDetail(student.id)
                                    }
                                  }}
                                  disabled={!canOpenDetail}
                                  className={`panel-card-hover group h-28 w-full border border-[#d5e3f3] text-left transition-all duration-[220ms] ${
                                    canOpenDetail
                                      ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-[inset_0_0_0_1px_#2563eb,0_12px_20px_rgba(30,64,120,0.14)]'
                                      : 'cursor-not-allowed opacity-55'
                                  }`}
                                  style={{ backgroundColor: colorBand }}
                                >
                                  <div className="flex h-full flex-col justify-between px-3 py-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="bg-white/80 px-1.5 py-0.5 text-[11px] text-slate-600">{student.student_number}번</span>
                                      <span className="bg-[#275daf] px-1.5 py-0.5 text-[11px] font-semibold text-white">Lv.{student.level}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-[11px] font-semibold text-[#0f3b7a]">{student.title || '칭호 없음'}</p>
                                      <p className="truncate font-heading text-base font-semibold text-slate-900">{student.name}</p>
                                      <p className="truncate text-[11px] text-slate-600">{student.character_class}</p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )
                ) : null}

              {activeMenu === '미션' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#c7d9ef] bg-[linear-gradient(120deg,rgba(242,248,255,0.96),rgba(228,239,252,0.92))] p-3.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-xl font-semibold text-[#12345c]">미션 탭</h3>
                        <p className="text-sm text-[#4a678a]">미션 수행도 확인, 달성자 추가, 수정/종료를 한 화면에서 관리합니다.</p>
                      </div>
                      {canManageClassContent ? (
                        <Button className="h-11 cursor-pointer transition-all duration-[220ms] hover:-translate-y-0.5" onClick={openCreateMissionModal}>
                          + 미션 만들기
                        </Button>
                      ) : null}
                    </div>
                    {missionMessage ? <p className="mt-2 text-sm text-[#1d4f8a]">{missionMessage}</p> : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {missions.map((mission) => {
                      const matchedIcon = missionIconPresets.find((item) => item.key === mission.icon_key)
                      const MissionIcon = matchedIcon?.icon ?? ScrollText
                      const completionLabel = `${mission.achiever_count}/${Math.max(1, students.length)}명 달성`

                      return (
                        <div
                          key={mission.id}
                          className={`group rounded-2xl border bg-white/95 p-3.5 shadow-sm transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,46,84,0.14)] ${
                            mission.is_active ? 'border-[#d4e1f1]' : 'border-[#e5eaf3] opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r text-white ${matchedIcon?.className ?? 'from-[#2f6ea8] to-[#1d3f63]'}`}>
                                <MissionIcon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-heading text-lg font-semibold text-[#123458]">{mission.title}</p>
                                <p className="truncate text-xs text-[#5c7594]">{mission.target_stat_label} 성장 · EXP {mission.reward_exp} · 원 {mission.reward_won}</p>
                                <p className="mt-1 text-xs text-[#6a7f98]">{mission.description || '설명 없음'}</p>
                              </div>
                            </div>
                            {!mission.is_active ? <span className="rounded-full border border-[#d6deea] bg-[#eef3f8] px-2 py-0.5 text-[11px] text-[#6c7c8f]">종료</span> : null}
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-[#607895]">
                              <span>수행도</span>
                              <span>{completionLabel} · {mission.progress_percent.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e4edf8]">
                              <div
                                className="h-full bg-[linear-gradient(90deg,#1f4f87_0%,#5f8ec8_100%)] transition-all duration-[220ms]"
                                style={{ width: `${Math.max(0, Math.min(100, mission.progress_percent))}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#6c8099]">
                            <span className="rounded-full bg-[#edf4fc] px-2 py-0.5">달성자 {mission.achiever_count}명</span>
                            <span className="rounded-full bg-[#edf4fc] px-2 py-0.5">반복 {mission.repeatable ? 'ON' : 'OFF'}</span>
                            <span className="rounded-full bg-[#edf4fc] px-2 py-0.5">주간 초기화 {mission.weekly_reset ? 'ON' : 'OFF'}</span>
                          </div>

                          <div className="mt-3 grid max-h-28 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[#e4ebf5] bg-[#f8fbff] p-2 text-xs text-[#4d6585]">
                            {mission.achievers.length > 0 ? (
                              mission.achievers.slice(0, 5).map((achiever) => (
                                <div key={`${mission.id}-${achiever.student_id}`} className="flex items-center justify-between">
                                  <span>{achiever.student_number}번 {achiever.student_name}</span>
                                  <span>
                                    총 {achiever.completion_count}회
                                    {mission.weekly_reset ? ` · 이번 주 ${achiever.weekly_completion_count}회` : ''}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p>아직 달성자가 없습니다.</p>
                            )}
                          </div>

                          {canManageClassContent ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 opacity-0 transition-opacity duration-[200ms] group-hover:opacity-100">
                              <Button
                                className="h-10 cursor-pointer bg-[#244f85] text-white hover:bg-[#1f446f]"
                                onClick={() => handleOpenMissionAchieverModal(mission)}
                                disabled={!mission.is_active}
                              >
                                달성자 추가
                              </Button>
                              <Button
                                variant="outline"
                                className="h-10 cursor-pointer border-[#c8d7ea] bg-white text-[#21446f] hover:bg-[#eef5ff]"
                                onClick={() => openEditMissionModal(mission)}
                              >
                                수정
                              </Button>
                              <Button
                                variant="outline"
                                className="h-10 cursor-pointer border-[#e1cad1] bg-white text-[#a43b4f] hover:bg-[#fff4f6]"
                                onClick={() => void handleCloseMission(mission)}
                                disabled={!mission.is_active}
                              >
                                종료
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {activeMenu === '칭찬/주의 카드' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#cedcf1] bg-[#f7fbff] p-3.5 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#dce7f5] pb-3">
                      {cardTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveCardTab(tab.key)}
                          className={`h-10 cursor-pointer rounded-xl border px-4 text-sm font-semibold transition-all duration-[220ms] ${
                            activeCardTab === tab.key
                              ? tab.key === 'praise'
                                ? 'border-[#f5b9d7] bg-[#ffeaf4] text-[#db2f85]'
                                : 'border-[#b7cbef] bg-[#e8f2ff] text-[#2f60bf]'
                              : 'border-[#d8e2f0] bg-white text-[#617993] hover:bg-[#f5f9ff]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-[#1f3e63]">
                          {activeCardTab === 'praise' ? '칭찬카드' : '주의카드'}
                        </h3>
                        <p className="text-sm text-[#627d9a]">
                          {activeCardTab === 'praise'
                            ? '지속적인 태도/행동에 대한 특별한 보상을 발급합니다.'
                            : '부적절한 행동에 대해 공정한 패널티를 기록합니다.'}
                        </p>
                      </div>
                      {canManageClassContent ? (
                        <Button
                          className="h-11 cursor-pointer transition-all duration-[220ms] hover:-translate-y-0.5"
                          onClick={() => openCreateCardModal(activeCardTab)}
                        >
                          + 새 {activeCardTab === 'praise' ? '칭찬카드' : '주의카드'}
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
                      <div className={`rounded-xl border px-3.5 py-2.5 ${activeCardTab === 'praise' ? 'border-[#f4bfd8] bg-[#ffeef6]' : 'border-[#bdd0f2] bg-[#edf4ff]'}`}>
                        <p className="text-sm font-semibold text-[#1e3f64]">{activeCardTab === 'praise' ? '칭찬 보상' : '패널티'}</p>
                        <p className="text-xs text-[#6983a0]">카드별 보상/감소 수치를 직관적으로 확인합니다.</p>
                      </div>
                      <div className="rounded-xl border border-[#cbdcf2] bg-[#eef4ff] px-3.5 py-2.5">
                        <p className="text-sm font-semibold text-[#1e3f64]">성장 기록</p>
                        <p className="text-xs text-[#6983a0]">발급 기록을 통해 학생 행동 변화를 추적합니다.</p>
                      </div>
                      <div className="rounded-xl border border-[#cbdcf2] bg-[#eef4ff] px-3.5 py-2.5">
                        <p className="text-sm font-semibold text-[#1e3f64]">동기 부여</p>
                        <p className="text-xs text-[#6983a0]">긍정/주의 피드백을 즉시 제공해 행동을 강화합니다.</p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-[#dce7f5] pt-3">
                      <p className="text-xs text-[#6c829b]">
                        카테고리 구분 없이 {activeCardTab === 'praise' ? '칭찬카드' : '주의카드'} 전체를 보여줍니다.
                      </p>
                    </div>
                  </div>

                  {cardMessage ? <p className="text-sm text-[#2b5f99]">{cardMessage}</p> : null}

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {cardsByActiveTab.map((card) => {
                      const iconPreset = cardIconPresetsByType[card.card_type].find((item) => item.key === card.icon_key)
                      const CardIcon = iconPreset?.icon ?? (card.card_type === 'praise' ? Heart : TriangleAlert)
                      return (
                        <div
                          key={card.id}
                          className={`group rounded-2xl border bg-white/95 p-3.5 shadow-sm transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,46,84,0.14)] ${
                            card.is_active ? 'border-[#d4e1f1]' : 'border-[#e5eaf3] opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r text-white ${iconPreset?.className ?? 'from-[#2f6ea8] to-[#1d3f63]'}`}>
                                <CardIcon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-heading text-lg font-semibold text-[#123458]">{card.title}</p>
                                <p className="truncate text-xs text-[#5c7594]">{card.description || '설명 없음'}</p>
                              </div>
                            </div>
                            
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-[#d8e4f3] bg-[#f8fbff] px-2 py-[7px] text-center text-[#456792]"><BookOpen className="mx-auto mb-0.5 size-3.5" /> EXP {card.card_type === 'warning' ? '-' : '+'}{card.reward_exp}</div>
                            <div className="rounded-lg border border-[#d8e4f3] bg-[#f8fbff] px-2 py-[7px] text-center text-[#456792]"><Coins className="mx-auto mb-0.5 size-3.5" /> 원 {card.card_type === 'warning' ? '-' : '+'}{card.reward_won}</div>
                            <div className="rounded-lg border border-[#d8e4f3] bg-[#f8fbff] px-2 py-[7px] text-center text-[#456792]"><Sparkles className="mx-auto mb-0.5 size-3.5" /> 냥 {card.card_type === 'warning' ? '-' : '+'}{card.reward_nyang}</div>
                            <div className="rounded-lg border border-[#d8e4f3] bg-[#f8fbff] px-2 py-[7px] text-center text-[#456792]"><Zap className="mx-auto mb-0.5 size-3.5" /> 레벨 {card.card_type === 'warning' ? '-' : '+'}{card.level_delta}</div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {card.stat_changes.map((stat) => (
                              <span
                                key={`${card.id}-${stat.stat_key}`}
                                className={`rounded-full px-2 py-0.5 text-[11px] ${
                                  card.card_type === 'praise'
                                    ? 'bg-[#ffe9f2] text-[#cf3d7f]'
                                    : 'bg-[#e9f1ff] text-[#2f63bf]'
                                }`}
                              >
                                {stat.stat_label} {card.card_type === 'warning' ? '-' : '+'}{stat.delta}
                              </span>
                            ))}
                          </div>

                          {canManageClassContent ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleOpenCardIssueModal(card)}
                                className={`mt-3 h-10 w-full cursor-pointer rounded-xl text-sm font-semibold text-white transition-all duration-[220ms] ${
                                  card.card_type === 'praise'
                                    ? 'bg-[linear-gradient(90deg,#ff3f98_0%,#ed2f88_100%)] hover:brightness-110'
                                    : 'bg-[linear-gradient(90deg,#376ddb_0%,#4d56db_100%)] hover:brightness-110'
                                }`}
                              >
                                발급 및 상세정보
                              </button>

                              <div className="mt-3 flex flex-wrap items-center gap-2 opacity-0 transition-opacity duration-[200ms] group-hover:opacity-100">
                                <Button
                                  className="h-10 cursor-pointer bg-[#244f85] text-white hover:bg-[#1f446f]"
                                  onClick={() => void handleOpenCardIssueModal(card)}
                                  disabled={!card.is_active}
                                >
                                  발급
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-10 cursor-pointer border-[#c8d7ea] bg-white text-[#21446f] hover:bg-[#eef5ff]"
                                  onClick={() => openEditCardModal(card)}
                                >
                                  수정
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-10 cursor-pointer border-[#e1cad1] bg-white text-[#a43b4f] hover:bg-[#fff4f6]"
                                  onClick={() => void handleCloseCard(card)}
                                  disabled={!card.is_active}
                                >
                                  종료
                                </Button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {activeMenu === '문제 던전' ? (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold"><FileSpreadsheet className="size-4" /> 문제 은행 업로드 (CSV/XLSX)</h3>
                  <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 p-4 text-center transition-colors duration-200 hover:bg-secondary/50">
                    <Upload className="mb-2 size-5 text-primary" />
                    <span className="text-sm font-medium">파일을 선택하거나 드래그해서 업로드하세요</span>
                    <span className="text-xs text-muted-foreground">권장 컬럼: subject, unit_name, prompt, answer, difficulty, bonus_attack</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          void uploadQuestionFile(file)
                        }
                      }}
                    />
                  </label>
                  {uploadMessage ? <p className="mt-2 text-sm text-primary">{uploadMessage}</p> : null}
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {questions.slice(0, 6).map((question) => (
                      <div key={question.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                        <p className="font-medium">[{question.subject}] {question.prompt}</p>
                        <p className="text-xs text-muted-foreground">정답: {question.answer} · 공격 보너스 +{question.bonus_attack}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeMenu === '던전 탐험' ? (
                <div className="rounded-2xl border border-border bg-[#1E293B] p-5 text-slate-100 shadow-lg">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><Sword className="size-4" /> 던전 탐험 (Host)</h3>
                    {!raid ? (
                      <Button className="cursor-pointer bg-[#2563EB] text-white hover:bg-[#1d4ed8]" onClick={handleCreateRaid}>탐험 시작</Button>
                    ) : null}
                  </div>
                  {raid ? (
                    <>
                      <p className="mb-2 text-sm">보스: {raid.boss_name}</p>
                      <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${100 - raidBossRate}%` }} />
                      </div>
                      <p className="mb-2 text-sm">학급 HP</p>
                      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${classHpRate}%` }} />
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">실시간 탐험 로그</p>
                        <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
                          {raidLogs.slice(0, 8).map((log) => (
                            <p key={log.id}>{log.message}</p>
                          ))}
                          <div className="flex items-center gap-1 text-slate-400">
                            <span className="dot-pulse" />
                            <span className="dot-pulse" />
                            <span className="dot-pulse" />
                            <span className="ml-1 text-xs">전투 서사 갱신 중...</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-300">진행 중인 탐험이 없습니다. 탐험 시작 버튼으로 보스전을 생성하세요.</p>
                  )}
                </div>
              ) : null}

              {activeMenu === '칭호' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#cedcf1] bg-[linear-gradient(120deg,rgba(245,249,255,0.97),rgba(231,239,252,0.92))] p-3.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-xl font-semibold text-[#12345c]">칭호 관리</h3>
                        <p className="text-sm text-[#4a678a]">칭호 탭을 자동 달성 / 수동 달성으로 분리해 조건 기반 지급과 직접 발급을 함께 운영합니다.</p>
                      </div>
                      {canManageClassContent ? (
                        <Button className="h-11 cursor-pointer transition-all duration-[220ms] hover:-translate-y-0.5" onClick={openCreateTitleModal}>
                          + 새 칭호 만들기
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#dce7f5] pt-3">
                      <button
                        type="button"
                        onClick={() => setTitleFilterMode('manual')}
                        className={`h-10 cursor-pointer rounded-xl border px-4 text-sm font-semibold transition-all duration-[220ms] ${
                          titleFilterMode === 'manual'
                            ? 'border-[#f5b9d7] bg-[#ffeaf4] text-[#db2f85]'
                            : 'border-[#d8e2f0] bg-white text-[#617993] hover:bg-[#f5f9ff]'
                        }`}
                      >
                        수동 달성
                      </button>
                      <button
                        type="button"
                        onClick={() => setTitleFilterMode('auto')}
                        className={`h-10 cursor-pointer rounded-xl border px-4 text-sm font-semibold transition-all duration-[220ms] ${
                          titleFilterMode === 'auto'
                            ? 'border-[#b7cbef] bg-[#e8f2ff] text-[#2f60bf]'
                            : 'border-[#d8e2f0] bg-white text-[#617993] hover:bg-[#f5f9ff]'
                        }`}
                      >
                        자동 달성
                      </button>
                      <p className="text-xs text-[#6d84a0]">
                        현재 보기: {titleFilterMode === 'manual' ? '교사가 직접 발급하는 칭호' : '조건 충족 시 자동 지급되는 칭호'}
                      </p>
                    </div>
                  </div>

                  {titleTabError ? (
                    <div className="rounded-xl border border-[#934b58] bg-[#3a1e28]/90 px-4 py-3 text-sm text-[#ffd4da]">{titleTabError}</div>
                  ) : null}
                  {titleTabMessage ? (
                    <div className="rounded-xl border border-[#3f7a66] bg-[#15362d]/90 px-4 py-3 text-sm text-[#cbf4df]">{titleTabMessage}</div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClassTitles.map((title) => {
                      const matchedPreset = titleIconPresets.find((preset) => preset.key === title.icon_key)
                      const IconComponent = matchedPreset?.icon ?? Medal
                      const frameClass =
                        titleFramePresets.find((frame) => frame.key === title.frame_key)?.className ??
                        'ring-2 ring-slate-300/80'
                      const isCelebrating = celebratingTitleIds.includes(title.id)
                      const rewardConfig = getTitleRewardConfig(title.id)

                      return (
                        <div
                          key={title.id}
                          className={`group relative overflow-hidden rounded-2xl border border-[#d4e1f1] bg-white/95 p-3.5 shadow-sm transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,46,84,0.14)] ${
                            isCelebrating ? 'ring-2 ring-[#ffc35c] shadow-[0_0_0_1px_rgba(252,211,118,0.65),0_18px_32px_rgba(250,183,35,0.32)]' : ''
                          }`}
                        >
                          <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,230,155,0.7),transparent_42%),radial-gradient(circle_at_82%_88%,rgba(148,197,255,0.42),transparent_45%)] transition-opacity duration-300 ${
                              isCelebrating ? 'opacity-100 animate-pulse' : 'opacity-0'
                            }`}
                          />

                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className={`inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-full bg-gradient-to-r px-3.5 text-sm font-semibold text-white ${matchedPreset?.className ?? 'from-blue-600 to-indigo-500'} ${frameClass}`}>
                              {title.icon_public_url ? (
                                <img src={title.icon_public_url} alt={title.title_name} className="h-5 w-5 rounded object-cover" />
                              ) : (
                                <IconComponent className="size-4" />
                              )}
                              <span className="truncate">{title.title_name}</span>
                            </div>
                            {!title.is_active ? <span className="rounded-full border border-[#f0c7cf] bg-[#fff3f5] px-2 py-0.5 text-xs text-rose-500">비활성</span> : null}
                          </div>

                          <div
                            className={`pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[#ffd680] bg-[#fff3cd] px-2 py-1 text-[11px] font-semibold text-[#8a5200] shadow transition-all duration-300 ${
                              isCelebrating ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-90 opacity-0'
                            }`}
                          >
                            <Medal className="size-3" /> 신규 배지
                          </div>

                          {isCelebrating ? (
                            <>
                              <Sparkles className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-[#f59e0b] animate-ping" />
                              <Sparkles className="pointer-events-none absolute bottom-3 right-3 size-3.5 text-[#60a5fa] animate-bounce" />
                            </>
                          ) : null}

                          <p className="text-sm font-semibold text-[#123458]">{title.title_name}</p>
                          <p className="mt-1 text-xs text-[#5c7594]">조건: {title.condition_text}</p>
                          <p className="mt-1 text-[11px] text-[#4d6788]">
                            {title.achievement_mode === 'auto'
                              ? title.auto_condition_type === 'card_issue_count'
                                ? `자동 조건: 카드 #${title.condition_card_id ?? '-'} ${title.condition_target_count ?? '-'}회 발급`
                                : `자동 조건: ${studentStatLabelMap[title.condition_stat_key ?? ''] ?? title.condition_stat_key ?? '스탯'} ${title.condition_target_count ?? '-'} 이상`
                              : '수동 조건: 교사가 직접 발급'}
                          </p>
                          <p className="mt-1 min-h-[32px] text-xs text-[#6a7f98]">{title.description || '설명 없음'}</p>

                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg border border-[#d8e4f3] bg-[#f8fbff] px-2 py-[7px] text-center text-[#456792]">
                              <Trophy className="mx-auto mb-0.5 size-3.5" /> 수상자 {title.recipient_count}
                            </div>
                            <div className="rounded-lg border border-[#f4d5de] bg-[#fff5f8] px-2 py-[7px] text-center text-[#b23c63]">
                              <BookOpen className="mx-auto mb-0.5 size-3.5" /> 미션 EXP +{rewardConfig.reward_exp}
                            </div>
                            <div className="rounded-lg border border-[#d3e1f4] bg-[#eff5ff] px-2 py-[7px] text-center text-[#315f98]">
                              <Coins className="mx-auto mb-0.5 size-3.5" /> 미션 원 +{rewardConfig.reward_won}
                            </div>
                          </div>

                          {canManageClassContent ? (
                            <div className="mt-3 flex items-center gap-2">
                              {title.achievement_mode === 'manual' ? (
                                <Button className="h-10 flex-1 cursor-pointer bg-[#244f85] text-white hover:bg-[#1f446f]" onClick={() => void handleOpenIssueModal(title)}>
                                  <Gift className="mr-1 size-4" /> 발급
                                </Button>
                              ) : (
                                <div className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#c8d7ea] bg-[#eef5ff] text-xs font-semibold text-[#315f98]">
                                  자동 조건 충족 시 지급
                                </div>
                              )}
                              <Button variant="outline" className="h-10 cursor-pointer border-[#c8d7ea] bg-white text-[#21446f] hover:bg-[#eef5ff]" onClick={() => openTitlePreviewModal(title)}>
                                <Sparkles className="size-4" />
                              </Button>
                              <Button variant="outline" className="h-10 cursor-pointer border-[#c8d7ea] bg-white text-[#21446f] hover:bg-[#eef5ff]" onClick={() => openEditTitleModal(title)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="outline" className="h-10 cursor-pointer border-[#e1cad1] bg-white text-[#a43b4f] hover:bg-[#fff4f6]" onClick={() => void handleDeleteTitle(title)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                    {filteredClassTitles.length === 0 ? (
                      <div className="col-span-full rounded-xl border border-dashed border-[#c8d7ea] bg-[#f7fbff] px-4 py-8 text-center text-sm text-[#6c829b]">
                        {titleFilterMode === 'manual'
                          ? '아직 수동 달성 칭호가 없습니다. 새 칭호를 만들어 직접 발급해 보세요.'
                          : '아직 자동 달성 칭호가 없습니다. 자동 조건을 설정해 생성해 보세요.'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeMenu === '학생 로그인' && canManageClassContent ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#cddff3] bg-[#edf4fd] px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-slate-900">학생 로그인 계정</h3>
                        <p className="text-sm text-slate-600">번호 · 닉네임 · PIN을 확인하고 학생 추가, PIN 복원, 학생 삭제를 관리할 수 있습니다.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="h-11 cursor-pointer"
                          onClick={() => void handleCreateStudentLoginAccount()}
                          disabled={studentLoginLoading}
                        >
                          + 학생 추가
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        className="h-11 w-full rounded-xl border border-[#c9d9f0] bg-white px-3 text-sm text-slate-900"
                        value={studentLoginNickname}
                        onChange={(event) => setStudentLoginNickname(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void handleCreateStudentLoginAccount()
                          }
                        }}
                        placeholder="추가할 학생 닉네임 (비워두면 자동 생성)"
                      />
                    </div>
                    {studentLoginMessage ? <p className="mt-2 text-sm text-[#1d4f8a]">{studentLoginMessage}</p> : null}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#d8e4f2] bg-white">
                    <div className="grid grid-cols-[92px_minmax(0,1fr)_92px_minmax(0,1fr)] border-b border-[#e3edf8] bg-[#f1f6fd] px-4 py-3 text-xs font-semibold text-[#30527a] sm:grid-cols-[120px_minmax(0,1fr)_140px_220px]">
                      <p>번호</p>
                      <p>닉네임</p>
                      <p>PIN</p>
                      <p className="text-right">관리</p>
                    </div>
                    <div className="max-h-[520px] overflow-y-auto">
                      {studentLoginAccounts.map((account) => {
                        const isDeleting = studentLoginActionType === 'delete' && studentLoginActionStudentId === account.id
                        const isResettingPin = studentLoginActionType === 'reset-pin' && studentLoginActionStudentId === account.id

                        return (
                          <div
                            key={account.id}
                            className="grid grid-cols-[92px_minmax(0,1fr)_92px_minmax(0,1fr)] items-center gap-2 border-b border-[#eef3fa] px-4 py-3 text-sm text-slate-700 sm:grid-cols-[120px_minmax(0,1fr)_140px_220px]"
                          >
                            <p className="font-semibold text-[#1d3f65]">{account.student_number}번</p>
                            <p className="truncate">{account.nickname}</p>
                            <p className="font-mono tracking-[0.08em] text-[#264a78]">{account.pin_code}</p>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                className="h-9 cursor-pointer border-[#c8d7ea] bg-white px-3 text-xs text-[#21446f] hover:bg-[#eef5ff]"
                                onClick={() => void handleResetStudentPinToDefault(account)}
                                disabled={studentLoginLoading || isDeleting || isResettingPin}
                              >
                                {isResettingPin ? 'PIN 복원 중...' : '원래 PIN 복원'}
                              </Button>
                              <Button
                                variant="outline"
                                className="h-9 cursor-pointer border-[#e1cad1] bg-white px-3 text-xs text-[#a43b4f] hover:bg-[#fff4f6]"
                                onClick={() => void handleDeleteStudentLoginAccount(account)}
                                disabled={studentLoginLoading || isDeleting || isResettingPin}
                              >
                                {isDeleting ? '삭제 중...' : '학생 삭제'}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                      {studentLoginAccounts.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-500">등록된 학생 로그인 계정이 없습니다.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeMenu === '학급 활동 상점' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#cddff3] bg-[#edf4fd] px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-slate-900">학급 활동 상점</h3>
                        <p className="text-sm text-slate-600">쿠폰 상점 · 쿠폰 기록 · 펀딩 프로젝트를 한 탭에서 관리합니다.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedStudentForActivityShop ?? ''}
                          onChange={(event) => setSelectedStudentForActivityShop(Number(event.target.value) || null)}
                          className="h-11 min-w-[170px] rounded-xl border border-[#c9d9f0] bg-white px-3 text-sm text-slate-900"
                        >
                          {activityShopSelectableStudents.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.student_number}번 {student.name}
                            </option>
                          ))}
                        </select>
                        <div className="rounded-xl border border-[#c9d9ef] bg-white px-3 py-2 text-sm font-semibold text-[#1e3a8a]">
                          보유 원 {(selectedActivityStudent?.won_balance ?? 0).toLocaleString()}원
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        { key: 'coupon-store', label: '쿠폰 상점' },
                        { key: 'coupon-record', label: '쿠폰 기록' },
                        { key: 'funding', label: '펀딩 프로젝트 관리' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActivityShopTab(tab.key as ActivityShopTab)}
                          className={`h-11 cursor-pointer rounded-xl border text-sm font-semibold transition-colors duration-200 ${
                            activityShopTab === tab.key
                              ? 'border-[#8f5dff] bg-[#f4ecff] text-[#6d28d9]'
                              : 'border-[#d9e5f4] bg-white text-[#415b7a] hover:bg-[#f6f9ff]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activityShopMessage ? <p className="mt-3 text-sm font-medium text-[#1e4d86]">{activityShopMessage}</p> : null}
                  </div>

                  {activityShopTab === 'coupon-store' ? (
                    <div className="space-y-4">
                      {canManageClassContent ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleOpenCreateCoupon}
                            className="h-11 cursor-pointer rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                          >
                            만들기
                          </button>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {activityCoupons.map((coupon) => (
                          <div key={coupon.id} className="rounded-2xl border border-[#d8e4f2] bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-2xl" aria-hidden="true">{coupon.icon_emoji}</p>
                                <h5 className="mt-1 text-lg font-semibold text-[#153a63]">{coupon.name}</h5>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-[#d97706]">{coupon.price_gold.toLocaleString()}</p>
                                <p className="text-xs font-semibold text-[#d97706]">원</p>
                              </div>
                            </div>
                            <p className="mt-2 min-h-[40px] text-sm text-[#5c7594]">{coupon.description || '설명이 등록되지 않았습니다.'}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-[#456792]">
                              <span className={`rounded-full px-2 py-1 ${coupon.is_active ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#b91c1c]'}`}>{coupon.is_active ? '판매중' : '판매 종료'}</span>
                              <span>재고 {coupon.stock}개</span>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <input
                                className="h-10 w-20 rounded-lg border border-[#c9d9f0] px-3 text-sm"
                                value={couponPurchaseDrafts[coupon.id] ?? '1'}
                                onChange={(event) =>
                                  setCouponPurchaseDrafts((prev) => ({
                                    ...prev,
                                    [coupon.id]: event.target.value,
                                  }))
                                }
                                placeholder="수량"
                              />
                              <button
                                type="button"
                                disabled={activityShopLoading || !coupon.is_active || coupon.stock <= 0}
                                onClick={() => void handlePurchaseCoupon(coupon)}
                                className="h-10 flex-1 cursor-pointer rounded-lg bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                구매하기
                              </button>
                              <button
                                type="button"
                                onClick={() => setCouponHistoryCouponId(coupon.id)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d4e2f3] bg-[#f8fbff] text-[#355a86] hover:bg-[#eef5ff]"
                                aria-label="쿠폰 기록 보기"
                              >
                                <Eye className="size-4" />
                              </button>
                              {canManageClassContent ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCoupon(coupon)}
                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d4e2f3] bg-[#f8fbff] text-[#355a86] hover:bg-[#eef5ff]"
                                    aria-label="쿠폰 수정"
                                  >
                                    <Pencil className="size-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteCoupon(coupon.id)}
                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#e8cfd8] bg-white text-[#b44a61] hover:bg-[#fff3f6]"
                                    aria-label="쿠폰 삭제"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activityShopTab === 'coupon-record' ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="space-y-4 rounded-2xl border border-[#d8e4f2] bg-white p-4">
                        <h4 className="text-lg font-semibold text-[#153a63]">쿠폰 기록 탭</h4>
                        <select className="h-11 w-full rounded-lg border border-[#c9d9f0] px-3 text-sm" value={couponUseForm.coupon_id} onChange={(event) => setCouponUseForm((prev) => ({ ...prev, coupon_id: event.target.value }))}>
                          <option value="">사용할 쿠폰 선택</option>
                          {couponInventory.filter((row) => row.remaining_quantity > 0).map((row) => (
                            <option key={row.coupon_id} value={row.coupon_id}>{row.icon_emoji} {row.coupon_name} (잔여 {row.remaining_quantity})</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input className="h-11 rounded-lg border border-[#c9d9f0] px-3 text-sm" value={couponUseForm.quantity} onChange={(event) => setCouponUseForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="수량" />
                          <input className="h-11 rounded-lg border border-[#c9d9f0] px-3 text-sm" value={couponUseForm.note} onChange={(event) => setCouponUseForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="사용 메모" />
                        </div>
                        <button type="button" onClick={() => void handleUseCoupon()} disabled={activityShopLoading} className="h-10 w-full cursor-pointer rounded-lg bg-[#10b981] text-sm font-semibold text-white hover:bg-[#059669] disabled:opacity-60">쿠폰 사용 기록 추가</button>

                        <div className="rounded-xl border border-[#dbe6f3] bg-[#f8fbff] p-3">
                          <p className="text-sm font-semibold text-[#1e3a8a]">내 쿠폰 보유 현황</p>
                          <div className="mt-2 space-y-1 text-sm text-[#4a678a]">
                            {couponInventory.length > 0 ? couponInventory.map((row) => (
                              <p key={row.coupon_id}>{row.icon_emoji} {row.coupon_name} · 보유 {row.remaining_quantity} / 구매 {row.purchased_quantity} / 사용 {row.used_quantity}</p>
                            )) : <p>아직 보유한 쿠폰이 없습니다.</p>}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#d8e4f2] bg-white p-4">
                        <h4 className="text-lg font-semibold text-[#153a63]">쿠폰 구매/사용 기록</h4>
                        <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                          {couponLedger.slice(0, 120).map((entry) => (
                            <div key={`${entry.entry_type}-${entry.entry_id}`} className="rounded-lg border border-[#e3edf8] bg-[#f9fcff] px-3 py-2 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-[#1f3f66]">{entry.icon_emoji} {entry.coupon_name}</p>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${entry.entry_type === 'purchase' ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#dcfce7] text-[#166534]'}`}>
                                  {entry.entry_type === 'purchase' ? '구매' : '사용'}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#5f7897]">{entry.student_number}번 {entry.student_name} · 수량 {entry.quantity}{entry.entry_type === 'purchase' ? ` · ${entry.amount_gold.toLocaleString()}원` : ''}</p>
                              <p className="text-xs text-[#7890ac]">{new Date(entry.created_at).toLocaleString('ko-KR')}{entry.note ? ` · ${entry.note}` : ''}</p>
                              {canManageClassContent ? (
                                <div className="mt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => void handleCancelCouponLedgerEntry(entry)}
                                    className="h-8 cursor-pointer rounded-md border border-[#e3c7cf] bg-white px-2 text-xs font-semibold text-[#a43b4f] hover:bg-[#fff4f6]"
                                  >
                                    취소
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activityShopTab === 'funding' ? (
                    <div className="space-y-4">
                      {canManageClassContent ? (
                        <div className="rounded-2xl border border-[#d8e4f2] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-semibold text-[#153a63]">펀딩 프로젝트</h4>
                              <p className="text-sm text-[#5c7594]">생성은 버튼과 팝업으로 분리되어 있습니다.</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenCreateFunding}
                              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                            >
                              <BadgePlus className="size-4" />
                              프로젝트 만들기
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                        <div className="space-y-3">
                          {fundingProjects.map((project) => (
                            <div key={project.id} className="rounded-2xl border border-[#d8e4f2] bg-white p-4">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <button type="button" onClick={() => setSelectedFundingProjectId(project.id)} className="cursor-pointer text-left">
                                  <h5 className="text-lg font-semibold text-[#153a63]">{project.title}</h5>
                                  <p className="text-sm text-[#5c7594]">{project.description || '설명 없음'}</p>
                                </button>
                                <span className={`rounded-full px-2 py-1 text-xs ${project.status === 'completed' ? 'bg-[#dcfce7] text-[#166534]' : project.status === 'closed' ? 'bg-[#e2e8f0] text-[#475569]' : 'bg-[#dbeafe] text-[#1d4ed8]'}`}>{project.status === 'completed' ? '달성' : project.status === 'closed' ? '마감' : '진행중'}</span>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-[#1f3f66]">{project.current_amount.toLocaleString()} / {project.target_amount.toLocaleString()} 원 ({project.progress_percent}%)</p>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e6eef9]"><div className="h-full bg-[linear-gradient(90deg,#3b82f6_0%,#10b981_100%)]" style={{ width: `${Math.min(100, project.progress_percent)}%` }} /></div>
                              <p className="mt-2 text-xs text-[#6b84a2]">기부자 {project.contributor_count}명 · 기부 {project.contribution_count}회</p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <input
                                  className="h-10 w-28 rounded-lg border border-[#c9d9f0] px-3 text-sm"
                                  value={fundingContributionAmount}
                                  onChange={(event) => setFundingContributionAmount(event.target.value)}
                                  disabled={project.status !== 'active' || project.current_amount >= project.target_amount}
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleContributeFunding(project.id)}
                                  disabled={activityShopLoading || project.status !== 'active' || project.current_amount >= project.target_amount}
                                  className="h-10 cursor-pointer rounded-lg bg-[#2563eb] px-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {project.status !== 'active' || project.current_amount >= project.target_amount ? '기부 마감' : '기부하기'}
                                </button>
                                {canManageClassContent ? (
                                  <>
                                    <button
                                      type="button"
                                      aria-label="프로젝트 수정"
                                      onClick={() => handleOpenEditFunding(project)}
                                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#d0dff0] bg-[#f8fbff] text-[#365a80] hover:bg-[#eef5ff]"
                                    >
                                      <Pencil className="size-4" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="프로젝트 마감"
                                      onClick={() => void handleCloseFundingProject(project.id)}
                                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#ebd0d7] bg-white text-[#a43b4f] hover:bg-[#fff4f6]"
                                    >
                                      <Lock className="size-4" />
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-[#d8e4f2] bg-white p-4">
                          <h4 className="text-lg font-semibold text-[#153a63]">프로젝트 기록</h4>
                          <p className="mt-1 text-sm text-[#5c7594]">{selectedFundingProject ? `${selectedFundingProject.title} 기부 내역` : '프로젝트를 선택해 주세요.'}</p>
                          <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto pr-1">
                            {fundingProjectDetail?.contributions.length ? fundingProjectDetail.contributions.map((contribution) => (
                              <div key={contribution.id} className="rounded-lg border border-[#e3edf8] bg-[#f9fcff] px-3 py-2 text-sm">
                                <p className="font-semibold text-[#1f3f66]">{contribution.student_number}번 {contribution.student_name}</p>
                                <p className="text-xs text-[#5f7897]">+{contribution.amount.toLocaleString()} 원</p>
                                <p className="text-xs text-[#7890ac]">{new Date(contribution.created_at).toLocaleString('ko-KR')}</p>
                              </div>
                            )) : <p className="text-sm text-[#7890ac]">아직 기부 기록이 없습니다.</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeMenu === '클래스 툴' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#cddff3] bg-[#edf4fd] px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-slate-900">클래스 툴</h3>
                        <p className="text-sm text-slate-600">교실 운영용 랜덤 뽑기 · 타이머 · 돌림판을 한 곳에서 사용하세요.</p>
                      </div>
                      <div className="rounded-xl border border-[#c9d9ef] bg-white px-3 py-2 text-sm font-semibold text-[#1e3a8a]">
                        총 학생 수 {classToolStudents.length}명
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        { key: 'picker', label: '뽑기', description: '랜덤 선택 도구', icon: Dices },
                        { key: 'timer', label: '타이머', description: '시간 관리 도구', icon: Clock3 },
                        { key: 'roulette', label: '돌림판', description: '룰렛 도구', icon: Target },
                      ].map((tool) => {
                        const ToolIcon = tool.icon
                        const isActive = classToolTab === tool.key
                        return (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={() => setClassToolTab(tool.key as ClassToolTab)}
                            className={`h-16 cursor-pointer rounded-xl border px-3 text-left transition-colors duration-200 ${
                              isActive
                                ? 'border-[#8f5dff] bg-[#f4ecff] text-[#6d28d9]'
                                : 'border-[#d9e5f4] bg-white text-[#415b7a] hover:bg-[#f6f9ff]'
                            }`}
                          >
                            <p className="flex items-center gap-2 text-sm font-semibold"><ToolIcon className="size-4" /> {tool.label}</p>
                            <p className="mt-0.5 text-xs">{tool.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {classToolMessage ? (
                    <div className="rounded-xl border border-[#c9d9ef] bg-white px-4 py-3 text-sm text-[#234f81]">{classToolMessage}</div>
                  ) : null}

                  {classToolTab === 'picker' ? (
                    <div className="space-y-4 rounded-2xl border border-[#d8e4f2] bg-white p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#1e3a8a]">뽑힌 학생: {pickedStudentIds.length} / {classToolStudents.length}명</p>
                        <button
                          type="button"
                          onClick={handleResetDraw}
                          className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#d4e1f1] bg-[#f8fbff] px-3 text-sm text-[#35597f] hover:bg-[#eef5ff]"
                        >
                          <RotateCcw className="size-4" /> 초기화
                        </button>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6eef9]">
                        <div className="h-full bg-[linear-gradient(90deg,#9057ff_0%,#3b82f6_100%)] transition-all duration-300" style={{ width: `${pickerProgressPercent}%` }} />
                      </div>

                      <div className="rounded-xl border border-[#dce8f6] bg-[#f8fbff] p-3">
                        <p className="mb-2 text-sm font-semibold text-[#264b76]">뽑힌 학생 기록</p>
                        {drawHistory.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {drawHistory.map((result) => (
                              <div key={`${result.student.id}-${result.drawOrder}`} className="rounded-lg border border-[#d5e3f3] bg-white px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-xs text-[#56779c]">{result.drawOrder}번째</p>
                                    <p className="text-sm font-semibold text-[#1c3f67]">{result.student.student_number}번 {result.student.name}</p>
                                  </div>
                                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#c7d8ee] bg-white">
                                    {result.student.avatar_url ? (
                                      <img src={result.student.avatar_url} alt={`${result.student.name} 아바타`} className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-[#56779c]">{result.student.name.slice(0, 2)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[#56779c]">아직 뽑힌 학생이 없습니다. 아래 버튼으로 한 명씩 또는 여러 명을 뽑아보세요.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {[1, 2, 3, 4, 5, 6].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => handleDrawStudents(count)}
                            disabled={remainingDrawStudents.length === 0}
                            className="h-11 cursor-pointer rounded-lg border border-[#b8dfcf] bg-[#e9fff4] text-sm font-semibold text-[#0f766e] transition-colors duration-200 hover:bg-[#dcfce7] disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {count}명 뽑기
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-5">
                        {[2, 3, 4, 5, 6].map((teamCount) => (
                          <button
                            key={teamCount}
                            type="button"
                            onClick={() => handleSplitTeams(teamCount)}
                            className="h-11 cursor-pointer rounded-lg border border-[#f4d2ab] bg-[#fff5e8] text-sm font-semibold text-[#c2410c] transition-colors duration-200 hover:bg-[#ffedd5]"
                          >
                            {teamCount}팀 나누기
                          </button>
                        ))}
                      </div>

                      {teamBuckets.length > 0 ? (
                        <div className="rounded-xl border border-[#dce8f6] bg-[#f8fbff] px-3 py-2 text-sm text-[#35597f]">
                          최근 팀 편성: {lastTeamCount}팀 · 상세 결과는 팝업에서 확인할 수 있습니다.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {classToolTab === 'timer' ? (
                    <div className="space-y-4 rounded-2xl border border-[#d8e4f2] bg-white p-4 sm:p-5">
                      <div className="inline-flex rounded-xl border border-[#d7e4f2] bg-[#f4f8ff] p-1">
                        {[
                          { key: 'clock', label: '시계' },
                          { key: 'timer', label: '타이머' },
                          { key: 'stopwatch', label: '스톱워치' },
                        ].map((mode) => (
                          <button
                            key={mode.key}
                            type="button"
                            onClick={() => setTimerMode(mode.key as TimerMode)}
                            className={`h-10 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors duration-200 ${
                              timerMode === mode.key
                                ? 'bg-white text-[#2563eb] shadow'
                                : 'text-[#5b728e] hover:bg-white/70'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-[#1f3760] bg-[radial-gradient(circle_at_50%_0%,rgba(77,153,255,0.22),rgba(7,19,41,0.96)_58%)] px-4 py-8 text-center text-white">
                        {timerMode === 'clock' ? (
                          <>
                            <p className="font-heading text-5xl font-semibold tracking-[0.06em] sm:text-7xl">{formatClockTime(clockNow)}</p>
                            <p className="mt-3 text-base text-[#b7c9e6]">{clockNow.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </>
                        ) : null}

                        {timerMode === 'timer' ? (
                          <>
                            <p className="font-heading text-5xl font-semibold tracking-[0.06em] sm:text-7xl">{formatSecondsToClock(remainingSeconds)}</p>
                            <div className="mx-auto mt-4 grid w-full max-w-sm grid-cols-2 gap-2">
                              <input
                                type="number"
                                min={0}
                                max={180}
                                value={timerMinuteInput}
                                onChange={(event) => setTimerMinuteInput(event.target.value)}
                                className="h-11 rounded-lg border border-[#93aed1] bg-white/90 px-3 text-sm text-[#17345a]"
                                placeholder="분"
                              />
                              <input
                                type="number"
                                min={0}
                                max={59}
                                value={timerSecondInput}
                                onChange={(event) => setTimerSecondInput(event.target.value)}
                                className="h-11 rounded-lg border border-[#93aed1] bg-white/90 px-3 text-sm text-[#17345a]"
                                placeholder="초"
                              />
                            </div>
                            <div className="mx-auto mt-3 grid w-full max-w-sm grid-cols-2 gap-2 sm:grid-cols-4">
                              {classToolTimerPresets.map((minutes) => (
                                <button
                                  key={minutes}
                                  type="button"
                                  onClick={() => applyTimerPreset(minutes, 0)}
                                  className="h-10 cursor-pointer rounded-lg border border-[#9cb9dd] bg-white/20 px-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/30"
                                >
                                  {minutes}분
                                </button>
                              ))}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                              <button type="button" onClick={() => applyTimerPreset()} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 text-sm font-semibold hover:bg-white/30">
                                <Check className="size-4" /> 설정
                              </button>
                              <button type="button" onClick={() => setIsTimerRunning((prev) => !prev)} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 text-sm font-semibold hover:bg-white/30">
                                {isTimerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                                {isTimerRunning ? '일시정지' : '시작'}
                              </button>
                              <button type="button" onClick={() => { setIsTimerRunning(false); applyTimerPreset() }} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 text-sm font-semibold hover:bg-white/30">
                                <RotateCcw className="size-4" /> 리셋
                              </button>
                            </div>
                          </>
                        ) : null}

                        {timerMode === 'stopwatch' ? (
                          <>
                            <p className="font-heading text-5xl font-semibold tracking-[0.06em] sm:text-7xl">{formatStopwatch(stopwatchCentiseconds)}</p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                              <button type="button" onClick={() => setIsStopwatchRunning((prev) => !prev)} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 text-sm font-semibold hover:bg-white/30">
                                {isStopwatchRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                                {isStopwatchRunning ? '정지' : '시작'}
                              </button>
                              <button type="button" onClick={handleRecordStopwatchLap} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-500/25 px-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/35">
                                <History className="size-4" /> 기록
                              </button>
                              <button type="button" onClick={handleResetStopwatch} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 text-sm font-semibold hover:bg-white/30">
                                <RotateCcw className="size-4" /> 초기화
                              </button>
                            </div>
                            <div className="mx-auto mt-4 w-full max-w-md rounded-xl border border-white/25 bg-white/10 p-3 text-left">
                              <p className="text-sm font-semibold text-[#d5e7ff]">기록 로그</p>
                              {stopwatchLaps.length > 0 ? (
                                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto text-sm text-[#d5e7ff]">
                                  {stopwatchLaps.map((lap, index) => (
                                    <div key={lap.id} className="flex items-center justify-between rounded-lg bg-[#0a1730]/35 px-2.5 py-1.5">
                                      <span>기록 {stopwatchLaps.length - index}</span>
                                      <span className="font-semibold">{formatStopwatch(lap.timestamp)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-1 text-sm text-[#b7c9e6]">아직 기록이 없습니다. 기록 버튼으로 시간을 누적해보세요.</p>
                              )}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {classToolTab === 'roulette' ? (
                    <div className="space-y-4 rounded-2xl border border-[#d8e4f2] bg-white p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-[#4a678a]">마블룰렛처럼 후보가 빠르게 순환하다 감속 후 최종 학생이 고정됩니다.</p>
                        <button
                          type="button"
                          onClick={handleSpinRoulette}
                          disabled={isRouletteSpinning || classToolStudents.length === 0}
                          className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-[linear-gradient(90deg,#7c3aed_0%,#2563eb_100%)] px-4 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Target className="size-4" /> {isRouletteSpinning ? '마블 굴리는 중...' : '마블룰렛 시작'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <div className="space-y-3">
                          <div className="overflow-hidden rounded-2xl border border-[#cddcf0] bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_100%)] p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-semibold text-[#1e3a8a]">마블 트랙</p>
                              <p className="text-xs text-[#5f7897]">총 {classToolStudents.length}명</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                              {classToolStudents.map((student) => {
                                const isActive = rouletteCurrentStudent?.id === student.id
                                const isWinner = rouletteWinner?.id === student.id
                                return (
                                  <div
                                    key={student.id}
                                    className={`rounded-lg border px-2 py-2 text-center text-xs transition-all duration-150 ${
                                      isWinner
                                        ? 'border-[#8b5cf6] bg-[#f3e8ff] text-[#6d28d9] shadow-[0_0_0_1px_rgba(139,92,246,0.35)]'
                                        : isActive
                                          ? 'border-[#3b82f6] bg-[#dbeafe] text-[#1e40af] shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                                          : 'border-[#d9e5f4] bg-white text-[#486685]'
                                    }`}
                                  >
                                    <p className="font-semibold">{student.student_number}번</p>
                                    <p className="truncate">{student.name}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[#dbe6f3] bg-[#f8fbff] p-4 text-center">
                            <p className="text-xs uppercase tracking-[0.12em] text-[#6c84a0]">현재 포커스</p>
                            <p className="mt-2 font-heading text-3xl font-semibold text-[#153a63] sm:text-4xl">
                              {rouletteCurrentStudent
                                ? `${rouletteCurrentStudent.student_number}번 ${rouletteCurrentStudent.name}`
                                : '대기 중'}
                            </p>
                            <p className="mt-2 text-sm text-[#5a7696]">
                              {isRouletteSpinning
                                ? '속도를 줄이며 최종 학생을 선택하고 있어요...'
                                : rouletteWinner
                                  ? '최종 선택이 완료되었습니다.'
                                  : '시작 버튼을 눌러 진행하세요.'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-xl border border-[#dbe6f3] bg-[#f8fbff] p-3">
                            <p className="text-sm font-semibold text-[#1e3a8a]">참가 명단</p>
                            <div className="mt-2 max-h-56 overflow-y-auto text-sm text-[#3f5e82]">
                              {classToolStudents.map((student) => (
                                <p key={student.id}>{student.student_number}번 · {student.name}</p>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-[#dbe6f3] bg-[#f8fbff] p-3">
                            <p className="text-sm font-semibold text-[#1e3a8a]">결과</p>
                            <p className="mt-1 text-sm text-[#4a678a]">
                              {rouletteWinner ? (
                                <span className="font-semibold text-[#7c3aed]">{rouletteWinner.student_number}번 {rouletteWinner.name}</span>
                              ) : '아직 결과가 없습니다.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeMenu === '학습 게시판' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#cddff3] bg-[#edf4fd] px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-slate-900">학습 게시판</h3>
                        <p className="text-sm text-slate-600">학생들은 글/댓글/좋아요로 참여하고, 선생님은 수정·삭제를 관리할 수 있습니다.</p>
                      </div>
                      {canManageClassContent ? (
                        <button
                          type="button"
                          onClick={handleOpenCreateLearningBoard}
                          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                        >
                          <BadgePlus className="size-4" />
                          게시판 만들기
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {learningBoardMessage ? (
                    <div className="rounded-xl border border-[#cfe2f8] bg-[#eef6ff] px-3 py-2 text-sm text-[#1f4d7d]">{learningBoardMessage}</div>
                  ) : null}

                  {learningBoardScreen === 'list' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {learningBoards.map((board) => (
                      <article key={board.id} className={`rounded-2xl border p-4 shadow-sm ${selectedLearningBoardId === board.id ? 'border-[#7ea8df] bg-[#f6fbff]' : 'border-[#d8e4f2] bg-white'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-semibold text-[#173c65]">{board.title}</h4>
                            <p className="mt-1 line-clamp-2 text-sm text-[#5c7594]">{board.description || '설명 없음'}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs ${board.is_active ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#e2e8f0] text-[#475569]'}`}>{board.is_active ? '활성' : '닫힘'}</span>
                        </div>
                        <p className="mt-2 text-xs text-[#7088a5]">번호 {board.id} · 게시글 {board.post_count}개</p>
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLearningBoardId(board.id)
                              setLearningBoardSort('number')
                              setLearningBoardScreen('detail')
                              setEditingLearningPostId(null)
                              setLearningBoardPostForm(emptyLearningBoardPostForm)
                              setLearningBoardMessage('')
                            }}
                            className="h-10 cursor-pointer rounded-lg bg-[#2563eb] px-3 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                          >
                            게시판 열기
                          </button>
                          {canManageClassContent ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="게시판 수정"
                                onClick={() => handleOpenEditLearningBoard(board)}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#d0dff0] bg-[#f8fbff] text-[#365a80] hover:bg-[#eef5ff]"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="게시판 삭제"
                                onClick={() => void handleDeleteLearningBoard(board.id)}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#ebd0d7] bg-white text-[#a43b4f] hover:bg-[#fff4f6]"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </article>
                      ))}
                    </div>
                  ) : null}

                  {learningBoardScreen === 'detail' ? (selectedLearningBoard ? (
                    <div className="rounded-2xl border border-[#d8e4f2] bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLearningBoardScreen('list')
                              setEditingLearningPostId(null)
                              setLearningBoardPostForm(emptyLearningBoardPostForm)
                              setLearningBoardMessage('')
                            }}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#d0dff0] bg-[#f8fbff] text-[#365a80] hover:bg-[#eef5ff]"
                            aria-label="게시판 목록으로 돌아가기"
                          >
                            <ArrowLeft className="size-4" />
                          </button>
                          <div className="min-w-0">
                            <h4 className="truncate text-lg font-semibold text-[#173c65]">{selectedLearningBoard.title}</h4>
                            <p className="text-xs text-[#67809f]">글 등록 후 자동으로 번호순으로 정렬됩니다.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setLearningBoardSort('number')} className={`h-9 cursor-pointer rounded-full px-3 text-xs font-semibold ${learningBoardSort === 'number' ? 'bg-[#2563eb] text-white' : 'bg-[#eff4fb] text-[#4a607c]'}`}>번호순</button>
                          <button type="button" onClick={() => setLearningBoardSort('latest')} className={`h-9 cursor-pointer rounded-full px-3 text-xs font-semibold ${learningBoardSort === 'latest' ? 'bg-[#2563eb] text-white' : 'bg-[#eff4fb] text-[#4a607c]'}`}>최신순</button>
                          <button type="button" onClick={() => setLearningBoardSort('likes')} className={`h-9 cursor-pointer rounded-full px-3 text-xs font-semibold ${learningBoardSort === 'likes' ? 'bg-[#2563eb] text-white' : 'bg-[#eff4fb] text-[#4a607c]'}`}>좋아요순</button>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-[#dbe7f7] bg-[#f8fbff] p-3">
                        <p className="mb-2 text-xs text-[#5c7594]">{editingLearningPostId ? '게시글 수정' : '새 글 작성'}</p>
                        <textarea
                          className="min-h-24 w-full rounded-xl border border-[#cfdeef] bg-white px-3 py-2 text-sm text-[#193654]"
                          value={learningBoardPostForm.content}
                          onChange={(event) => setLearningBoardPostForm((prev) => ({ ...prev, content: event.target.value }))}
                          placeholder="게시글 내용을 입력하세요"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            ref={learningPostImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (!file) {
                                return
                              }
                              void handleUploadLearningBoardPostImage(file)
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => learningPostImageInputRef.current?.click()}
                            className="inline-flex h-10 min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#cfdeef] bg-white px-3 text-sm font-semibold text-[#1f3f66] hover:bg-[#eef5ff]"
                            disabled={uploadingLearningPostImage || learningBoardLoading}
                          >
                            <ImagePlus className="size-4" />
                            {uploadingLearningPostImage ? '업로드 중...' : '이미지 첨부'}
                          </button>
                          {learningBoardPostForm.image_url ? (
                            <div className="inline-flex h-10 max-w-full items-center gap-2 rounded-xl border border-[#d6e4f5] bg-white px-3 text-xs text-[#4a607c]">
                              <span className="max-w-[220px] truncate">
                                {learningBoardPostForm.image_original_filename || '첨부된 이미지'}
                              </span>
                              <button
                                type="button"
                                aria-label="첨부 이미지 제거"
                                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#d3deee] text-[#5b7393] hover:bg-[#f3f8ff]"
                                onClick={() => {
                                  setLearningBoardPostForm((prev) => ({
                                    ...prev,
                                    image_url: '',
                                    image_object_key: '',
                                    image_original_filename: '',
                                  }))
                                }}
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ) : null}
                          <Button
                            className="h-10 cursor-pointer"
                            onClick={() => void handleSaveLearningBoardPost()}
                            disabled={learningBoardLoading || uploadingLearningPostImage}
                          >
                            {editingLearningPostId ? '수정 저장' : '글 작성하기'}
                          </Button>
                          {editingLearningPostId ? (
                            <Button
                              variant="outline"
                              className="h-10 cursor-pointer"
                              onClick={() => {
                                setEditingLearningPostId(null)
                                setLearningBoardPostForm(emptyLearningBoardPostForm)
                              }}
                            >
                              취소
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {learningBoardPosts.map((post) => {
                          const canManagePost = canManageClassContent || (isStudentSession && studentSessionId === post.student_id)

                          return (
                            <article key={post.id} className="rounded-xl border border-[#dbe7f7] bg-white p-3 shadow-sm">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-[#173c65]">{post.student_number}번 {post.student_name}</p>
                                  <p className="text-xs text-[#7890ac]">{new Date(post.created_at).toLocaleString('ko-KR')}</p>
                                </div>
                                {canManagePost ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      aria-label="게시글 수정"
                                      onClick={() => {
                                        setEditingLearningPostId(post.id)
                                        setLearningBoardPostForm({
                                          content: post.content,
                                          image_url: post.image_url ?? '',
                                          image_object_key: post.image_object_key ?? '',
                                          image_original_filename: post.image_original_filename ?? '',
                                        })
                                      }}
                                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#d0dff0] bg-[#f8fbff] text-[#365a80] hover:bg-[#eef5ff]"
                                    >
                                      <Pencil className="size-4" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="게시글 삭제"
                                      onClick={() => void handleDeleteLearningPost(post.id)}
                                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#ebd0d7] bg-white text-[#a43b4f] hover:bg-[#fff4f6]"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                ) : null}
                              </div>

                              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#324f71]">{post.content}</p>
                              {post.image_url ? (
                                <img src={post.image_url} alt="게시글 이미지" className="mt-3 h-48 w-full rounded-lg object-cover" />
                              ) : null}

                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleToggleLearningPostLike(post.id)}
                                  className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border px-3 text-xs font-semibold ${post.liked_by_me ? 'border-[#f8b4c2] bg-[#fff1f5] text-[#be123c]' : 'border-[#d0dff0] bg-[#f8fbff] text-[#365a80]'}`}
                                >
                                  <Heart className="size-4" /> 좋아요 {post.like_count}
                                </button>
                                <span className="inline-flex h-9 items-center rounded-lg border border-[#d0dff0] bg-[#f8fbff] px-3 text-xs font-semibold text-[#365a80]">
                                  <MessageCircleHeart className="mr-1 size-4" /> 댓글 {post.comment_count}
                                </span>
                              </div>

                              <div className="mt-3 space-y-2">
                                {post.comments.slice(0, 4).map((comment) => {
                                  const canManageComment = canManageClassContent || (isStudentSession && studentSessionId === comment.student_id)
                                  return (
                                    <div key={comment.id} className="rounded-lg border border-[#e3edf8] bg-[#f9fcff] px-3 py-2 text-xs">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-[#1f3f66]">{comment.student_number}번 {comment.student_name}</p>
                                        {canManageComment ? (
                                          <button
                                            type="button"
                                            aria-label="댓글 삭제"
                                            onClick={() => void handleDeleteLearningComment(comment.id)}
                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#ebd0d7] bg-white text-[#a43b4f] hover:bg-[#fff4f6]"
                                          >
                                            <Trash2 className="size-3" />
                                          </button>
                                        ) : null}
                                      </div>
                                      <p className="mt-1 text-[#4e6784]">{comment.content}</p>
                                    </div>
                                  )
                                })}
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <input
                                  className="h-10 min-w-0 flex-1 rounded-lg border border-[#c9d9f0] px-3 text-sm"
                                  value={learningBoardCommentDrafts[post.id] ?? ''}
                                  onChange={(event) => setLearningBoardCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                                  placeholder="댓글을 입력하세요"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleAddLearningComment(post.id)}
                                  className="h-10 cursor-pointer rounded-lg bg-[#2563eb] px-3 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                                >
                                  등록
                                </button>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#cadcf1] bg-[#f7fbff] px-4 py-6 text-sm text-[#67809f]">
                      게시판을 선택하면 학생 글과 댓글을 볼 수 있습니다.
                    </div>
                  )) : null}
                </div>
              ) : null}

              {!['학생 목록', '미션', '칭찬/주의 카드', '문제 던전', '던전 탐험', '칭호', '학생 로그인', '클래스 툴', '학급 활동 상점', '학습 게시판'].includes(activeMenu) ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">총 학생</p>
                    <p className="mt-2 font-heading text-2xl font-semibold">{overview?.total_students ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">평균 레벨</p>
                    <p className="mt-2 font-heading text-2xl font-semibold">{overview?.average_level ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">누적 포인트</p>
                    <p className="mt-2 font-heading text-2xl font-semibold">{overview?.total_points ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">문제 은행</p>
                    <p className="mt-2 font-heading text-2xl font-semibold">{overview?.total_questions ?? 0} 문항</p>
                  </div>
                </div>
              ) : null}

                {studentDetailLoading ? (
                  <div className="rounded-xl border border-[#d7e3f4] bg-[#f7fbff] px-4 py-3 text-sm text-slate-600">
                    학생 상세정보를 불러오는 중입니다...
                  </div>
                ) : null}

                {loadingDashboard ? (
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                    대시보드 동기화 중...
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          {showCouponModal ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-3xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold text-[#143760]">{editingCouponId ? '쿠폰 수정' : '쿠폰 만들기'}</h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={closeCouponModal}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[#4f6784]">
                    쿠폰명 *
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={couponForm.name}
                      onChange={(event) => setCouponForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="예: 밀크츄"
                    />
                  </label>
                  <label className="text-xs text-[#4f6784]">
                    가격(원)
                    <input
                      type="number"
                      min={1}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={couponForm.price_gold}
                      onChange={(event) => setCouponForm((prev) => ({ ...prev, price_gold: event.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-[#4f6784]">
                    재고
                    <input
                      type="number"
                      min={0}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={couponForm.stock}
                      onChange={(event) => setCouponForm((prev) => ({ ...prev, stock: event.target.value }))}
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-[#d2deed] bg-[#f8fbff] px-3 py-2 text-sm text-[#304f72] sm:mt-6">
                    <input
                      type="checkbox"
                      checked={couponForm.is_active}
                      onChange={(event) => setCouponForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                    />
                    판매 활성화
                  </label>
                </div>

                <label className="mt-3 block text-xs text-[#4f6784]">
                  쿠폰 설명
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 py-2 text-sm text-[#193654]"
                    value={couponForm.description}
                    onChange={(event) => setCouponForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <div className="mt-3">
                  <p className="mb-2 text-xs text-[#4f6784]">쿠폰 아이콘 선택</p>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {couponEmojiPresets.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCouponForm((prev) => ({ ...prev, icon_emoji: emoji }))}
                        className={`flex h-10 cursor-pointer items-center justify-center rounded-lg border text-lg ${couponForm.icon_emoji === emoji ? 'border-[#6a9bd5] bg-[#eaf3ff]' : 'border-[#d5e1ef] bg-white hover:bg-[#f1f7ff]'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" className="h-10 cursor-pointer" onClick={closeCouponModal}>취소</Button>
                  <Button className="h-10 cursor-pointer" onClick={() => void handleSaveCoupon()} disabled={activityShopLoading}>
                    {activityShopLoading ? '저장 중...' : editingCouponId ? '수정 완료' : '쿠폰 만들기'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showFundingModal ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-3xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold text-[#143760]">{editingFundingProjectId ? '펀딩 프로젝트 수정' : '펀딩 프로젝트 만들기'}</h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={closeFundingModal}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[#4f6784]">
                    프로젝트 이름 *
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={fundingForm.title}
                      onChange={(event) => setFundingForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-[#4f6784]">
                    목표 금액(원)
                    <input
                      type="number"
                      min={1}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={fundingForm.target_amount}
                      onChange={(event) => setFundingForm((prev) => ({ ...prev, target_amount: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="mt-3 block text-xs text-[#4f6784]">
                  프로젝트 설명
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 py-2 text-sm text-[#193654]"
                    value={fundingForm.description}
                    onChange={(event) => setFundingForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <label className="mt-3 block text-xs text-[#4f6784]">
                  달성 시 활동 계획
                  <input
                    className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                    value={fundingForm.reward_plan}
                    onChange={(event) => setFundingForm((prev) => ({ ...prev, reward_plan: event.target.value }))}
                  />
                </label>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" className="h-10 cursor-pointer" onClick={closeFundingModal}>취소</Button>
                  <Button className="h-10 cursor-pointer" onClick={() => void handleSaveFundingProject()} disabled={activityShopLoading}>
                    {activityShopLoading ? '저장 중...' : editingFundingProjectId ? '수정 완료' : '프로젝트 만들기'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showLearningBoardModal ? (
            <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-3xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold text-[#143760]">{editingLearningBoardId ? '학습 게시판 수정' : '새 학습 게시판 만들기'}</h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={closeLearningBoardModal}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <label className="text-xs text-[#4f6784]">
                    게시판 제목 *
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={learningBoardForm.title}
                      onChange={(event) => setLearningBoardForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="예: 과학 1단원 지층 사진 올리기"
                    />
                  </label>

                  <label className="text-xs text-[#4f6784]">
                    게시판 설명
                    <textarea
                      className="mt-1 min-h-24 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 py-2 text-sm text-[#193654]"
                      value={learningBoardForm.description}
                      onChange={(event) => setLearningBoardForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="학생들에게 과제 제출 방법이나 주의사항을 안내해 주세요"
                    />
                  </label>

                  <label className="text-xs text-[#4f6784]">
                    대표 이미지 URL (선택)
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={learningBoardForm.cover_image_url}
                      onChange={(event) => setLearningBoardForm((prev) => ({ ...prev, cover_image_url: event.target.value }))}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-[#d2deed] bg-[#f8fbff] px-3 py-2 text-sm text-[#304f72]">
                    <input
                      type="checkbox"
                      checked={learningBoardForm.is_active}
                      onChange={(event) => setLearningBoardForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                    />
                    게시판 활성화
                  </label>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" className="h-10 cursor-pointer" onClick={closeLearningBoardModal}>취소</Button>
                  <Button className="h-10 cursor-pointer" onClick={() => void handleSaveLearningBoard()} disabled={learningBoardLoading}>
                    {learningBoardLoading ? '저장 중...' : editingLearningBoardId ? '수정 완료' : '게시판 만들기'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {couponHistoryCouponId ? (
            <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#03070dcc] p-4">
              <div className="modal-enter w-full max-w-3xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-[#143760]">구매자 목록</h3>
                    <p className="text-sm text-[#5c7594]">{selectedCouponForHistory ? `${selectedCouponForHistory.icon_emoji} ${selectedCouponForHistory.name}` : '쿠폰 기록'}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={() => setCouponHistoryCouponId(null)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <p className="text-sm font-semibold text-[#21446f]">총 {couponHistoryEntries.length}개의 기록이 있습니다.</p>
                <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto pr-1">
                  {couponHistoryEntries.length > 0 ? couponHistoryEntries.slice(0, 100).map((entry) => (
                    <div key={`${entry.entry_type}-${entry.entry_id}`} className="rounded-lg border border-[#e3edf8] bg-[#f9fcff] px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#1f3f66]">{entry.student_number}번 {entry.student_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${entry.entry_type === 'purchase' ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#dcfce7] text-[#166534]'}`}>
                          {entry.entry_type === 'purchase' ? '구매 완료' : '사용 완료'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5f7897]">
                        {entry.entry_type === 'purchase' ? `구매일: ${new Date(entry.created_at).toLocaleString('ko-KR')} · ${entry.amount_gold.toLocaleString()}원` : `사용일: ${new Date(entry.created_at).toLocaleString('ko-KR')}`}
                      </p>
                      {entry.note ? <p className="text-xs text-[#7890ac]">메모: {entry.note}</p> : null}
                    </div>
                  )) : <p className="text-sm text-[#7890ac]">아직 기록이 없습니다.</p>}
                </div>
              </div>
            </div>
          ) : null}

          {showMissionModal ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-3xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold text-[#143760]">
                    {editingMission ? '미션 수정' : '미션 만들기'}
                  </h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={closeMissionModal}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[#4f6784]">
                    미션명 *
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={missionForm.title}
                      onChange={(event) => setMissionForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="예: 주간 독서 인증"
                    />
                  </label>
                  <label className="text-xs text-[#4f6784]">
                    상승 능력치
                    <select
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={missionForm.target_stat_key}
                      onChange={(event) => {
                        const selected = missionStatOptions.find((option) => option.key === event.target.value)
                        setMissionForm((prev) => ({
                          ...prev,
                          target_stat_key: event.target.value,
                          target_stat_label: selected?.label ?? prev.target_stat_label,
                        }))
                      }}
                    >
                      {missionStatOptions.map((option) => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-3 block text-xs text-[#4f6784]">
                  미션 설명
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 py-2 text-sm text-[#193654]"
                    value={missionForm.description}
                    onChange={(event) => setMissionForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs text-[#4f6784]">EXP
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={missionForm.reward_exp} onChange={(event) => setMissionForm((prev) => ({ ...prev, reward_exp: event.target.value }))} />
                  </label>
                  <label className="text-xs text-[#4f6784]">원
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={missionForm.reward_won} onChange={(event) => setMissionForm((prev) => ({ ...prev, reward_won: event.target.value }))} />
                  </label>
                  <label className="text-xs text-[#4f6784]">냥
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={missionForm.reward_nyang} onChange={(event) => setMissionForm((prev) => ({ ...prev, reward_nyang: event.target.value }))} />
                  </label>
                  <label className="text-xs text-[#4f6784]">목표 횟수
                    <input type="number" min={1} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={missionForm.goal_count} onChange={(event) => setMissionForm((prev) => ({ ...prev, goal_count: event.target.value }))} />
                  </label>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-[#d2deed] bg-[#f8fbff] px-3 py-2 text-sm text-[#304f72]">
                    <input
                      type="checkbox"
                      checked={missionForm.repeatable}
                      onChange={(event) =>
                        setMissionForm((prev) => ({
                          ...prev,
                          repeatable: event.target.checked,
                          weekly_reset: event.target.checked ? prev.weekly_reset : false,
                        }))
                      }
                    />
                    반복 미션
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-[#d2deed] bg-[#f8fbff] px-3 py-2 text-sm text-[#304f72]">
                    <input
                      type="checkbox"
                      checked={missionForm.weekly_reset}
                      disabled={!missionForm.repeatable}
                      onChange={(event) => setMissionForm((prev) => ({ ...prev, weekly_reset: event.target.checked }))}
                    />
                    주간 달성률 초기화
                  </label>
                </div>

                <div className="mt-3">
                  <p className="mb-2 text-xs text-[#4f6784]">미션 아이콘</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {missionIconPresets.map((preset) => {
                      const Icon = preset.icon
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setMissionForm((prev) => ({ ...prev, icon_key: preset.key }))}
                          className={`flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg bg-gradient-to-r text-xs font-semibold text-white transition-all duration-[200ms] ${preset.className} ${missionForm.icon_key === preset.key ? 'ring-2 ring-[#5e8fc7]' : ''}`}
                        >
                          <Icon className="size-3.5" />
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" className="h-10 cursor-pointer" onClick={closeMissionModal}>취소</Button>
                  <Button className="h-10 cursor-pointer" onClick={handleSubmitMission} disabled={savingMission}>
                    {savingMission ? '저장 중...' : editingMission ? '수정 완료' : '미션 만들기'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showMissionAchieverModal && achieverTargetMission ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-4xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold text-[#143760]">{achieverTargetMission.title} · 달성자 추가</h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={() => {
                      setShowMissionAchieverModal(false)
                      setAchieverTargetMission(null)
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    className="h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                    placeholder="번호 또는 이름으로 검색"
                    value={missionSearchKeyword}
                    onChange={(event) => setMissionSearchKeyword(event.target.value)}
                  />

                  <button
                    type="button"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#cfdeef] bg-[#f5faff] px-3 text-sm text-[#2d4c72]"
                    onClick={handleToggleSelectAllMissionStudents}
                  >
                    <Check className="size-4" />
                    {isAllFilteredMissionStudentsSelected ? '전체 해제' : '전체 선택'}
                  </button>

                  <div className="grid max-h-[380px] grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-[#dbe6f3] bg-[#f8fbff] p-2 sm:grid-cols-2">
                    {filteredMissionStudents.map((student) => {
                      const checked = selectedMissionStudentIds.includes(student.id)
                      const previous =
                        achieverTargetMission.achievers.find((achiever) => achiever.student_id === student.id)
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleToggleMissionStudent(student.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors duration-[200ms] ${
                            checked ? 'border-[#6a9bd5] bg-[#eaf3ff]' : 'border-[#d5e1ef] bg-white hover:bg-[#f1f7ff]'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#1d3f65]">{student.student_number}번 {student.name}</p>
                            <p className="text-xs text-[#6782a1]">누적 달성 {previous?.completion_count ?? 0}회</p>
                          </div>
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${checked ? 'border-[#6a9bd5] bg-[#2f6ea8] text-white' : 'border-[#9db4cd] text-transparent'}`}>
                            <Check className="size-3" />
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="h-10 cursor-pointer"
                      onClick={() => {
                        setShowMissionAchieverModal(false)
                        setAchieverTargetMission(null)
                      }}
                    >
                      취소
                    </Button>
                    <Button className="h-10 cursor-pointer" onClick={handleSubmitMissionAchievers} disabled={updatingMissionAchievers}>
                      {updatingMissionAchievers ? '반영 중...' : '선택 완료'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showCardEditorModal ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-3xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold text-[#143760]">
                    {editingCard ? `${activeCardTab === 'praise' ? '칭찬카드' : '주의카드'} 수정` : `${activeCardTab === 'praise' ? '새 칭찬카드' : '새 주의카드'} 만들기`}
                  </h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={closeCardEditorModal}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-1">
                  <label className="text-xs text-[#4f6784]">
                    카드명 *
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={cardForm.title}
                      onChange={(event) => setCardForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="mt-3 block text-xs text-[#4f6784]">
                  카드 설명
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 py-2 text-sm text-[#193654]"
                    value={cardForm.description}
                    onChange={(event) => setCardForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs text-[#4f6784]">EXP
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={cardForm.reward_exp} onChange={(event) => setCardForm((prev) => ({ ...prev, reward_exp: event.target.value }))} />
                  </label>
                  <label className="text-xs text-[#4f6784]">원
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={cardForm.reward_won} onChange={(event) => setCardForm((prev) => ({ ...prev, reward_won: event.target.value }))} />
                  </label>
                  <label className="text-xs text-[#4f6784]">냥
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={cardForm.reward_nyang} onChange={(event) => setCardForm((prev) => ({ ...prev, reward_nyang: event.target.value }))} />
                  </label>
                  <label className="text-xs text-[#4f6784]">레벨 ±
                    <input type="number" min={0} className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]" value={cardForm.level_delta} onChange={(event) => setCardForm((prev) => ({ ...prev, level_delta: event.target.value }))} />
                  </label>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[#4f6784]">상승/감소 스탯 선택 (최대 6개)</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {missionStatOptions.map((option) => {
                        const selected = cardForm.selected_stat_keys.includes(option.key)
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleToggleCardStat(option.key)}
                            className={`h-11 cursor-pointer rounded-xl border text-sm font-semibold transition-all duration-[220ms] ${
                              selected
                                ? activeCardTab === 'praise'
                                  ? 'border-[#f2a2c5] bg-[#ffe8f2] text-[#d92e79]'
                                  : 'border-[#9bbdf0] bg-[#eaf2ff] text-[#2458b7]'
                                : 'border-[#cfdeef] bg-[#f9fcff] text-[#39597c] hover:bg-[#eef5ff]'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-[#6c829b]">선택됨: {cardForm.selected_stat_keys.length} / 6</p>
                  </div>

                  <label className="text-xs text-[#4f6784]">스탯 수치 (선택한 모든 스탯에 동일 적용)
                    <input
                      type="number"
                      min={1}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={cardForm.stat_delta}
                      onChange={(event) => setCardForm((prev) => ({ ...prev, stat_delta: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <p className="mb-2 text-xs text-[#4f6784]">
                    카드 아이콘 ({activeCardTab === 'praise' ? '칭찬카드 전용 · 붉은 계열' : '주의카드 전용 · 파란 계열'})
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {activeCardIconPresets.map((preset) => {
                      const Icon = preset.icon
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setCardForm((prev) => ({ ...prev, icon_key: preset.key }))}
                          className={`flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg bg-gradient-to-r text-xs font-semibold text-white transition-all duration-[200ms] ${preset.className} ${cardForm.icon_key === preset.key ? 'ring-2 ring-[#5e8fc7]' : ''}`}
                        >
                          <Icon className="size-3.5" />
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" className="h-10 cursor-pointer" onClick={closeCardEditorModal}>취소</Button>
                  <Button className="h-10 cursor-pointer" onClick={handleSubmitCard} disabled={savingCard}>
                    {savingCard ? '저장 중...' : editingCard ? '수정 완료' : '카드 만들기'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showCardIssueModal && issuingCard ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-6xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className={`rounded-2xl px-4 py-4 text-white ${issuingCard.card_type === 'praise' ? 'bg-[linear-gradient(90deg,#ff2d90_0%,#e12880_100%)]' : 'bg-[linear-gradient(90deg,#356bda_0%,#474fda_100%)]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-2xl font-semibold">{issuingCard.title}</p>
                      <p className="text-sm text-white/85">{issuingCard.description || '카드 발급 대상 학생을 선택하세요.'}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/20 px-2 py-0.5">+{issuingCard.reward_exp} EXP</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5">+{issuingCard.reward_won} G</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5">+{issuingCard.level_delta} 레벨</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">총 {issuingCard.total_issued}회 발급</div>
                      <button
                        type="button"
                        aria-label="닫기"
                        onClick={() => {
                          setShowCardIssueModal(false)
                          setIssuingCard(null)
                        }}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-white/10"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <input
                        className="h-11 flex-1 rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                        placeholder="번호 또는 이름으로 검색"
                        value={cardIssueKeyword}
                        onChange={(event) => setCardIssueKeyword(event.target.value)}
                      />
                      <button
                        type="button"
                        className="h-11 rounded-xl border border-[#cfdeef] bg-[#f5faff] px-3 text-sm text-[#2d4c72]"
                        onClick={handleToggleSelectAllCardStudents}
                      >
                        {isAllFilteredCardStudentsSelected ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>

                    <input
                      className="h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      placeholder="발급 메모 (선택)"
                      value={cardIssueNote}
                      onChange={(event) => setCardIssueNote(event.target.value)}
                    />

                    <div className="grid max-h-[390px] grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-[#dbe6f3] bg-[#f8fbff] p-2 md:grid-cols-3">
                      {filteredCardStudents.map((student) => {
                        const selected = selectedCardStudentIds.includes(student.id)
                        const receivedCount =
                          cardHistory?.recipients.find((recipient) => recipient.student_id === student.id)?.issued_count ?? 0
                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleToggleCardStudent(student.id)}
                            className={`relative rounded-xl border px-2 py-3 text-center transition-colors duration-[200ms] ${
                              selected ? 'border-[#f4a7cd] bg-[#fff1f7]' : 'border-[#d8e4f3] bg-white hover:bg-[#f5faff]'
                            }`}
                          >
                            <span className="absolute right-1 top-1 inline-flex items-center gap-1 rounded-full bg-[#ff5ca8] px-1.5 py-0.5 text-[10px] font-semibold text-white"><Heart className="size-2.5" />{receivedCount}</span>
                            <p className="text-xs text-[#56779b]">{student.student_number}번</p>
                            <p className="truncate text-sm font-semibold text-[#1d3f65]">{student.name}</p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="h-10 cursor-pointer"
                        onClick={() => {
                          setShowCardIssueModal(false)
                          setIssuingCard(null)
                        }}
                      >
                        닫기
                      </Button>
                      <Button className="h-10 cursor-pointer" onClick={handleSubmitCardIssue} disabled={issuingCardLoading}>
                        {issuingCardLoading ? '발급 중...' : '선택 학생 발급'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#d8e4f3] bg-[#f8fbff] p-3">
                    <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-[#274d7b]"><History className="size-4" /> 발급 내역</p>
                    {loadingCardHistory ? (
                      <p className="text-xs text-[#607a96]">발급 내역을 불러오는 중...</p>
                    ) : cardHistory && cardHistory.history.length > 0 ? (
                      <div className="max-h-[430px] space-y-2 overflow-y-auto text-xs text-[#496889]">
                        {cardHistory.history.map((item) => (
                          <div key={item.issue_id} className="rounded-lg border border-[#dbe6f3] bg-white p-2">
                            <p className="font-semibold text-[#1d3f65]">{item.student_number}번 {item.student_name}</p>
                            <p>{new Date(item.issued_at).toLocaleString('ko-KR')}</p>
                            {item.issued_note ? <p className="mt-1 text-[#627f9c]">{item.issued_note}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#607a96]">아직 발급 내역이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showTitlePreviewModal && previewTitle ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05101dd4] p-4">
              <div className="modal-enter w-full max-w-2xl rounded-2xl border border-[#c8d9ec] bg-white p-5 shadow-[0_24px_50px_rgba(10,37,70,0.26)]">
                <div className="relative overflow-hidden rounded-2xl border border-[#dbe7f5] bg-[linear-gradient(120deg,rgba(245,249,255,0.98),rgba(231,240,253,0.93))] px-4 py-4">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70">
                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#d4e5ff] blur-2xl" />
                    <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-[#ffd9e7] blur-2xl" />
                  </div>
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#54739a]">칭호 오버레이 미리보기</p>
                      <p className="mt-1 font-heading text-xl font-semibold text-[#123458]">{previewTitle.title_name}</p>
                      <p className="mt-1 text-sm text-[#5c7594]">{previewTitle.condition_text}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="닫기"
                      onClick={() => {
                        setShowTitlePreviewModal(false)
                        setPreviewTitle(null)
                      }}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#d2deed] bg-white text-[#375b81] transition-colors duration-[200ms] hover:bg-[#eef5ff]"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="relative mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-[#f4d5de] bg-[#fff5f8] px-2 py-[7px] text-center text-[#b23c63]">
                      <BookOpen className="mx-auto mb-0.5 size-3.5" /> EXP +{titleMissionRewardExp || 0}
                    </div>
                    <div className="rounded-lg border border-[#d3e1f4] bg-[#eff5ff] px-2 py-[7px] text-center text-[#315f98]">
                      <Coins className="mx-auto mb-0.5 size-3.5" /> 원 +{titleMissionRewardWon || 0}
                    </div>
                    <div className="rounded-lg border border-[#d8e4f3] bg-[#f8fbff] px-2 py-[7px] text-center text-[#456792]">
                      <Gift className="mx-auto mb-0.5 size-3.5" /> 수상자 {previewTitle.recipient_count}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[#4f6784]">
                    칭호 미션 EXP
                    <input
                      type="number"
                      min={0}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={titleMissionRewardExp}
                      onChange={(event) => setTitleMissionRewardExp(event.target.value)}
                    />
                  </label>
                  <label className="text-xs text-[#4f6784]">
                    칭호 미션 원
                    <input
                      type="number"
                      min={0}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdeef] bg-[#f9fcff] px-3 text-sm text-[#193654]"
                      value={titleMissionRewardWon}
                      onChange={(event) => setTitleMissionRewardWon(event.target.value)}
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    className="h-10 cursor-pointer border-[#c8d7ea] bg-white text-[#21446f] hover:bg-[#eef5ff]"
                    onClick={() => {
                      void handleOpenIssueModal(previewTitle)
                      setShowTitlePreviewModal(false)
                      setPreviewTitle(null)
                    }}
                  >
                    <Gift className="mr-1 size-4" /> 바로 발급
                  </Button>
                  <Button
                    className="h-10 cursor-pointer bg-[linear-gradient(90deg,#ff3f98_0%,#ed2f88_100%)] text-white transition-all duration-[220ms] hover:-translate-y-0.5 hover:brightness-110"
                    onClick={handleCreateMissionFromTitle}
                  >
                    <Sparkles className="mr-1 size-4" /> 칭호 미션 만들기
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showTitleEditorModal ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#03070dcc] p-4">
              <div className="modal-enter max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#3a5a82] bg-[linear-gradient(180deg,#0d1f34_0%,#0b1a2e_100%)] p-5 text-[#dce9f8] shadow-[0_20px_45px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-2xl font-semibold tracking-[0.07em] text-[#f2f7ff]">
                    {editingTitle ? '칭호 수정' : '새 칭호 만들기'}
                  </h3>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={closeTitleEditorModal}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#4a6f9a] text-[#9ebee0] hover:bg-[#1b3557]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-[#36557c] bg-[#10253f]/80 p-4">
                    <p className="mb-2 text-sm font-semibold text-[#9ac8f8]">미리보기</p>
                    {(() => {
                      const matchedPreset = titleIconPresets.find((preset) => preset.key === titleForm.icon_key)
                      const IconComponent = matchedPreset?.icon ?? Medal
                      const frameClass =
                        titleFramePresets.find((frame) => frame.key === titleForm.frame_key)?.className ??
                        'ring-2 ring-slate-300/80'

                      return (
                        <div className={`inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-full bg-gradient-to-r px-4 text-sm font-semibold text-white ${matchedPreset?.className ?? 'from-blue-600 to-indigo-500'} ${frameClass}`}>
                          {titleForm.icon_public_url ? (
                            <img src={titleForm.icon_public_url} alt="업로드 아이콘" className="h-5 w-5 rounded object-cover" />
                          ) : (
                            <IconComponent className="size-4" />
                          )}
                          {titleForm.title_name.trim() || '미리보기'}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm text-[#b6cbe2]">
                      칭호명 *
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                        value={titleForm.title_name}
                        onChange={(event) => setTitleForm((prev) => ({ ...prev, title_name: event.target.value }))}
                        placeholder="예: 기부왕"
                      />
                    </label>
                    <label className="text-sm text-[#b6cbe2]">
                      획득 조건 설명 *
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                        value={titleForm.condition_text}
                        onChange={(event) => setTitleForm((prev) => ({ ...prev, condition_text: event.target.value }))}
                        placeholder="예: 수업 발표 적극 참여 카드 10회"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm text-[#b6cbe2]">
                      달성 방식
                      <select
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff]"
                        value={titleForm.achievement_mode}
                        onChange={(event) => {
                          const nextMode = event.target.value as TitleAchievementMode
                          setTitleForm((prev) => ({
                            ...prev,
                            achievement_mode: nextMode,
                            auto_condition_type: nextMode === 'auto' ? 'card_issue_count' : 'none',
                          }))
                        }}
                      >
                        <option value="manual">수동 달성 (교사가 직접 발급)</option>
                        <option value="auto">자동 달성 (조건 충족 시 지급)</option>
                      </select>
                    </label>
                    <label className="text-sm text-[#b6cbe2]">
                      자동 조건 유형
                      <select
                        disabled={titleForm.achievement_mode !== 'auto'}
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] disabled:cursor-not-allowed disabled:opacity-60"
                        value={titleForm.auto_condition_type}
                        onChange={(event) =>
                          setTitleForm((prev) => ({
                            ...prev,
                            auto_condition_type: event.target.value as TitleAutoConditionType,
                          }))
                        }
                      >
                        <option value="none">조건 선택</option>
                        <option value="card_issue_count">특정 칭찬카드 발급 횟수</option>
                        <option value="stat_threshold">특정 스탯 도달</option>
                      </select>
                    </label>
                  </div>

                  {titleForm.achievement_mode === 'auto' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {titleForm.auto_condition_type === 'card_issue_count' ? (
                        <label className="text-sm text-[#b6cbe2]">
                          기준 카드
                          <select
                            className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff]"
                            value={titleForm.condition_card_id}
                            onChange={(event) =>
                              setTitleForm((prev) => ({
                                ...prev,
                                condition_card_id: event.target.value,
                              }))
                            }
                          >
                            <option value="">카드 선택</option>
                            {cards
                              .filter((card) => card.card_type === 'praise')
                              .map((card) => (
                                <option key={card.id} value={card.id}>
                                  {card.title}
                                </option>
                              ))}
                          </select>
                        </label>
                      ) : (
                        <label className="text-sm text-[#b6cbe2]">
                          기준 스탯
                          <select
                            className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff]"
                            value={titleForm.condition_stat_key}
                            onChange={(event) =>
                              setTitleForm((prev) => ({
                                ...prev,
                                condition_stat_key: event.target.value,
                              }))
                            }
                          >
                            {missionStatOptions.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <label className="text-sm text-[#b6cbe2]">
                        목표값
                        <input
                          type="number"
                          min={1}
                          className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff]"
                          value={titleForm.condition_target_count}
                          onChange={(event) =>
                            setTitleForm((prev) => ({
                              ...prev,
                              condition_target_count: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  <label className="text-sm text-[#b6cbe2]">
                    칭호 설명
                    <textarea
                      className="mt-1 min-h-[84px] w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 py-2 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                      value={titleForm.description}
                      onChange={(event) => setTitleForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="칭호 설명을 입력하세요"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-[#b6cbe2]">
                      칭호 보상 EXP
                      <input
                        type="number"
                        min={0}
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                        value={titleForm.reward_exp}
                        onChange={(event) => setTitleForm((prev) => ({ ...prev, reward_exp: event.target.value }))}
                        placeholder="예: 40"
                      />
                    </label>
                    <label className="text-sm text-[#b6cbe2]">
                      칭호 보상 원
                      <input
                        type="number"
                        min={0}
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                        value={titleForm.reward_won}
                        onChange={(event) => setTitleForm((prev) => ({ ...prev, reward_won: event.target.value }))}
                        placeholder="예: 80"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#9fc9f3]">아이콘 선택</p>
                      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-[#34557c] bg-[#0c1f35]/60 p-2 sm:grid-cols-3 lg:grid-cols-4">
                        {titleIconPresets.map((preset) => {
                          const IconComponent = preset.icon
                          return (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => setTitleForm((prev) => ({ ...prev, icon_key: preset.key }))}
                              className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-semibold text-white ${
                                titleForm.icon_key === preset.key ? 'ring-2 ring-offset-1 ring-[#68b0ff]' : ''
                              } bg-gradient-to-r ${preset.className}`}
                            >
                              <IconComponent className="size-4" />
                              {preset.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#9fc9f3]">프레임 선택</p>
                      <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-[#34557c] bg-[#0c1f35]/60 p-2">
                        {titleFramePresets.map((frame) => (
                          <button
                            key={frame.key}
                            type="button"
                            onClick={() => setTitleForm((prev) => ({ ...prev, frame_key: frame.key }))}
                            className={`h-11 cursor-pointer rounded-lg border border-[#3f6189] bg-[#0f243d] text-sm font-medium text-[#dbe9fa] ${
                              titleForm.frame_key === frame.key ? 'ring-2 ring-[#68b0ff]' : ''
                            } ${frame.className}`}
                          >
                            {frame.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#4e6f96] bg-[#112844] text-sm font-medium text-[#b8d8fb] hover:bg-[#163357]">
                    <ImagePlus className="size-4" />
                    {uploadingTitleIcon ? '아이콘 업로드 중...' : '아이콘 직접 업로드'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          void handleUploadTitleIcon(file)
                        }
                      }}
                    />
                  </label>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="h-11 cursor-pointer border-[#486992] bg-[#102640] text-[#c8defa] hover:bg-[#17355b]" onClick={closeTitleEditorModal}>
                      취소
                    </Button>
                    <Button className="h-11 cursor-pointer bg-[#2f6ea8] text-white hover:bg-[#3c7eb9]" onClick={handleSubmitTitleForm} disabled={savingTitleForm || uploadingTitleIcon}>
                      {savingTitleForm ? '저장 중...' : editingTitle ? '수정 완료' : '칭호 만들기'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showTitleIssueModal && issuingTitle ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#03070dcc] p-4">
              <div className="modal-enter max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#3a5a82] bg-[linear-gradient(180deg,#0d1f34_0%,#0b1a2e_100%)] p-5 text-[#dce9f8] shadow-[0_20px_45px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-2xl font-semibold tracking-[0.07em] text-[#f2f7ff]">"{issuingTitle.title_name}" 칭호 발급</h3>
                    <p className="text-sm text-[#a7bfdc]">발급할 학생을 선택해 주세요.</p>
                  </div>
                  <button
                    type="button"
                    aria-label="닫기"
                    onClick={() => {
                      setShowTitleIssueModal(false)
                      setIssuingTitle(null)
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#4a6f9a] text-[#9ebee0] hover:bg-[#1b3557]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7f9ec2]" />
                    <input
                      className="h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] pl-10 pr-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                      placeholder="번호 또는 닉네임으로 검색..."
                      value={issueSearchKeyword}
                      onChange={(event) => setIssueSearchKeyword(event.target.value)}
                    />
                  </div>

                  <label className="text-xs text-[#a7bfdc]">
                    발급 사유 (선택)
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                      value={issueAwardReason}
                      onChange={(event) => setIssueAwardReason(event.target.value)}
                      placeholder="예: 4월 활동 우수"
                    />
                  </label>

                  <button
                    type="button"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#466992] bg-[#132d4d] px-3 text-sm font-semibold text-[#c0ddff]"
                    onClick={handleToggleSelectAllIssueStudents}
                  >
                    <Check className="size-4" />
                    {isAllFilteredStudentsSelected ? '전체 해제' : '전체 선택'}
                  </button>

                  <div className="grid max-h-[430px] grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-[#36567d] bg-[#0f243d]/80 p-2 md:grid-cols-2">
                    {filteredIssueStudents.map((student) => {
                      const isChecked = selectedIssueStudentIds.includes(student.id)
                      const hasRecipient = issueTitleRecipientIdSet.has(student.id)

                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleToggleIssueStudent(student.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors duration-200 ${
                            isChecked
                              ? 'border-[#61aef8] bg-[#18385f]'
                              : 'border-[#3f638d] bg-[#102742] hover:bg-[#163355]'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#eef5ff]">{student.student_number}번 {student.name}</p>
                            <p className="text-xs text-[#8ea9c9]">Lv.{student.level}</p>
                          </div>
                          <div className="text-right">
                            {hasRecipient ? <p className="text-[11px] text-[#b79cff]">기수상자</p> : null}
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${isChecked ? 'border-[#61aef8] bg-[#2e74bc] text-white' : 'border-[#58789f] bg-[#11233c] text-transparent'}`}>
                              <Check className="size-3" />
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {loadingTitleRecipients ? <p className="text-xs text-[#89a6c7]">수상자 정보 불러오는 중...</p> : null}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="h-11 cursor-pointer border-[#486992] bg-[#102640] text-[#c8defa] hover:bg-[#17355b]"
                      onClick={() => {
                        setShowTitleIssueModal(false)
                        setIssuingTitle(null)
                      }}
                    >
                      취소
                    </Button>
                    <Button className="h-11 cursor-pointer bg-[#2f6ea8] text-white hover:bg-[#3c7eb9]" onClick={handleSubmitIssue} disabled={submittingTitleIssue}>
                      {submittingTitleIssue ? '발급 중...' : '선택 완료'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
        </>
      ) : (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-3xl border border-[#2f4f77] bg-[linear-gradient(120deg,rgba(12,25,42,0.96),rgba(17,32,51,0.95))] shadow-[0_24px_60px_rgba(2,10,24,0.45)]">
            <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[0.95fr_1.25fr]">
              <div className="relative border-b border-[#2c4a6e] p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(86,173,255,0.18),transparent_42%),radial-gradient(circle_at_82%_80%,rgba(99,170,255,0.14),transparent_46%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec4f6]">Neo Hanyang Login</p>
                    <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[0.05em] text-[#eef5ff] sm:text-4xl">교사 · 학생 입장 포털</h1>
                    <p className="mt-3 text-sm text-[#a8bfd9]">첫 화면에서 바로 교사 로그인 또는 학생 PIN 로그인을 선택할 수 있습니다.</p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#35567d] bg-[#0d2139]/70 p-3">
                    <img
                      src="/images/neo-hanyang-logo.png"
                      alt="로그인 배경 이미지"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-[#34567c] bg-[#10253e]/90 p-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-[#e3efff]"><LogIn className="size-4" /> 교사 로그인</h2>
                    <input
                      className="h-11 w-full rounded-xl border border-[#4a6e99] bg-[#0c1f35] px-3 text-sm text-[#eaf2ff]"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="교사 이메일"
                    />
                    <input
                      className="h-11 w-full rounded-xl border border-[#4a6e99] bg-[#0c1f35] px-3 text-sm text-[#eaf2ff]"
                      placeholder="비밀번호"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <Button className="h-11 w-full cursor-pointer" onClick={handleAuthSubmit}>
                      교사 로그인
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8fb8df]">학생 로그인</p>
                    <h2 className="mt-1 font-heading text-2xl font-semibold text-[#eef5ff]">학생을 선택하고 PIN 입력</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {publicStudentItems.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleOpenStudentPinModal(student)}
                      className="group flex min-h-[128px] cursor-pointer flex-col justify-between rounded-xl border border-[#35557b] bg-[#122946]/85 p-3 text-left transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-[#64a9ef] hover:bg-[#17365c]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-md border border-[#4d7099] bg-[#17365b] px-2 py-0.5 text-[11px] text-[#b8d6f4]">{student.student_number}번</span>
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#4c709a] bg-[#0c1d31]">
                          {student.avatar_url ? (
                            <img src={student.avatar_url} alt={`${student.name} 아바타`} className="h-full w-full object-cover" />
                          ) : (
                            <UserRound className="size-4 text-[#86afda]" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-[#8fb2d6]">{student.title || '칭호 없음'}</p>
                        <p className="truncate font-semibold text-[#edf5ff]">{student.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {pickerPopup && authUser ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#03070dcc] p-4 backdrop-blur-[2px]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.3),rgba(59,130,246,0.08),transparent_68%)] blur-2xl" />
            <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/35" />
          </div>
          <div className="modal-enter relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d7c7ff] bg-white p-6 shadow-[0_24px_50px_rgba(20,12,52,0.32)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.25),transparent_70%)] blur-2xl" />
              <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.2),transparent_70%)] blur-2xl" />
            </div>
            <p className="relative text-center text-3xl font-semibold text-[#7c3aed]">
              {pickerPopup.mode === 'single' ? '학생 선택 완료' : pickerPopup.mode === 'multi' ? '다중 뽑기 결과' : '팀 편성 결과'}
            </p>

            {pickerPopup.mode === 'single' && latestSingleDraw ? (
              <div className="modal-enter mt-6 flex flex-col items-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#e5d7ff] bg-[#f6f2ff]">
                  {latestSingleDraw.student.avatar_url ? (
                    <img src={latestSingleDraw.student.avatar_url} alt={`${latestSingleDraw.student.name} 아바타`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#5b3eb9]">{latestSingleDraw.student.name.slice(0, 2)}</span>
                  )}
                </div>
                <div className="mt-3 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1 text-sm font-semibold text-[#065f46]">
                  잘했어요 보상: EXP +10 · 골드 +10
                </div>
                <p className="mt-3 text-5xl font-bold text-[#1e293b]">{latestSingleDraw.student.name}</p>
                <p className="mt-1 text-lg text-[#64748b]">{latestSingleDraw.student.student_number}번 · {latestSingleDraw.drawOrder}번째로 뽑힌 학생</p>
              </div>
            ) : null}

            {pickerPopup.mode === 'multi' ? (
              <div className="modal-enter mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {pickerPopup.drawnStudents.map((result) => (
                  <div key={`${result.student.id}-${result.drawOrder}`} className="rounded-xl border border-[#dce8f6] bg-[#f8fbff] px-3 py-2">
                    <p className="text-xs text-[#56779c]">{result.drawOrder}번째</p>
                    <p className="text-base font-semibold text-[#1c3f67]">{result.student.student_number}번 {result.student.name}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {pickerPopup.mode === 'team' ? (
              <div className="modal-enter mt-5 rounded-xl border border-[#dce8f6] bg-[#f8fbff] p-3">
                <p className="mb-2 text-sm font-semibold text-[#264b76]">{pickerPopup.teamCount}팀 편성 결과</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {pickerPopup.teamBuckets.map((bucket) => (
                    <div key={bucket.teamNumber} className="rounded-lg border border-[#d5e3f3] bg-white p-2">
                      <p className="text-sm font-semibold text-[#1e3a8a]">{bucket.teamNumber}팀</p>
                      <p className="mt-1 text-xs text-[#56779c]">{bucket.students.map((student) => `${student.student_number}번 ${student.name}`).join(', ') || '배정 없음'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPickerPopup(null)}
                className="h-11 cursor-pointer rounded-xl border border-[#d7e3f2] bg-[#f8fbff] px-5 text-sm font-semibold text-[#35597f] hover:bg-[#eef5ff]"
              >
                확인
              </button>
              {pickerPopup.mode === 'single' && latestSingleDraw ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleGiveMiniPraise()
                  }}
                  className="h-11 cursor-pointer rounded-xl bg-[#10b981] px-5 text-sm font-semibold text-white hover:bg-[#059669]"
                >
                  잘했어요
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setPickerPopup(null)
                  if (pickerPopup.mode === 'team' && pickerPopup.teamCount) {
                    handleSplitTeams(pickerPopup.teamCount)
                    return
                  }
                  handleDrawStudents(1)
                }}
                disabled={remainingDrawStudents.length === 0 && pickerPopup.mode !== 'team'}
                className="h-11 cursor-pointer rounded-xl bg-[linear-gradient(90deg,#7c3aed_0%,#2563eb_100%)] px-5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pickerPopup.mode === 'team' ? '같은 팀 수로 다시 편성' : '계속 뽑기'}
              </button>
            </div>
            <p className="mt-4 text-center text-sm text-[#64748b]">남은 학생: {remainingDrawStudents.length}명</p>
          </div>
        </div>
      ) : null}

      {selectedStudentForPin ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#03070dcc] p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#3a5a82] bg-[linear-gradient(180deg,#0d1f34_0%,#0b1a2e_100%)] p-5 text-[#dce9f8] shadow-[0_20px_45px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#8eb4d8]">학생 PIN 로그인</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedStudentForPin.student_number}번 {selectedStudentForPin.name}</p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSelectedStudentForPin(null)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#4a6f9a] text-[#9ebee0] hover:bg-[#1b3557]"
              >
                <X className="size-4" />
              </button>
            </div>
            <input
              className="h-11 w-full rounded-xl border border-[#4a6e99] bg-[#0c1f35] px-3 text-sm text-[#eaf2ff]"
              placeholder="PIN 번호"
              type="password"
              value={studentPinCode}
              onChange={(event) => setStudentPinCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleStudentPinSubmit()
                }
              }}
            />
            {authError ? <p className="mt-2 text-sm text-[#ffb8c5]">{authError}</p> : null}
            <Button className="mt-3 h-11 w-full cursor-pointer" onClick={() => void handleStudentPinSubmit()} disabled={studentPinSubmitting}>
              {studentPinSubmitting ? '입장 중...' : '학생 페이지 입장'}
            </Button>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-border/70 bg-background py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="flex items-center gap-1"><BookOpen className="size-3.5" /> Enterprise Gateway 패턴 · AI-Native UI 적용</p>
          <p className="flex items-center gap-1"><Activity className="size-3.5" /> 학급 운영 / 문제 은행 / 레이드 실시간 동기화</p>
        </div>
      </footer>
    </div>
  )
}

export default App
