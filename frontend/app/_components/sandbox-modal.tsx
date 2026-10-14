'use client'

import { Code2, ExternalLink, KeyRound, Shield, Store, User } from 'lucide-react'
import { useState } from 'react'

import { Button, CopyableValue, Modal, SegmentedControl } from '@/components/ui'
import { useClipboard } from '@/hooks'
import {
  SAMPLE_AUTHORIZATION_PAYLOAD,
  SAMPLE_NO_SHOW_CAPTURE_PAYLOAD,
  SANDBOX_CREDENTIALS,
} from '@/lib/constants'

interface SandboxModalProps {
  onClose: () => void
}

type SandboxTab = 'credentials' | 'payload'

export function SandboxModal({ onClose }: SandboxModalProps) {
  const { copiedKey, copy } = useClipboard()
  const [activeTab, setActiveTab] = useState<SandboxTab>('credentials')
  const { buyerAccount, merchantAccount } = SANDBOX_CREDENTIALS

  return (
    <Modal
      onClose={onClose}
      size="lg"
      icon={<KeyRound className="h-5 w-5 text-amber-600" />}
      title="Hackathon Judge & Sandbox Credentials"
      description="Ready-to-use PayPal sandbox test accounts & API payloads"
      footer={
        <>
          <span className="mr-auto text-slate-500 text-xs">
            PayPal Sandbox developer portal:{' '}
            <a
              href="https://developer.paypal.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline"
            >
              developer.paypal.com <ExternalLink className="h-3 w-3" />
            </a>
          </span>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'credentials', label: 'Sandbox Accounts', icon: User },
          { value: 'payload', label: 'Authorization Payloads', icon: Code2 },
        ]}
      />

      {activeTab === 'credentials' ? (
        <div className="mt-5 space-y-5">
          <CredentialCard
            icon={<User className="h-4 w-4 text-sky-600" />}
            title="Client / Buyer Sandbox Account"
            badge="Pre-Funded Mock Buyer"
            badgeTone="sky"
            email={buyerAccount.email}
            password={buyerAccount.password}
            footerLeft={`Name: ${buyerAccount.name}`}
            footerRight={`Payment Card: ${buyerAccount.card}`}
            copyKeyPrefix="buyer"
            copiedKey={copiedKey}
            onCopy={copy}
          />

          <CredentialCard
            icon={<Store className="h-4 w-4 text-amber-600" />}
            title="Salon Merchant Sandbox Account"
            badge="Flagship SoHo Salon"
            badgeTone="amber"
            email={merchantAccount.email}
            password={merchantAccount.password}
            footerLeft={`Salon: ${merchantAccount.salonName}`}
            footerRight={`ID: ${merchantAccount.merchantId}`}
            copyKeyPrefix="merchant"
            copiedKey={copiedKey}
            onCopy={copy}
          />

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="space-y-1 text-amber-900 text-xs">
              <span className="block font-bold text-amber-800">
                Fintech Rule: Authorization Hold Model
              </span>
              <p className="leading-relaxed">
                All customer checkout flows enforce{' '}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-bold font-mono text-amber-900">
                  intent: &apos;AUTHORIZE&apos;
                </code>
                . No money leaves the client&apos;s account at booking time. Funds are securely
                locked on their card and captured only upon service completion or no-show penalty.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <PayloadBlock
            title="1. Deposit Hold Creation (`POST /v2/checkout/orders`)"
            hint="intent: AUTHORIZE"
            tone="sky"
            payload={SAMPLE_AUTHORIZATION_PAYLOAD}
          />
          <PayloadBlock
            title="2. No-Show Fee Partial Capture (`POST /v2/payments/authorizations/{id}/capture`)"
            hint="final_capture: true"
            tone="emerald"
            payload={SAMPLE_NO_SHOW_CAPTURE_PAYLOAD}
          />
        </div>
      )}
    </Modal>
  )
}

function CredentialCard({
  icon,
  title,
  badge,
  badgeTone,
  email,
  password,
  footerLeft,
  footerRight,
  copyKeyPrefix,
  copiedKey,
  onCopy,
}: {
  icon: React.ReactNode
  title: string
  badge: string
  badgeTone: 'sky' | 'amber'
  email: string
  password: string
  footerLeft: string
  footerRight: string
  copyKeyPrefix: string
  copiedKey: string | null
  onCopy: (value: string, key: string) => void
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">{title}</span>
        </div>
        <span
          className={`rounded border px-2 py-0.5 font-semibold text-[11px] ${
            badgeTone === 'sky'
              ? 'border-sky-200 bg-sky-100 text-sky-700'
              : 'border-amber-200 bg-amber-100 text-amber-800'
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div className="space-y-1">
          <span className="font-medium text-slate-500">Email / Username</span>
          <CopyableValue
            value={email}
            copyKey={`${copyKeyPrefix}-email`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
        <div className="space-y-1">
          <span className="font-medium text-slate-500">Password</span>
          <CopyableValue
            value={password}
            copyKey={`${copyKeyPrefix}-pass`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  )
}

function PayloadBlock({
  title,
  hint,
  tone,
  payload,
}: {
  title: string
  hint: string
  tone: 'sky' | 'emerald'
  payload: unknown
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`font-bold text-xs ${tone === 'sky' ? 'text-sky-700' : 'text-emerald-700'}`}
        >
          {title}
        </span>
        <span className="font-mono text-[11px] text-slate-500">{hint}</span>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-slate-100">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  )
}
