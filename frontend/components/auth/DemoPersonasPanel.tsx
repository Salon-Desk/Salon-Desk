'use client'

import { KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FC, ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

import { useAuthModal } from '@/components/auth/auth-context'
import { toastColor } from '@/constant/toast-color'
import type { AppDispatch } from '@/store'
import { useJudgeDemoAuthMutation, useSignInMutation } from '@/store/api/sharedApi'
import { type AppPortal, setActiveApp, setAuthData } from '@/store/authSlice'
import { API_TAG_TYPES, baseApi } from '@/store/baseApi'

export type DemoPersona = {
  email: string
  label: string
  subtitle: string
  destination: string
  portal: AppPortal
  icon: ReactNode
  toneClass: string
  badgeClass: string
}

interface DemoPersonasPanelProps {
  personas: DemoPersona[]
  showJudgeDemo?: boolean
  password?: string
}

export const DEMO_ACCOUNT_PASSWORD = 'Password123!'

type DemoSignInTarget = Pick<DemoPersona, 'email' | 'label' | 'portal' | 'destination'>

export function useQuickDemoSignIn(password = DEMO_ACCOUNT_PASSWORD) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { closeAuthModal } = useAuthModal()
  const [signIn, { isLoading }] = useSignInMutation()

  const signInAs = async (persona: DemoSignInTarget) => {
    try {
      const res = await signIn({ email: persona.email, password }).unwrap()
      dispatch(
        setAuthData({
          user: res.user,
          access_token: res.access_token,
          organization_id: res.user.org_id || undefined,
          portal: persona.portal,
        }),
      )
      dispatch(setActiveApp(persona.portal))
      dispatch(baseApi.util.invalidateTags([...API_TAG_TYPES]))
      toast.success(`Signed in as ${persona.label}`, toastColor.success)
      closeAuthModal()

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isAlreadyInPortal =
          persona.portal === 'client'
            ? currentPath.startsWith('/client') || currentPath === '/'
            : currentPath.startsWith(`/${persona.portal}`)
        if (isAlreadyInPortal) {
          router.refresh()
          return
        }
      }

      router.push(persona.destination)
      router.refresh()
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (err as { message?: string })?.message ||
        'Demo sign in failed. Ensure the database has been seeded (make seed).'
      toast.error(typeof message === 'string' ? message : 'Demo sign in failed.', toastColor.error)
    }
  }

  return { signInAs, isLoading }
}

export const DemoPersonasPanel: FC<DemoPersonasPanelProps> = ({
  personas,
  showJudgeDemo = false,
  password = DEMO_ACCOUNT_PASSWORD,
}) => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { closeAuthModal } = useAuthModal()
  const { signInAs, isLoading } = useQuickDemoSignIn(password)
  const [judgeDemoAuth, { isLoading: isJudgeLoading }] = useJudgeDemoAuthMutation()

  const handleQuickSignIn = (persona: DemoPersona) => signInAs(persona)

  const handleJudgeDemo = async () => {
    try {
      const res = await judgeDemoAuth().unwrap()
      const judgePortal: AppPortal =
        res.user.role === 'platform_admin' || res.user.role === 'platform_staff'
          ? 'admin'
          : res.user.role === 'org_owner' ||
              res.user.role === 'reception' ||
              res.user.role === 'stylist'
            ? 'merchant'
            : 'client'
      dispatch(
        setAuthData({
          user: res.user,
          access_token: res.access_token,
          organization_id: res.user.org_id || undefined,
          portal: judgePortal,
        }),
      )
      dispatch(setActiveApp(judgePortal))
      dispatch(baseApi.util.invalidateTags([...API_TAG_TYPES]))
      toast.success(`Judge demo token issued for ${res.user.email}`, toastColor.success)
      closeAuthModal()
      router.refresh()
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (err as { message?: string })?.message ||
        'Judge demo auth failed.'
      toast.error(
        typeof message === 'string' ? message : 'Judge demo auth failed.',
        toastColor.error,
      )
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Instant 1-click test login using seeded demo credentials (password:{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-amber-700">
          {password}
        </code>
        ):
      </p>

      <div className="flex flex-col gap-2">
        {personas.map((persona) => (
          <button
            key={persona.email}
            type="button"
            disabled={isLoading}
            onClick={() => void handleQuickSignIn(persona)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${persona.toneClass}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
              {persona.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-bold text-slate-900">{persona.label}</span>
              <span className="truncate text-[11px] text-slate-500">{persona.subtitle}</span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${persona.badgeClass}`}
            >
              Login →
            </span>
          </button>
        ))}

        {showJudgeDemo ? (
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => void handleJudgeDemo()}
              disabled={isJudgeLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-900 transition-colors hover:bg-violet-100"
            >
              <KeyRound className="h-4 w-4 text-violet-600" />
              {isJudgeLoading
                ? 'Minting Judge Demo Token...'
                : 'Mint Judge Demo Auth Token (/auth/demo)'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
