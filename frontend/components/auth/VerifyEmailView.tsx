'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/store/api/sharedApi'

export function VerifyEmailView() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation()
  const [resend, { isLoading: resending }] = useResendVerificationMutation()
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('Verifying your email…')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token. Check the link from your email.')
      return
    }
    void verifyEmail({ token })
      .unwrap()
      .then(() => {
        setStatus('ok')
        setMessage('Email verified. You can sign in and book with confidence.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(
          String(
            (err as { data?: { detail?: string } })?.data?.detail ||
              'Verification link is invalid or expired.',
          ),
        )
      })
  }, [token, verifyEmail])

  const handleResend = async () => {
    if (!email.trim()) return
    try {
      await resend({ email: email.trim() }).unwrap()
      setMessage('If that account needs verification, a new email was sent.')
      setStatus('idle')
    } catch {
      setMessage('Could not resend verification email.')
      setStatus('error')
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-2 font-semibold text-2xl text-slate-900">Verify email</h1>
      <p
        className={`mb-8 text-sm ${
          status === 'ok'
            ? 'text-emerald-700'
            : status === 'error'
              ? 'text-rose-700'
              : 'text-slate-600'
        }`}
      >
        {isLoading ? 'Verifying your email…' : message}
      </p>

      {status === 'ok' ? (
        <PrimaryButton
          title="Continue to sign in"
          onClick={() => {
            window.location.href = '/login'
          }}
        />
      ) : null}

      {status === 'error' ? (
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="font-semibold text-slate-700 text-xs">Resend to email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </label>
          <PrimaryButton
            title={resending ? 'Sending…' : 'Resend verification'}
            isDisabled={resending || !email.trim()}
            onClick={() => void handleResend()}
          />
        </div>
      ) : null}

      <p className="mt-6 text-center text-slate-500 text-sm">
        <Link href="/login" className="text-amber-600 hover:text-amber-700">
          Return to sign in
        </Link>
      </p>
    </main>
  )
}
