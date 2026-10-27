'use client'

import {
  ExternalLink,
  FlaskConical,
  KeyRound,
  Shield,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { SegmentedControl } from '@/components/ui'
import { useClipboard } from '@/hooks'
import { SALONDESK_DEMO_PORTAL_PASSWORD, SANDBOX_CREDENTIALS } from '@/lib/constants'

import { CredentialCard } from './CredentialCard'

interface SandboxModalProps {
  onClose: () => void
}

type SandboxTab = 'system' | 'sandbox' | 'client' | 'merchant'

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">{children}</h4>
  )
}

function AuthorizationHoldNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="space-y-1 text-amber-900 text-xs">
        <span className="block font-bold text-amber-800">Authorization hold model</span>
        <p className="leading-relaxed">
          Checkout uses{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-bold font-mono text-amber-900">
            intent: AUTHORIZE
          </code>
          . Funds are held at booking—not captured until service completion or a policy fee applies.
        </p>
      </div>
    </div>
  )
}

function TechStackPanel() {
  const { techStack } = SANDBOX_CREDENTIALS
  const rows = [
    { label: 'Frontend', value: techStack.framework },
    { label: 'PayPal API', value: techStack.paypalApi },
    { label: 'PayPal SDK', value: techStack.paypalSdk },
    { label: 'Agent toolkit', value: techStack.agentToolkit },
    { label: 'AI', value: techStack.aiEngine },
  ] as const

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <SectionHeading>Demo stack</SectionHeading>
      <ul className="mt-3 space-y-2 text-xs">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="shrink-0 font-semibold text-slate-500 sm:w-28">{row.label}</span>
            <span className="text-slate-800">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SandboxModal({ onClose }: SandboxModalProps) {
  const { copiedKey, copy } = useClipboard()
  const [activeTab, setActiveTab] = useState<SandboxTab>('system')
  const {
    paypalBuyerAccounts,
    paypalMerchantAccounts,
    portalClientAccounts,
    portalSystemAccounts,
  } = SANDBOX_CREDENTIALS

  return (
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      classNameContent="max-w-2xl max-h-[85vh] overflow-y-auto"
      header={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">
              Hackathon Judge &amp; Sandbox Credentials
            </h3>
          </div>
          <p className="text-slate-500 text-xs">
            SalonDesk portal logins and PayPal sandbox wallets
          </p>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-slate-500 text-xs">
            PayPal Sandbox:{' '}
            <a
              href="https://sandbox.paypal.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline"
            >
              sandbox.paypal.com <ExternalLink className="h-3 w-3" />
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
        fullWidth
        className="flex-wrap"
        options={[
          { value: 'system', label: 'System', icon: ShieldCheck },
          { value: 'sandbox', label: 'Sandbox', icon: FlaskConical },
          { value: 'client', label: 'Client', icon: User },
          { value: 'merchant', label: 'Merchant', icon: Store },
        ]}
      />

      <div className="mt-5 space-y-6">
        {activeTab === 'system' ? (
          <>
            <div className="space-y-3">
              <SectionHeading>
                SalonDesk platform (password: {SALONDESK_DEMO_PORTAL_PASSWORD})
              </SectionHeading>
              {portalSystemAccounts.map((account, index) => (
                <CredentialCard
                  key={account.email}
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                  title={account.label}
                  badge={account.portal}
                  badgeTone="sky"
                  email={account.email}
                  password={account.password}
                  footerLeft={`Role: ${account.label}`}
                  footerRight={account.portal}
                  copyKeyPrefix={`portal-system-${index}`}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              ))}
            </div>
            <TechStackPanel />
          </>
        ) : null}

        {activeTab === 'sandbox' ? (
          <>
            <div className="space-y-3">
              <SectionHeading>PayPal personal (checkout wallet)</SectionHeading>
              {paypalBuyerAccounts.map((account, index) => (
                <CredentialCard
                  key={account.email}
                  icon={<User className="h-4 w-4 text-sky-600" />}
                  title={`Buyer ${index + 1}`}
                  badge={account.label}
                  badgeTone="sky"
                  email={account.email}
                  password={account.password}
                  footerLeft="Sign in when PayPal checkout opens"
                  footerRight="Not a SalonDesk app login"
                  copyKeyPrefix={`paypal-buyer-${index}`}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              ))}
            </div>
            <div className="space-y-3">
              <SectionHeading>PayPal business (first two seeded salons)</SectionHeading>
              {paypalMerchantAccounts.map((account, index) => (
                <CredentialCard
                  key={account.email}
                  icon={<Store className="h-4 w-4 text-amber-600" />}
                  title={`Business ${index + 1}`}
                  badge={account.salonName}
                  badgeTone="amber"
                  email={account.email}
                  password={account.password}
                  footerLeft={`Merchant / App ID: ${account.merchantId}`}
                  footerRight="PayPal Developer sandbox"
                  copyKeyPrefix={`paypal-merchant-${index}`}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              ))}
            </div>
          </>
        ) : null}

        {activeTab === 'client' ? (
          <>
            <div className="space-y-3">
              <SectionHeading>
                SalonDesk client portal (password: {SALONDESK_DEMO_PORTAL_PASSWORD})
              </SectionHeading>
              {portalClientAccounts.map((account, index) => (
                <CredentialCard
                  key={account.email}
                  icon={<User className="h-4 w-4 text-sky-600" />}
                  title={`Client ${index + 1}`}
                  badge={account.label}
                  badgeTone="sky"
                  email={account.email}
                  password={account.password}
                  footerLeft={`PayPal wallet password: ${account.paypalCheckoutPassword}`}
                  footerRight="See Sandbox tab for PayPal login"
                  copyKeyPrefix={`portal-client-${index}`}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              ))}
            </div>
            <AuthorizationHoldNotice />
          </>
        ) : null}

        {activeTab === 'merchant' ? (
          <>
            <div className="space-y-3">
              <SectionHeading>
                SalonDesk merchant portal (password: {SALONDESK_DEMO_PORTAL_PASSWORD})
              </SectionHeading>
              {paypalMerchantAccounts.map((account, index) => (
                <CredentialCard
                  key={account.portalOwnerEmail}
                  icon={<Store className="h-4 w-4 text-amber-600" />}
                  title={`Owner ${index + 1}`}
                  badge={account.salonName}
                  badgeTone="amber"
                  email={account.portalOwnerEmail}
                  password={SALONDESK_DEMO_PORTAL_PASSWORD}
                  footerLeft={`PayPal business: ${account.email}`}
                  footerRight={`Merchant ID: ${account.merchantId}`}
                  copyKeyPrefix={`portal-owner-${index}`}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              ))}
            </div>
            <AuthorizationHoldNotice />
          </>
        ) : null}
      </div>
    </CustomResponsiveDialog>
  )
}
