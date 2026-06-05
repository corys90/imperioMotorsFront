export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginUser {
  id: number
  username?: string
  name: string
  email: string
}

export interface AuthSuccessResponse {
  success: true
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: LoginUser
}

export interface AuthErrorResponse {
  success: false
  message?: string
  mensaje?: string
}

export type LoginResponse = AuthSuccessResponse | AuthErrorResponse

export interface StoredAuthSession {
  success: boolean
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: LoginUser
}

const AUTH_STORAGE_KEY = 'prjmotors.auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`
//const apiBaseUrl = `http://${window.location.hostname}:8000`

function getStorage(remember = false): Storage | null {
  if (typeof window === 'undefined') return null
  return remember ? window.localStorage : window.sessionStorage
}

function parseStoredSession(value: string | null): StoredAuthSession | null {
  if (!value) return null

  try {
    const session = JSON.parse(value) as StoredAuthSession
    if (!session?.accessToken || !session?.refreshToken || !session?.user) return null
    return session
  } catch {
    return null
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error de autenticacion')
  }

  return response.json()
}

export async function refreshToken(refreshTokenValue: string): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshTokenValue })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'No se pudo renovar la sesion')
  }

  return response.json()
}

export function toStoredAuthSession(response: AuthSuccessResponse): StoredAuthSession {
  return {
    success: response.success,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    expiresIn: response.expires_in,
    user: response.user
  }
}

export function saveAuthSession(response: AuthSuccessResponse, remember = false): StoredAuthSession {
  const session = toStoredAuthSession(response)
  clearAuthSession()
  getStorage(remember)?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function getStoredAuthSession(): StoredAuthSession | null {
  return parseStoredSession(getStorage(true)?.getItem(AUTH_STORAGE_KEY) ?? null)
    ?? parseStoredSession(getStorage(false)?.getItem(AUTH_STORAGE_KEY) ?? null)
}

export function clearAuthSession(): void {
  getStorage(true)?.removeItem(AUTH_STORAGE_KEY)
  getStorage(false)?.removeItem(AUTH_STORAGE_KEY)
}
