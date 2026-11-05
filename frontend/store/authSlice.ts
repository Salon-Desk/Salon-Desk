import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  type AppPortal,
  clearAllAuthSessions,
  clearPortalAuthSession,
  getPortalAuthToken,
  savePortalAuthSession,
} from '@/lib/authSession'
import { sharedApi } from '@/store/api/sharedApi'
import type { User, UserRole } from '@/types/user'

export type { AppPortal }

export interface PortalAuthSession {
  user: User | null
  token: string | null
  organizationId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface UserState {
  activeApp: AppPortal
  didLogout: boolean
  portals: Record<AppPortal, PortalAuthSession>

  // Mirrored fields for currently active app portal (backwards compatibility)
  user: User | null
  token: string | null
  organizationId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

function createEmptyPortalSession(): PortalAuthSession {
  return {
    user: null,
    token: null,
    organizationId: null,
    isAuthenticated: false,
    isLoading: false,
  }
}

const initialPortals: Record<AppPortal, PortalAuthSession> = {
  client: createEmptyPortalSession(),
  merchant: createEmptyPortalSession(),
  admin: createEmptyPortalSession(),
}

const initialState: UserState = {
  activeApp: 'client',
  didLogout: false,
  portals: initialPortals,
  user: null,
  token: null,
  organizationId: null,
  isAuthenticated: false,
  isLoading: false,
}

/**
 * Restore auth session from stored token and refresh current user details for a given portal
 */
export const fetchAuthData = createAsyncThunk<
  { portal: AppPortal; user: User | null },
  AppPortal | void,
  { rejectValue: { portal: AppPortal; message: string } }
>('auth/fetchAuthData', async (requestedPortal, { rejectWithValue, dispatch, getState }) => {
  const state = getState() as { auth: UserState }
  const portal: AppPortal = requestedPortal || state.auth.activeApp
  try {
    const token = getPortalAuthToken(portal)
    if (!token) {
      return { portal, user: null }
    }

    const result = await dispatch(
      sharedApi.endpoints.me.initiate(portal, { forceRefetch: true }),
    ).unwrap()

    const fullUser: User = {
      ...result.user,
      profile: result.profile ?? result.user.profile ?? null,
      first_name:
        result.profile?.first_name || (result.user as { first_name?: string }).first_name || '',
      last_name:
        result.profile?.last_name || (result.user as { last_name?: string }).last_name || '',
    }

    savePortalAuthSession(portal, token, fullUser)
    return { portal, user: fullUser }
  } catch (err: unknown) {
    clearPortalAuthSession(portal)
    const errorMsg =
      (err as { data?: { detail?: string }; message?: string })?.data?.detail ||
      (err as { message?: string })?.message ||
      'Session expired'
    return rejectWithValue({ portal, message: errorMsg })
  }
})

type SetUserPayload = User | { user: User; portal?: AppPortal }
type SetLoadingPayload = boolean | { isLoading: boolean; portal?: AppPortal }

function isUserPayloadObject(
  payload: SetUserPayload,
): payload is { user: User; portal?: AppPortal } {
  return typeof payload === 'object' && payload !== null && 'user' in payload
}

function isLoadingPayloadObject(
  payload: SetLoadingPayload,
): payload is { isLoading: boolean; portal?: AppPortal } {
  return typeof payload === 'object' && payload !== null && 'isLoading' in payload
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydratePortalSession: (
      state,
      action: PayloadAction<{
        portal: AppPortal
        token: string | null
        user: User | null
      }>,
    ) => {
      const { portal, token, user } = action.payload
      const isAuthenticated = Boolean(token)
      state.portals[portal] = {
        user,
        token,
        organizationId: user?.org_id ?? null,
        isAuthenticated,
        isLoading: isAuthenticated,
      }
      if (portal === state.activeApp) {
        state.user = user
        state.token = token
        state.organizationId = user?.org_id ?? null
        state.isAuthenticated = isAuthenticated
        state.isLoading = isAuthenticated
      }
    },
    setAuthData: (
      state,
      action: PayloadAction<{
        user: User
        access_token: string
        organization_id?: string
        portal?: AppPortal
      }>,
    ) => {
      const { user, access_token, organization_id, portal: targetPortal } = action.payload
      const portal = targetPortal || state.activeApp
      const orgId = organization_id || user.org_id || null

      state.activeApp = portal
      state.portals[portal] = {
        user,
        token: access_token,
        organizationId: orgId,
        isAuthenticated: true,
        isLoading: false,
      }

      savePortalAuthSession(portal, access_token, user)

      state.user = user
      state.token = access_token
      state.organizationId = orgId
      state.isAuthenticated = true
      state.isLoading = false
      state.didLogout = false
    },

    setUser: (state, action: PayloadAction<SetUserPayload>) => {
      const user: User = isUserPayloadObject(action.payload) ? action.payload.user : action.payload
      const portal: AppPortal =
        isUserPayloadObject(action.payload) && action.payload.portal
          ? action.payload.portal
          : state.activeApp

      if (state.portals[portal]) {
        state.portals[portal].user = user
        state.portals[portal].organizationId = user.org_id ?? state.portals[portal].organizationId
        state.portals[portal].isAuthenticated = true
        state.portals[portal].isLoading = false

        if (state.portals[portal].token) {
          savePortalAuthSession(portal, state.portals[portal].token!, user)
        }
      }

      if (portal === state.activeApp) {
        state.user = user
        state.organizationId = user.org_id ?? state.organizationId
        state.isAuthenticated = true
        state.isLoading = false
        state.didLogout = false
      }
    },

    setActiveApp: (state, action: PayloadAction<AppPortal>) => {
      state.activeApp = action.payload
      const active = state.portals[action.payload]
      if (active) {
        state.user = active.user
        state.token = active.token
        state.organizationId = active.organizationId
        state.isAuthenticated = active.isAuthenticated
        state.isLoading = active.isLoading
      }
    },

    setLoading: (state, action: PayloadAction<SetLoadingPayload>) => {
      const isLoading: boolean = isLoadingPayloadObject(action.payload)
        ? action.payload.isLoading
        : action.payload
      const portal: AppPortal =
        isLoadingPayloadObject(action.payload) && action.payload.portal
          ? action.payload.portal
          : state.activeApp

      if (state.portals[portal]) {
        state.portals[portal].isLoading = isLoading
      }
      if (portal === state.activeApp) {
        state.isLoading = isLoading
      }
    },

    logout: (state, action: PayloadAction<AppPortal | undefined>) => {
      const portal = action.payload || state.activeApp
      clearPortalAuthSession(portal)

      state.portals[portal] = {
        user: null,
        token: null,
        organizationId: null,
        isAuthenticated: false,
        isLoading: false,
      }

      if (portal === state.activeApp) {
        state.user = null
        state.token = null
        state.organizationId = null
        state.isAuthenticated = false
        state.isLoading = false
        state.didLogout = true
      }
    },

    logoutAll: (state) => {
      clearAllAuthSessions()
      const portals: AppPortal[] = ['client', 'merchant', 'admin']
      for (const p of portals) {
        state.portals[p] = {
          user: null,
          token: null,
          organizationId: null,
          isAuthenticated: false,
          isLoading: false,
        }
      }
      state.user = null
      state.token = null
      state.organizationId = null
      state.isAuthenticated = false
      state.isLoading = false
      state.didLogout = true
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthData.pending, (state, action) => {
        const portal = action.meta.arg || state.activeApp
        if (!state.didLogout && state.portals[portal]?.token) {
          state.portals[portal].isLoading = true
          if (portal === state.activeApp) {
            state.isLoading = true
          }
        }
      })
      .addCase(fetchAuthData.fulfilled, (state, action) => {
        const { portal, user } = action.payload
        if (state.portals[portal]) {
          state.portals[portal].isLoading = false
          if (user) {
            state.portals[portal].user = user
            state.portals[portal].organizationId = user.org_id || null
            state.portals[portal].isAuthenticated = true
          } else {
            state.portals[portal].user = null
            state.portals[portal].token = null
            state.portals[portal].organizationId = null
            state.portals[portal].isAuthenticated = false
          }
        }
        if (portal === state.activeApp) {
          const active = state.portals[portal]
          state.user = active.user
          state.token = active.token
          state.organizationId = active.organizationId
          state.isAuthenticated = active.isAuthenticated
          state.isLoading = false
          if (user) {
            state.didLogout = false
          }
        }
      })
      .addCase(fetchAuthData.rejected, (state, action) => {
        const portal = action.meta.arg || state.activeApp
        if (state.portals[portal]) {
          state.portals[portal].isLoading = false
          state.portals[portal].user = null
          state.portals[portal].token = null
          state.portals[portal].organizationId = null
          state.portals[portal].isAuthenticated = false
        }
        if (portal === state.activeApp) {
          state.user = null
          state.token = null
          state.organizationId = null
          state.isAuthenticated = false
          state.isLoading = false
        }
      })
  },
})

