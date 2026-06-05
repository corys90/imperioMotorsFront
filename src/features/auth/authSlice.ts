import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getStoredAuthSession } from '../../services/authService'
import type { StoredAuthSession } from '../../services/authService'

interface User {
  id: number
  username?: string
  name: string
  email: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  tokenType: string | null
  expiresIn: number | null
  loading: boolean
  error: string | null
}

const storedSession = getStoredAuthSession()

const initialState: AuthState = {
  isAuthenticated: Boolean(storedSession),
  user: storedSession?.user ?? null,
  accessToken: storedSession?.accessToken ?? null,
  refreshToken: storedSession?.refreshToken ?? null,
  tokenType: storedSession?.tokenType ?? null,
  expiresIn: storedSession?.expiresIn ?? null,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true
      state.error = null
    },
    loginSuccess(state, action: PayloadAction<StoredAuthSession>) {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.tokenType = action.payload.tokenType
      state.expiresIn = action.payload.expiresIn
      state.error = null
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false
      state.isAuthenticated = false
      state.error = action.payload
    },
    logout(state) {
      state.isAuthenticated = false
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.tokenType = null
      state.expiresIn = null
      state.error = null
    }
  }
})

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions
export default authSlice.reducer
