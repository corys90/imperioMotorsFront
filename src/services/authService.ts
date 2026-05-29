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

export interface LoginResponse {
  success: boolean
  user?: LoginUser
  message?: string
  mensaje?: string
}


const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })

  return response.json()
}
