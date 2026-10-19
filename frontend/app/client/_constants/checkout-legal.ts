export const CHECKOUT_TERMS_VERSION = 'v1'

export interface LegalSection {
  heading: string
  body: string
}

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: 'Booking through SalonDesk',
    body: 'SalonDesk is a booking platform that connects you with independent salons. Your appointment contract is with the salon; SalonDesk processes the booking and the PayPal authorization on its behalf.',
  },
  {
    heading: 'Authorization hold',
    body: 'To secure your time slot we place an authorization hold on your PayPal account for the amount shown at checkout. A hold is not a charge — $0 is collected today. Holds are re-authorized automatically if your appointment is more than a few days away.',
  },
  {
    heading: 'Cancellations and no-shows',
    body: "You may cancel for free up to the free-cancellation deadline shown at checkout. Cancelling after that deadline, or not attending, lets the salon capture the late-cancellation or no-show fee from the hold under the salon's cancellation policy. Any remaining hold is released.",
  },
  {
    heading: 'Locked pricing',
    body: 'The service price and cancellation policy are locked when you book. Later changes made by the salon do not affect your appointment.',
  },
  {
    heading: 'Payment for the service',
    body: 'After a completed appointment the salon captures the service price and platform fee from the hold you authorized at checkout. Tips and add-ons agreed at the salon may be settled separately.',
  },
  {
    heading: 'Changes and disputes',
    body: 'If the salon cancels or cannot honour your appointment the hold is released in full. Contact the salon or SalonDesk support for any dispute; PayPal buyer protection terms also apply.',
  },
]

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'What we collect',
    body: 'Your name, email, phone number, appointment details, and the PayPal authorization reference. We never receive or store your card or bank details — PayPal handles them.',
  },
  {
    heading: 'How we use it',
    body: 'To create and manage your booking, send confirmations and reminders, settle holds under the agreed policy, and prevent fraud.',
  },
  {
    heading: 'Who we share it with',
    body: 'The salon you book with (to deliver your service) and PayPal (to process the authorization). We do not sell your personal data.',
  },
  {
    heading: 'Retention and your rights',
    body: 'Booking records are kept for accounting and dispute purposes. You can request a copy of your data, a correction, or deletion of your account at any time from your profile or by contacting support.',
  },
]
