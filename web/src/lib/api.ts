import { getToken, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/lib/auth'
import type { AuthResult, AuthUser } from '@/lib/auth-types'

const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000'
    }
    return origin
  }

  return 'http://localhost:8000'
}

const API_BASE_URL = resolveApiBaseUrl()

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function apiRequest<T>(endpoint: string, method: HttpMethod, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || '요청 처리 중 오류가 발생했습니다.')
  }

  return (await response.json()) as T
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, 'POST', body),
  patch: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, 'PATCH', body),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
}

interface StudentLoginResponsePayload {
  token: string
  user: AuthUser
}

export async function signInStudent(studentId: number, pinCode: string): Promise<AuthResult> {
  const endpoint = '/classroom/public/student-login'

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        pin_code: pinCode,
      }),
    })
  } catch {
    return {
      success: false,
      error: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  if (!response.ok) {
    let errorMessage = '학생 번호 또는 PIN이 올바르지 않습니다.'
    try {
      const errorData = (await response.json()) as { detail?: string }
      if (typeof errorData.detail === 'string' && errorData.detail.trim()) {
        errorMessage = errorData.detail
      }
    } catch {
      const fallbackMessage = await response.text()
      if (fallbackMessage.trim()) {
        errorMessage = fallbackMessage
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }

  const payload = (await response.json()) as StudentLoginResponsePayload
  if (!payload.token || !payload.user) {
    return {
      success: false,
      error: '학생 로그인 응답이 올바르지 않습니다.',
    }
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, payload.token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user))

  return {
    success: true,
    token: payload.token,
  }
}

export interface Student {
  id: number
  student_number: number
  name: string
  access_code: string
  character_class: string
  level: number
  grade_tier: string
  badge_tier: string
  title: string
  role_name: string | null
  avatar_url: string | null
  class_points: number
  attack_power: number
  defense_power: number
  support_power: number
  wisdom: number
  creativity: number
  personality: number
  vitality: number
  diligence: number
  communication: number
}

export interface ClassroomOverview {
  total_students: number
  active_students: number
  average_level: number
  total_points: number
  total_questions: number
  active_raid_id: number | null
}

export interface ShopItem {
  id: number
  name: string
  category: string
  rarity: string
  description: string | null
  cost_points: number
  stock: number
  is_active: boolean
}

export interface QuestionItem {
  id: number
  subject: string
  unit_name: string | null
  prompt: string
  answer: string
  difficulty: string
  bonus_attack: number
}

export interface RaidSession {
  id: number
  title: string
  boss_name: string
  boss_max_hp: number
  boss_current_hp: number
  class_max_hp: number
  class_current_hp: number
  status: 'scheduled' | 'active' | 'paused' | 'completed'
}

export interface RaidAction {
  id: number
  raid_session_id: number
  student_id: number | null
  actor_name: string
  action_type: string
  damage: number
  healing: number
  message: string
  created_at: string
}

export interface StudentPortalSnapshot {
  student: Student
  active_raid: RaidSession | null
}

export interface UploadContract {
  upload_url: string
  method: 'PUT'
  object_key: string
  original_filename: string
  public_url: string
  headers: Record<string, string>
}

export interface StudentStat {
  key: string
  value: number
}

export interface StudentLoginAccount {
  id: number
  student_number: number
  nickname: string
  pin_code: string
}

export interface PublicStudentLoginItem {
  id: number
  student_number: number
  name: string
  title: string
  avatar_url: string | null
}

export interface StudentEconomy {
  won: number
  nyang: number
  core: number
  starlight_shard: number
  total_exp: number
  current_exp: number
  max_exp: number
}

export interface StudentEconomyUpdatePayload {
  total_exp?: number
  won_balance?: number
  nyang_balance?: number
  core_balance?: number
  starlight_shard_balance?: number
  wisdom?: number
  creativity?: number
  personality?: number
  vitality?: number
  diligence?: number
  communication?: number
}

export interface StudentActivity {
  id: number
  student_id: number
  activity_type: string
  category: string
  log_type: 'mission' | 'praise_card' | 'warning_card' | 'title' | 'raid' | string
  title: string
  description: string | null
  reward_won: number
  reward_nyang: number
  created_at: string
}

export interface TitleDefinition {
  id: number
  title_name: string
  description: string | null
  condition_text: string
  icon_key: string | null
  frame_key: string | null
  icon_public_url: string | null
  icon_object_key: string | null
  icon_original_filename: string | null
  icon_content_type: string | null
  reward_exp: number
  reward_won: number
  is_active: boolean
  recipient_count: number
  created_at: string
  updated_at: string
}

export interface StudentTitleRecipient {
  student_id: number
  student_number: number
  student_name: string
  level: number
}

export interface TitleIssueResult {
  title_definition_id: number
  issued_count: number
  skipped_student_ids: number[]
}

export interface MissionAchiever {
  student_id: number
  student_number: number
  student_name: string
  completion_count: number
  weekly_completion_count: number
  last_achieved_at: string
}

export interface MissionItem {
  id: number
  title: string
  description: string | null
  icon_key: string
  target_stat_key: string
  target_stat_label: string
  reward_exp: number
  reward_won: number
  reward_nyang: number
  repeatable: boolean
  weekly_reset: boolean
  goal_count: number
  is_active: boolean
  total_completion_count: number
  weekly_completion_count: number
  achiever_count: number
  progress_percent: number
  created_at: string
  updated_at: string
  closed_at: string | null
  achievers: MissionAchiever[]
}

export interface MissionCreatePayload {
  title: string
  description?: string | null
  icon_key: string
  target_stat_key: string
  target_stat_label: string
  reward_exp: number
  reward_won: number
  reward_nyang: number
  repeatable: boolean
  weekly_reset: boolean
  goal_count: number
}

export interface MissionUpdatePayload {
  title?: string
  description?: string | null
  icon_key?: string
  target_stat_key?: string
  target_stat_label?: string
  reward_exp?: number
  reward_won?: number
  reward_nyang?: number
  repeatable?: boolean
  weekly_reset?: boolean
  goal_count?: number
  is_active?: boolean
}

export interface MissionAchieverUpdateResult {
  mission_id: number
  updated_count: number
  skipped_student_ids: number[]
}

export interface CardStatChange {
  stat_key: string
  stat_label: string
  delta: number
}

export interface ClassroomCard {
  id: number
  card_type: 'praise' | 'warning'
  title: string
  description: string | null
  icon_key: string
  category: string
  reward_exp: number
  reward_won: number
  reward_nyang: number
  level_delta: number
  stat_changes: CardStatChange[]
  is_active: boolean
  recipient_count: number
  total_issued: number
  created_at: string
  updated_at: string
}

export interface ClassroomCardCreatePayload {
  card_type: 'praise' | 'warning'
  title: string
  description?: string | null
  icon_key: string
  category: string
  reward_exp: number
  reward_won: number
  reward_nyang: number
  level_delta: number
  stat_changes: CardStatChange[]
}

export interface ClassroomCardUpdatePayload {
  title?: string
  description?: string | null
  icon_key?: string
  category?: string
  reward_exp?: number
  reward_won?: number
  reward_nyang?: number
  level_delta?: number
  stat_changes?: CardStatChange[]
  is_active?: boolean
}

export interface ClassroomCardIssuePayload {
  student_ids: number[]
  issued_note?: string | null
}

export interface ClassroomCardIssueResult {
  card_id: number
  issued_count: number
  skipped_student_ids: number[]
}

export interface ClassroomCardRecipient {
  student_id: number
  student_number: number
  student_name: string
  issued_count: number
}

export interface ClassroomCardIssueHistory {
  issue_id: number
  card_id: number
  student_id: number
  student_number: number
  student_name: string
  issued_note: string | null
  issued_at: string
}

export interface ClassroomCardHistoryResponse {
  card_id: number
  recipients: ClassroomCardRecipient[]
  history: ClassroomCardIssueHistory[]
}

export interface StudentEarnedTitle {
  id: number
  student_id: number
  title_definition_id: number
  title_name: string
  description: string | null
  condition_text: string
  icon_key: string | null
  frame_key: string | null
  icon_public_url: string | null
  awarded_reason: string | null
  awarded_at: string
  is_selected: boolean
}

export interface StudentAvatarItem {
  id: number
  student_id: number
  slot: string
  name: string
  rarity: string
  image_url: string | null
  bonus_diligence: number
  bonus_stamina: number
  bonus_intellect: number
  bonus_communication: number
  bonus_personality: number
  bonus_leadership: number
  is_owned: boolean
  is_equipped: boolean
  obtained_at: string
}

export interface StudentPhotoAsset {
  id: number
  student_id: number
  public_url: string
  object_key: string
  original_filename: string
  content_type: string | null
  created_at: string
}

export interface StudentDetail {
  student: Student
  stats: StudentStat[]
  economy: StudentEconomy
  activities: StudentActivity[]
  avatars: StudentAvatarItem[]
  photos: StudentPhotoAsset[]
  available_titles: TitleDefinition[]
  earned_titles: StudentEarnedTitle[]
  can_manage_economy: boolean
}
