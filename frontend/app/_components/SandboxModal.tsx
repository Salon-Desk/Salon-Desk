'use client'

import { Code2, ExternalLink, KeyRound, Shield, Store, User } from 'lucide-react'
import { useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { SegmentedControl } from '@/components/ui'
import { useClipboard } from '@/hooks'
import {
  SAMPLE_AUTHORIZATION_PAYLOAD,
  SAMPLE_NO_SHOW_CAPTURE_PAYLOAD,
  SANDBOX_CREDENTIALS,
} from '@/lib/constants'

import { CredentialCard } from './CredentialCard'
import { PayloadBlock } from './PayloadBlock'

interface SandboxModalProps {
  onClose: () => void
}

type SandboxTab = 'credentials' | 'payload'

export function SandboxModal({ onClose }: SandboxModalProps) {
  const { copiedKey, copy } = useClipboard()
  const [activeTab, setActiveTab] = useState<SandboxTab>('credentials')
  const { buyerAccount, merchantAccount } = SANDBOX_CREDENTIALS

  return (
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      classNameContent="max-w-2xl"
      header={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">
              Hackathon Judge &amp; Sandbox Credentials
            </h3>
          </div>
          <p className="text-slate-500 text-xs">
            Ready-to-use PayPal sandbox test accounts &amp; API payloads
          </p>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-slate-500 text-xs">
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
          <PrimaryButton
            variant="secondary"
            onClick={onClose}
            title="Close"
            className="h-9 px-4 text-xs font-semibold"
            fullWidth={false}
          />
        </div>
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
    </CustomResponsiveDialog>
  )
}
