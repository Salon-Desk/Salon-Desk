import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  clearClientAuthSession,
  getClientAuthToken,
  getClientAuthUser,
  saveClientAuthSession,
} from '@/lib/authSession'
import { authApi } from '@/store/slice/authApi'
import type { User, UserRole } from '@/types/user'

export type AppPortal = 'client' | 'merchant' | 'admin'

export interface UserState {
  user: User | null
  token: string | null
  organizationId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  activeApp: AppPortal
  didLogout: boolean
}

const initialToken = typeof window !== 'undefined' ? getClientAuthToken() : null
const initialUser = typeof window !== 'undefined' ? getClientAuthUser() : null

const initialState: UserState = {
  user: initialUser,
  token: initialToken,
  organizationId: initialUser?.org_id ?? null,
  isAuthenticated: Boolean(initialToken),
  isLoading: false,
  activeApp: 'client',
  didLogout: false,
}

/**
 * Restore auth session from stored token and refresh current user details
 */
export const fetchAuthData = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/fetchAuthData',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = getClientAuthToken()
      if (!token) {
        return null
      }

      const result = await dispatch(
        authApi.endpoints.me.initiate(undefined, { forceRefetch: true }),
      ).unwrap()

      const fullUser: User = {
        ...result.user,
        profile: result.profile ?? result.user.profile ?? null,
        first_name:
          result.profile?.first_name || (result.user as { first_name?: string }).first_name || '',
        last_name:
          result.profile?.last_name || (result.user as { last_name?: string }).last_name || '',
      }

      saveClientAuthSession(token, fullUser)
      return fullUser
    } catch (err: unknown) {
      clearClientAuthSession()
      const errorMsg =
        (err as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (err as { message?: string })?.message ||
        'Session expired'
      return rejectWithValue(errorMsg)
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthData: (
      state,
      action: PayloadAction<{ user: User; access_token: string; organization_id?: string }>,
    ) => {
      const { user, access_token, organization_id } = action.payload
      state.user = user
      state.token = access_token
      state.organizationId = organization_id || user.org_id || null
      state.isAuthenticated = true
      state.isLoading = false
      state.didLogout = false

      saveClientAuthSession(access_token, user, state.activeApp)
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.organizationId = action.payload.org_id ?? state.organizationId
      state.isAuthenticated = true
      state.isLoading = false
      state.didLogout = false

      if (state.token) {
        saveClientAuthSession(state.token, action.payload, state.activeApp)
      }
    },

    setActiveApp: (state, action: PayloadAction<AppPortal>) => {
      state.activeApp = action.payload
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    logout: (state) => {
      state.user = null
      state.token = null
      state.organizationId = null
      state.isAuthenticated = false
      state.isLoading = false
      state.didLogout = true

      clearClientAuthSession()
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthData.pending, (state) => {
        if (!state.didLogout && state.token) {
          state.isLoading = true
        }
      })
      .addCase(fetchAuthData.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload
          state.organizationId = action.payload.org_id || null
          state.isAuthenticated = true
          state.didLogout = false
        } else {
          state.user = null
          state.token = null
          state.isAuthenticated = false
        }
      })
      .addCase(fetchAuthData.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.organizationId = null
        state.isAuthenticated = false
      })
  },
})

export const { setAuthData, setUser, setActiveApp, setLoading, logout } = authSlice.actions

export default authSlice.reducer

/* ================= SELECTORS ================= */
export const userSelector = (state: { auth: UserState }) => state.auth.user
export const tokenSelector = (state: { auth: UserState }) => state.auth.token
export const isAuthenticatedSelector = (state: { auth: UserState }) => state.auth.isAuthenticated
export const isLoadingSelector = (state: { auth: UserState }) => state.auth.isLoading
export const activeAppSelector = (state: { auth: UserState }) => state.auth.activeApp
export const orgIdSelector = (state: { auth: UserState }) => state.auth.organizationId

// App-specific role checks for the 3 apps
export const isClientUser = (user: User | null): boolean => {
  return user?.role === 'client'
}

export const isMerchantUser = (user: User | null): boolean => {
  if (!user?.role) return false
  const merchantRoles: UserRole[] = ['org_owner', 'reception', 'stylist']
  return merchantRoles.includes(user.role)
}

export const isAdminUser = (user: User | null): boolean => {
  if (!user?.role) return false
  const adminRoles: UserRole[] = ['platform_admin', 'platform_staff']
  return adminRoles.includes(user.role)
}

export const isClientSelector = (state: { auth: UserState }) => isClientUser(state.auth.user)
export const isMerchantSelector = (state: { auth: UserState }) => isMerchantUser(state.auth.user)
export const isAdminSelector = (state: { auth: UserState }) => isAdminUser(state.auth.user)
