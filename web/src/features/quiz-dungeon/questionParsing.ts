import * as XLSX from 'xlsx'

import type { QuestionChoice } from '@/lib/api'
import type { AiDungeonFormState, ParsedQuestionRow } from './types'

export const choiceKeys: QuestionChoice['key'][] = ['A', 'B', 'C', 'D']

export function buildPromptWithChoices(prompt: string, choices: Partial<Record<QuestionChoice['key'], string>>): string {
  const filledChoices = choiceKeys
    .map((key) => ({ key, text: choices[key]?.trim() ?? '' }))
    .filter((choice) => choice.text.length > 0)

  if (filledChoices.length === 0) {
    return prompt
  }

  const choiceLines = filledChoices.map((choice) => `${choice.key}. ${choice.text}`).join('\n')
  return `${prompt.trim()}\n\n[선택지]\n${choiceLines}`
}

export function parseQuestionChoices(prompt: string): { cleanPrompt: string; choices: QuestionChoice[] } {
  const lines = prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const choices: QuestionChoice[] = []
  const promptLines: string[] = []

  for (const line of lines) {
    if (line === '[선택지]') {
      continue
    }

    const match = line.match(/^([A-Da-d]|[①②③④]|[1-4])[\).\s、:：-]+(.+)$/)
    if (!match) {
      promptLines.push(line)
      continue
    }

    const rawKey = match[1]
    const text = match[2]?.trim() ?? ''
    const key = rawKey === '①' || rawKey === '1' ? 'A'
      : rawKey === '②' || rawKey === '2' ? 'B'
        : rawKey === '③' || rawKey === '3' ? 'C'
          : rawKey === '④' || rawKey === '4' ? 'D'
            : rawKey.toUpperCase() as QuestionChoice['key']

    if (text.length > 0 && !choices.some((choice) => choice.key === key)) {
      choices.push({ key, text })
    }
  }

  return {
    cleanPrompt: promptLines.join('\n').trim() || prompt,
    choices: choices.sort((a, b) => choiceKeys.indexOf(a.key) - choiceKeys.indexOf(b.key)),
  }
}

export function normalizeChoiceAnswer(answer: string): string {
  const normalized = answer.trim()
  if (/^[A-Da-d]$/.test(normalized)) {
    return normalized.toUpperCase()
  }
  if (normalized === '①' || normalized === '1') return 'A'
  if (normalized === '②' || normalized === '2') return 'B'
  if (normalized === '③' || normalized === '3') return 'C'
  if (normalized === '④' || normalized === '4') return 'D'
  return normalized
}

export function getStudentAccessCodeFromStoredToken(): string {
  if (typeof window === 'undefined') return ''
  const token = window.localStorage.getItem('neon_auth_token') ?? ''
  const parts = token.split(':')
  return parts[0] === 'student' && parts.length >= 3 ? parts[2] : ''
}

export function createAiAssistedDungeonQuestions(form: AiDungeonFormState): ParsedQuestionRow[] {
  const count = Math.max(1, Math.min(10, Number(form.count) || 4))
  const subject = form.subject.trim() || '통합'
  const unit = form.unit.trim() || '핵심 개념'
  const gradeSemester = `${form.grade.trim() || '초등'} ${form.semester.trim() || '1학기'}`

  return Array.from({ length: count }, (_, index) => {
    const key = choiceKeys[index % choiceKeys.length]
    const concept = `${unit} ${index + 1}번 개념`
    const choices: Partial<Record<QuestionChoice['key'], string>> = {
      A: `${concept}의 핵심 정의`,
      B: `${concept}와 관련 없는 설명`,
      C: `${concept}의 반대 개념`,
      D: `${concept}를 적용할 수 없는 예시`,
    }
    choices[key] = `${concept}을 가장 정확히 설명한 내용`

    return {
      subject,
      unit_name: `${gradeSemester} · ${unit}`,
      prompt: buildPromptWithChoices(`${subject} ${unit} 단원의 내용으로 옳은 것을 고르세요. (${index + 1})`, choices),
      answer: key,
      difficulty: form.difficulty || '보통',
      bonus_attack: form.difficulty === '어려움' ? 15 : form.difficulty === '쉬움' ? 5 : 10,
    }
  })
}

export function parseCsvRows(content: string): ParsedQuestionRow[] {
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

    const rawPrompt = getValue(['prompt', 'question', '문제'])
    const choices = {
      A: getValue(['choice_a', 'a', '선택지a', '보기a']),
      B: getValue(['choice_b', 'b', '선택지b', '보기b']),
      C: getValue(['choice_c', 'c', '선택지c', '보기c']),
      D: getValue(['choice_d', 'd', '선택지d', '보기d']),
    }

    return {
      subject: getValue(['subject', '과목']) || '일반',
      unit_name: getValue(['unit', 'unit_name', '단원']) || null,
      prompt: buildPromptWithChoices(rawPrompt, choices),
      answer: normalizeChoiceAnswer(getValue(['correct_choice', 'answer', '정답', '정답선택지']) || '미입력'),
      difficulty: getValue(['difficulty', '난이도']) || '보통',
      bonus_attack: Number(getValue(['bonus_attack', 'attack', '보너스공격력']) || 5),
    }
  })
}

export function parseXlsxRows(data: ArrayBuffer): ParsedQuestionRow[] {
  const workbook = XLSX.read(data)
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, { defval: '' })

  return rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), String(value ?? '').trim()]),
    )

    const choices = {
      A: normalized.choice_a || normalized.a || normalized['선택지a'] || normalized['보기a'],
      B: normalized.choice_b || normalized.b || normalized['선택지b'] || normalized['보기b'],
      C: normalized.choice_c || normalized.c || normalized['선택지c'] || normalized['보기c'],
      D: normalized.choice_d || normalized.d || normalized['선택지d'] || normalized['보기d'],
    }

    return {
      subject: normalized.subject || normalized['과목'] || '일반',
      unit_name: normalized.unit || normalized.unit_name || normalized['단원'] || null,
      prompt: buildPromptWithChoices(normalized.prompt || normalized.question || normalized['문제'] || '', choices),
      answer: normalizeChoiceAnswer(normalized.correct_choice || normalized.answer || normalized['정답선택지'] || normalized['정답'] || '미입력'),
      difficulty: normalized.difficulty || normalized['난이도'] || '보통',
      bonus_attack: Number(normalized.bonus_attack || normalized['보너스공격력'] || '5'),
    }
  })
}
