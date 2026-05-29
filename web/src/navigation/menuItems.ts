import {
  BadgePlus,
  ClipboardCheck,
  Compass,
  FileSpreadsheet,
  House,
  Landmark,
  LibraryBig,
  LogIn,
  Medal,
  NotebookPen,
  ScrollText,
  Settings2,
  ShoppingBag,
  Star,
  Store,
  Sword,
  Users,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MenuSection = '학급 운영' | '학습 확장' | '상점 및 관리'

export interface SidebarMenuItem {
  label: string
  icon: LucideIcon
  section: MenuSection
}

export const menuSections: MenuSection[] = ['학급 운영', '학습 확장', '상점 및 관리']

export const sidebarMenuItems: SidebarMenuItem[] = [
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
