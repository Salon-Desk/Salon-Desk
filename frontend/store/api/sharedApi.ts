import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  MeResponse,
  MessageOut,
  OrgOwnerSignUpRequest,
  OrgOwnerSignUpResponse,
  ResetPasswordRequest,
  SignInCredentials,
  SignUpRequest,
  TokenResponse,
} from '@/types/auth'
import type { Profile, ProfileUpdatePayload } from '@/types/user'

import { baseApi } from '../baseApi'

const prefix = '/api/v1/auth/'

/**
 * SalonDesk RTK Query auth endpoints.
 * Strictly adheres to FastAPI backend and postman/collection.json:
 * - POST /api/v1/auth/sign-in
 * - POST /api/v1/auth/sign-up
 * - POST /api/v1/auth/sign-up/org-owner
 * - GET  /api/v1/auth/me
 * - GET  /api/v1/auth/me/profile
 * - PATCH /api/v1/auth/me/profile
 * - POST /api/v1/auth/forgot-password
 * - POST /api/v1/auth/reset-password
 * - POST /api/v1/auth/demo (Judge Demo Auth)
 */
export const sharedApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // 1. Sign In
    signIn: builder.mutation<TokenResponse, SignInCredentials>({
      query: (body) => ({
        url: `${prefix}sign-in`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['auth'],
    }),

    // Alias for signIn to match common naming
    login: builder.mutation<TokenResponse, SignInCredentials>({
      query: (body) => ({
        url: `${prefix}sign-in`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['auth'],
    }),

    // 2. Client Sign Up
    signUp: builder.mutation<TokenResponse, SignUpRequest>({
      query: (body) => ({
        url: `${prefix}sign-up`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['auth'],
    }),

    // 3. Organization Owner Sign Up
    signUpOrgOwner: builder.mutation<OrgOwnerSignUpResponse, OrgOwnerSignUpRequest>({
      query: (body) => ({
        url: `${prefix}sign-up/org-owner`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['auth'],
    }),

    // 4. Me (Current session user + profile)
    me: builder.query<MeResponse, void>({
      query: () => ({
        url: `${prefix}me`,
        method: 'GET',
      }),
      providesTags: ['auth'],
    }),

    // 5. Get Profile
    getProfile: builder.query<Profile, void>({
      query: () => ({
        url: `${prefix}me/profile`,
        method: 'GET',
      }),
      providesTags: ['auth'],
    }),

    // 6. Update Profile
    updateProfile: builder.mutation<Profile, ProfileUpdatePayload>({
      query: (body) => ({
        url: `${prefix}me/profile`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['auth'],
    }),

    // 7. Forgot Password
    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: `${prefix}forgot-password`,
        method: 'POST',
        data: body,
      }),
    }),

    // 8. Reset Password
    resetPassword: builder.mutation<MessageOut, ResetPasswordRequest>({
      query: (body) => ({
        url: `${prefix}reset-password`,
        method: 'POST',
        data: body,
      }),
    }),

    // 9. Judge Demo Auth (instant 1-click test token)
    judgeDemoAuth: builder.mutation<TokenResponse, void>({
      query: () => ({
        url: `${prefix}demo`,
        method: 'POST',
      }),
      invalidatesTags: ['auth'],
    }),

    // Upload Avatar
    uploadAvatar: builder.mutation<Profile, FormData>({
      query: (formData) => ({
        url: `${prefix}me/avatar`,
        method: 'POST',
        data: formData,
      }),
      invalidatesTags: ['auth'],
    }),

    // 10. Client Logout
    logout: builder.mutation<{ detail: string }, void>({
      queryFn: () => {
        return { data: { detail: 'Logged out successfully' } }
      },
      invalidatesTags: ['auth'],
    }),
  }),
})

export const {
  useSignInMutation,
  useLoginMutation,
  useSignUpMutation,
  useSignUpOrgOwnerMutation,
  useMeQuery,
  useLazyMeQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useJudgeDemoAuthMutation,
  useLogoutMutation,
} = sharedApi

/** @deprecated Use `sharedApi` hooks — kept for existing imports. */
export const authApi = sharedApi