export const {
  hydratePortalSession,
  setAuthData,
  setUser,
  setActiveApp,
  setLoading,
  logout,
  logoutAll,
} = authSlice.actions

export default authSlice.reducer

/* ================= SELECTORS ================= */
export const activeAppSelector = (state: { auth: UserState }) => state.auth.activeApp

export const portalSessionSelector =
  (portal: AppPortal) =>
  (state: { auth: UserState }): PortalAuthSession =>
    state.auth.portals[portal] ?? {
      user: null,
      token: null,
      organizationId: null,
      isAuthenticated: false,
      isLoading: false,
    }

export const portalUserSelector = (portal: AppPortal) => (state: { auth: UserState }) =>
  state.auth.portals[portal]?.user ?? null

export const portalTokenSelector = (portal: AppPortal) => (state: { auth: UserState }) =>
  state.auth.portals[portal]?.token ?? null

export const portalAuthSelector = (portal: AppPortal) => (state: { auth: UserState }) =>
  state.auth.portals[portal]?.isAuthenticated ?? false

export const portalLoadingSelector = (portal: AppPortal) => (state: { auth: UserState }) =>
  state.auth.portals[portal]?.isLoading ?? false

// Active portal selectors (mirroring activeApp)
export const userSelector = (state: { auth: UserState }) =>
  state.auth.portals[state.auth.activeApp]?.user ?? state.auth.user
export const tokenSelector = (state: { auth: UserState }) =>
  state.auth.portals[state.auth.activeApp]?.token ?? state.auth.token
export const isAuthenticatedSelector = (state: { auth: UserState }) =>
  state.auth.portals[state.auth.activeApp]?.isAuthenticated ?? state.auth.isAuthenticated
export const isLoadingSelector = (state: { auth: UserState }) =>
  state.auth.portals[state.auth.activeApp]?.isLoading ?? state.auth.isLoading
export const orgIdSelector = (state: { auth: UserState }) =>
  state.auth.portals[state.auth.activeApp]?.organizationId ?? state.auth.organizationId

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

export const isClientSelector = (state: { auth: UserState }) =>
  isClientUser(state.auth.portals.client?.user ?? userSelector(state))
export const isMerchantSelector = (state: { auth: UserState }) =>
  isMerchantUser(state.auth.portals.merchant?.user ?? userSelector(state))
export const isAdminSelector = (state: { auth: UserState }) =>
  isAdminUser(state.auth.portals.admin?.user ?? userSelector(state))
