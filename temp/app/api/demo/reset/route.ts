import { NextResponse } from 'next/server';
import { INITIAL_BOOKINGS, INITIAL_AUDIT_LEDGER, INITIAL_ORGANIZATIONS } from '@/lib/store';

export async function POST() {
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    success: true,
    message: 'SalonDesk Deposits demo sandbox state successfully reset.',
    timestamp,
    stats: {
      activeHoldsCount: INITIAL_BOOKINGS.filter((b) => b.status === 'HELD').length,
      capturedCount: INITIAL_BOOKINGS.filter((b) => b.status === 'CAPTURED').length,
      noShowCount: INITIAL_BOOKINGS.filter((b) => b.status === 'NO_SHOW_CAPTURED').length,
      voidedCount: INITIAL_BOOKINGS.filter((b) => b.status === 'VOIDED').length,
      totalOrganizations: INITIAL_ORGANIZATIONS.length,
      ledgerEntries: INITIAL_AUDIT_LEDGER.length,
    },
    sampleData: {
      activeHoldId: 'SD-8491',
      buyerAccount: 'buyer-sandbox@salondesk.dev',
      merchantAccount: 'merchant-soho@salondesk.dev',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    service: 'SalonDesk Deposits Sandbox Engine',
    intentRule: 'intent: AUTHORIZE (Hold, Not a Charge)',
    demoResetEndpoint: 'POST /api/demo/reset',
  });
}
