export interface ParsedQuestionRow {
  subject: string
  unit_name: string | null
  prompt: string
  answer: string
  difficulty: string
  bonus_attack: number
}

export interface AiDungeonFormState {
  grade: string
  semester: string
  subject: string
  unit: string
  count: number
  difficulty: string
}

export interface QuizMonsterAsset {
  public_url: string
  object_key: string
  original_filename: string
  content_type: string
}
