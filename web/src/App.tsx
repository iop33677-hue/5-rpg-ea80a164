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
  Coins,
  Compass,
  Crown,
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
  Pencil,
  Rocket,
  ScrollText,
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
  Users,
  WandSparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentUser, signIn, signOut, signUp, type User } from '@/lib/auth'
import { signInStudent } from '@/lib/api'
import {
  api,
  type ClassroomCard,
  type ClassroomCardCreatePayload,
  type ClassroomCardHistoryResponse,
  type ClassroomCardIssueResult,
  type ClassroomCardUpdatePayload,
  type ClassroomOverview,
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
  type StudentLoginAccount,
  type StudentTitleRecipient,
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

const sidebarMenuItems: SidebarMenuItem[] = [
  { label: '학생 목록', icon: Users, section: '학급 운영' },
  { label: '미션', icon: ScrollText, section: '학급 운영' },
  { label: '칭찬/주의 카드', icon: BadgePlus, section: '학급 운영' },
  { label: '칭호', icon: Medal, section: '학급 운영' },
  { label: '클래스 툴', icon: Wrench, section: '학급 운영' },
  { label: '학생 로그인', icon: LogIn, section: '학급 운영' },
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

function App() {
  const [authUser, setAuthUser] = useState<User | null>(getCurrentUser())
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('teacher@arcaneclass.quest')
  const [password, setPassword] = useState('ClassQuest123!')
  const [name, setName] = useState('')
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
  const sidebarItems = isStudentSession
    ? sidebarMenuItems.filter((item) => item.label !== '학생 로그인')
    : sidebarMenuItems

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
      const [overviewData, studentData, loginAccountData, shopData, questionData, raidData, titleData, missionData, cardData] =
        await Promise.all([
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
    if (!authUser) {
      return
    }
    void refreshTeacherData()
  }, [authUser, sortBy])

  useEffect(() => {
    if (isStudentSession && studentSessionId && students.length > 0 && !studentDetail) {
      const ownStudent = students.find((student) => student.id === studentSessionId)
      if (ownStudent) {
        setActiveMenu('학생 목록')
        void handleOpenStudentDetail(ownStudent.id)
      }
    }
  }, [isStudentSession, studentSessionId, students, studentDetail])

  useEffect(() => {
    if (isStudentSession && activeMenu === '학생 로그인') {
      setActiveMenu('학생 목록')
    }
  }, [isStudentSession, activeMenu])


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
    }
  }, [])

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
    const result =
      authMode === 'signin' ? await signIn(email, password) : await signUp(email, password, name)

    if (!result.success) {
      setAuthError(result.error ?? '로그인에 실패했습니다.')
      return
    }

    setAuthUser(getCurrentUser())
    if (authMode === 'signin' && result.token) {
      window.location.href = '/dashboard'
    }
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
              aria-label="뒤로가기"
              onClick={() => window.history.back()}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#456592] bg-[#173256]/75 transition-colors duration-200 hover:bg-[#214877]"
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
                              onClick={() => setActiveMenu(item.label)}
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
                      <div className="rounded-xl border border-[#d8cef4] bg-[#f3eeff] px-3.5 py-2.5">
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
                        <p className="text-sm text-[#4a678a]">미션/카드 탭과 맞춘 톤으로 칭호 생성, 조건 관리, 학생 발급을 통합합니다.</p>
                      </div>
                      {canManageClassContent ? (
                        <Button className="h-11 cursor-pointer transition-all duration-[220ms] hover:-translate-y-0.5" onClick={openCreateTitleModal}>
                          + 새 칭호 만들기
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {titleTabError ? (
                    <div className="rounded-xl border border-[#934b58] bg-[#3a1e28]/90 px-4 py-3 text-sm text-[#ffd4da]">{titleTabError}</div>
                  ) : null}
                  {titleTabMessage ? (
                    <div className="rounded-xl border border-[#3f7a66] bg-[#15362d]/90 px-4 py-3 text-sm text-[#cbf4df]">{titleTabMessage}</div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {classTitles.map((title) => {
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
                              <Button className="h-10 flex-1 cursor-pointer bg-[#244f85] text-white hover:bg-[#1f446f]" onClick={() => void handleOpenIssueModal(title)}>
                                <Gift className="mr-1 size-4" /> 발급
                              </Button>
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

              {!['학생 목록', '미션', '칭찬/주의 카드', '문제 던전', '던전 탐험', '칭호', '학생 로그인'].includes(activeMenu) ? (
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
                      획득 조건 *
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[#426186] bg-[#0d2139] px-3 text-sm text-[#e3efff] placeholder:text-[#6f8cab]"
                        value={titleForm.condition_text}
                        onChange={(event) => setTitleForm((prev) => ({ ...prev, condition_text: event.target.value }))}
                        placeholder="예: 미션 10회 완료"
                      />
                    </label>
                  </div>

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
                    <img src="/images/neo-hanyang-logo.png" alt="네오 한양 로고" className="h-full w-full object-contain" />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-[#34567c] bg-[#10253e]/90 p-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-[#e3efff]"><LogIn className="size-4" /> 교사 로그인</h2>
                    {authMode === 'signup' ? (
                      <input
                        className="h-11 w-full rounded-xl border border-[#4a6e99] bg-[#0c1f35] px-3 text-sm text-[#eaf2ff]"
                        placeholder="이름"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    ) : null}
                    <input
                      className="h-11 w-full rounded-xl border border-[#4a6e99] bg-[#0c1f35] px-3 text-sm text-[#eaf2ff]"
                      placeholder="이메일"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <input
                      className="h-11 w-full rounded-xl border border-[#4a6e99] bg-[#0c1f35] px-3 text-sm text-[#eaf2ff]"
                      placeholder="비밀번호"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <Button className="h-11 w-full cursor-pointer" onClick={handleAuthSubmit}>
                      {authMode === 'signin' ? '교사 로그인' : '교사 계정 생성'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-11 w-full cursor-pointer text-[#c5dbf5] hover:bg-[#1b395f] hover:text-white"
                      onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    >
                      {authMode === 'signin' ? '계정이 없으면 가입하기' : '이미 계정이 있습니다'}
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
