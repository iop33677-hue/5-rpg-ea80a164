/**
 * Neon Auth Client (Web) - CANONICAL SCAFFOLD
 *
 * CRITICAL: Neon Auth returns HTTP 500 when `credentials: 'include'` is used
 * in cross-origin auth requests.
 *
 * Workaround:
 * - Use direct fetch() with `credentials: 'omit'`
 * - Store the returned token (opaque session token) and user in localStorage
 *
 * NOTE:
 * - Backend APIs validate this session token via DB lookup (neon_auth.session).
 */

const VITE_NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL
const neonAuthUrlSource = import.meta.env.VITE_NEON_AUTH_URL
  ? 'import.meta.env.VITE_NEON_AUTH_URL'
  : 'missing'

console.info('[NeonAuthWeb] Runtime auth config', {
  source: neonAuthUrlSource,
  neonAuthUrl: VITE_NEON_AUTH_URL,
  hasViteValue: Boolean(import.meta.env.VITE_NEON_AUTH_URL),
})

export const TOKEN_STORAGE_KEY = 'neon_auth_token'
export const USER_STORAGE_KEY = 'neon_auth_user'

export interface User {
  id: string
  email: string
  name?: string
  emailVerified?: boolean
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

function requireAuthUrl(): string {
  if (!VITE_NEON_AUTH_URL) {
    console.error('[NeonAuthWeb] auth URL missing', {
      source: neonAuthUrlSource,
      hasViteValue: Boolean(import.meta.env.VITE_NEON_AUTH_URL),
    })
    throw new Error('VITE_NEON_AUTH_URL is not set. Authentication will not work.')
  }
  return VITE_NEON_AUTH_URL
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getCurrentUser(): User | null {
  // Treat token as the source of truth for whether a session exists.
  // This prevents "half-authenticated" states (e.g. user stored without a token).
  if (!getToken()) return null

  const userJson = localStorage.getItem(USER_STORAGE_KEY)
  if (!userJson) return null
  try {
    return JSON.parse(userJson)
  } catch {
    return null
  }
}

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    const authUrl = requireAuthUrl()
    console.info('[NeonAuthWeb] signUp request starting', {
      url: `${authUrl}/sign-up/email`,
      source: neonAuthUrlSource,
    })

    const response = await fetch(`${authUrl}/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', // CRITICAL: include causes 500
      body: JSON.stringify({
        email,
        password,
        // Neon Auth API requires `name` in the sign-up payload.
        // We still defensively default to the email prefix.
        name: name.trim() || email.split('@')[0],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[NeonAuthWeb] signUp failed', {
        status: response.status,
        errorText,
      })
      return { success: false, error: errorText || `Sign up failed: ${response.status}` }
    }

    const data = await response.json()
    console.info('[NeonAuthWeb] signUp response received', {
      status: response.status,
      hasToken: Boolean(data?.token),
      hasUser: Boolean(data?.user),
    })

    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      if (data.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } else {
      // Some configurations require email verification before a session is issued.
      // Ensure we don't persist a "logged in" user without a token.
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    return { success: true, user: data.user, token: data.token }
  } catch (error) {
    console.error('[NeonAuthWeb] signUp request error', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const authUrl = requireAuthUrl()
    console.info('[NeonAuthWeb] signIn request starting', {
      url: `${authUrl}/sign-in/email`,
      source: neonAuthUrlSource,
    })

    const response = await fetch(`${authUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', // CRITICAL: include causes 500
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[NeonAuthWeb] signIn failed', {
        status: response.status,
        errorText,
      })
      return { success: false, error: errorText || 'Invalid email or password' }
    }

    const data = await response.json()
    console.info('[NeonAuthWeb] signIn response received', {
      status: response.status,
      hasToken: Boolean(data?.token),
      hasUser: Boolean(data?.user),
    })

    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      if (data.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } else {
      // Defensive: avoid persisting user data if no session token was issued.
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    return { success: true, user: data.user, token: data.token }
  } catch (error) {
    console.error('[NeonAuthWeb] signIn request error', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' }
  }
}

export async function signOut(): Promise<void> {
  try {
    const authUrl = requireAuthUrl()
    console.info('[NeonAuthWeb] signOut request starting', {
      url: `${authUrl}/sign-out`,
      source: neonAuthUrlSource,
    })

    // Better Auth requires a non-empty JSON body.
    await fetch(`${authUrl}/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: '{}',
    })
  } catch {
    // Ignore network errors - we still clear local state.
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}
