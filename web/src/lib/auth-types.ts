export interface AuthUser {
  id: string
  email: string | null
  name?: string
  emailVerified?: boolean
  role?: string
  student_id?: number
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  token?: string
  error?: string
}
