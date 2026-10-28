import type { ApiCancellationPolicy, ApiOrgAccount, ApiOrgSettings } from '@/types/api-org'

export interface MerchantOnboardingStep {
  key: 'paypal' | 'hours-location' | 'policies'
  tab: 'paypal' | 'hours-location' | 'policies'
  title: string
  shortLabel: string
  description: string
  actionLabel: string
  isComplete: boolean
}

export interface MerchantOnboardingSummary {
  isPaypalComplete: boolean
  isLocationComplete: boolean
  isHoursComplete: boolean
  isPolicyComplete: boolean
  incompleteCount: number
  isFullyConfigured: boolean
  steps: MerchantOnboardingStep[]
}

export function computeMerchantOnboardingStatus(
  account: ApiOrgAccount | null | undefined,
  settings: ApiOrgSettings | null | undefined,
  policies: ApiCancellationPolicy[] | null | undefined,
): MerchantOnboardingSummary {
  const isPaypalComplete = Boolean(
    account?.merchant_id &&
    account.merchant_id.trim() !== '' &&
    account.status?.toLowerCase() === 'approved',
  )

  const hasCoordinates =
    settings?.lat !== null &&
    settings?.lat !== undefined &&
    settings?.lng !== null &&
    settings?.lng !== undefined &&
    !Number.isNaN(Number(settings.lat)) &&
    !Number.isNaN(Number(settings.lng))

  const hasAddress = Boolean(settings?.physical_address && settings.physical_address.trim() !== '')

  const isLocationComplete = Boolean(hasCoordinates && hasAddress)

  const isHoursComplete = Boolean(
    settings?.timezone &&
    settings.timezone.trim() !== '' &&
    settings.working_hours &&
    typeof settings.working_hours === 'object' &&
    Object.keys(settings.working_hours).length > 0,
  )

  const isPolicyComplete = Boolean(
    policies && policies.some((p) => p.status?.toLowerCase() === 'active'),
  )

  const steps: MerchantOnboardingStep[] = [
    {
      key: 'paypal',
      tab: 'paypal',
      title: 'Connect PayPal Account',
      shortLabel: 'PayPal Payouts',
      description:
        'Link your verified merchant account to receive direct appointment hold payouts.',
      actionLabel: 'Connect PayPal',
      isComplete: isPaypalComplete,
    },
    {
      key: 'hours-location',
      tab: 'hours-location',
      title: 'Set Location & Operating Hours',
      shortLabel: 'Hours & Location',
      description: 'Pin your physical salon address and configure open booking hours and timezone.',
      actionLabel: 'Set Hours & Pin',
      isComplete: isLocationComplete && isHoursComplete,
    },
    {
      key: 'policies',
      tab: 'policies',
      title: 'Define Cancellation Policy',
      shortLabel: 'Cancellation Policy',
      description:
        'Specify the notice cutoff window and no-show fee protection terms for appointments.',
      actionLabel: 'Define Policy',
      isComplete: isPolicyComplete,
    },
  ]

  const incompleteCount = steps.filter((s) => !s.isComplete).length

  return {
    isPaypalComplete,
    isLocationComplete,
    isHoursComplete,
    isPolicyComplete,
    incompleteCount,
    isFullyConfigured: incompleteCount === 0,
    steps,
  }
}
