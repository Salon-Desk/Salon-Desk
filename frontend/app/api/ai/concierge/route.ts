import { GoogleGenAI } from '@google/genai'
import { type NextRequest, NextResponse } from 'next/server'

import { INITIAL_SERVICES, INITIAL_STAFF } from '@/lib/data/catalog'

function matchService(message: string, selectedServiceId?: string) {
  const lower = message.toLowerCase()
  const selected = INITIAL_SERVICES.find((s) => s.id === selectedServiceId)
  if (selected) return selected
  if (lower.includes('balayage') || lower.includes('color') || lower.includes('blonde')) {
    return INITIAL_SERVICES.find((s) => s.id === 'srv-2')
  }
  if (
    lower.includes('fade') ||
    lower.includes('haircut') ||
    lower.includes('towel') ||
    lower.includes('beard')
  ) {
    return INITIAL_SERVICES.find((s) => s.id === 'srv-1')
  }
  if (lower.includes('silk') || lower.includes('press') || lower.includes('moisture')) {
    return INITIAL_SERVICES.find((s) => s.id === 'srv-3')
  }
  if (lower.includes('braid') || lower.includes('cornrow') || lower.includes('loc')) {
    return INITIAL_SERVICES.find((s) => s.id === 'srv-4')
  }
  if (
    lower.includes('facial') ||
    lower.includes('spa') ||
    lower.includes('skin') ||
    lower.includes('hydro')
  ) {
    return INITIAL_SERVICES.find((s) => s.id === 'srv-5')
  }
  return undefined
}

function matchStylist(message: string, serviceId?: string) {
  const lower = message.toLowerCase()
  if (lower.includes('elena') || serviceId === 'srv-2') {
    return INITIAL_STAFF.find((st) => st.id === 'stf-2') ?? INITIAL_STAFF[0]
  }
  if (lower.includes('kai') || serviceId === 'srv-3' || serviceId === 'srv-4') {
    return INITIAL_STAFF.find((st) => st.id === 'stf-3') ?? INITIAL_STAFF[0]
  }
  return INITIAL_STAFF.find((st) => st.id === 'stf-1') ?? INITIAL_STAFF[0]
}

function matchSlot(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('morning') || lower.includes('10') || lower.includes('11')) {
    return 'Tomorrow · 10:30 AM'
  }
  if (lower.includes('saturday') || lower.includes('weekend')) {
    return 'Saturday · 11:00 AM'
  }
  if (lower.includes('evening') || lower.includes('5') || lower.includes('6')) {
    return 'Tomorrow · 5:30 PM'
  }
  return 'Tomorrow · 2:00 PM'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message = '', selectedServiceId } = body as {
      message?: string
      selectedServiceId?: string
    }
    const lowerMsg = message.toLowerCase()

    const servicesSummary = INITIAL_SERVICES.map(
      (s) =>
        `${s.id}: ${s.name} ($${s.price}, duration: ${s.durationMin}m, hold deposit: $${s.holdDeposit}, no-show fee: $${s.noShowFee})`,
    ).join('\n')

    const staffSummary = INITIAL_STAFF.map(
      (st) =>
        `${st.id}: ${st.name} (${st.role}, rating: ${st.rating}★, specialties: ${st.specialties.join(', ')})`,
    ).join('\n')

    const matchedService = matchService(message, selectedServiceId)
    const matchedStylist = matchStylist(message, matchedService?.id)
    const proposedTimeSlot = matchSlot(message)

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
        const systemPrompt = `You are the AI Concierge for "SalonDesk Deposits", a luxury salon booking platform.
Core principle: "A hold, not a charge. $0 debited today. PayPal authorization holds reserve client time and prevent salon no-shows."
Available Services:
${servicesSummary}

Available Stylists:
${staffSummary}

Respond in concise, warm, highly polished luxury concierge tone (2-3 sentences max).
Explain that reserving a slot uses a PayPal authorization hold where $0 leaves their account today, and free cancellation is guaranteed up to 24 hours prior.`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nClient inquiry: "${message}"` }],
            },
          ],
        })

        return NextResponse.json({
          replyText: response.text || '',
          matchedService: matchedService || INITIAL_SERVICES[0],
          matchedStylist,
          proposedTimeSlot,
          hasProposal: true,
          model: 'gemini-2.5-flash',
        })
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local concierge engine:', geminiError)
      }
    }

    let replyText = ''
    if (
      lowerMsg.includes('policy') ||
      lowerMsg.includes('how does') ||
      lowerMsg.includes('charge') ||
      lowerMsg.includes('fee')
    ) {
      replyText = `At SalonDesk, we use PayPal authorization holds: no money leaves your card today ($0 debited). Your $${matchedService?.holdDeposit || 25} hold reserves ${matchedStylist.name}'s chair. You can cancel with 1 click free of charge up to 24 hours prior!`
    } else if (matchedService) {
      replyText = `Excellent choice! I have curated the "${matchedService.name}" ($${matchedService.price}, ${matchedService.durationMin} mins) with our ${matchedStylist.role}, ${matchedStylist.name}. Would you like to authorize the $${matchedService.holdDeposit} hold ($0 charged today) for ${proposedTimeSlot}?`
    } else {
      replyText =
        'Welcome to Crown & Blade Atelier. I can assist you with booking precision cuts, custom balayage, artisan braids, or facial treatments. All reservations use our $0-down PayPal authorization hold model. How may I style you today?'
    }

    return NextResponse.json({
      replyText,
      matchedService: matchedService || INITIAL_SERVICES[0],
      matchedStylist,
      proposedTimeSlot,
      hasProposal: Boolean(matchedService),
      model: 'salondesk-concierge-v1',
    })
  } catch (error) {
    console.error('Concierge route error:', error)
    return NextResponse.json(
      {
        replyText:
          "I'd be delighted to assist you with booking a service. Please pick a service below or let me know what look you'd like to achieve.",
        matchedService: INITIAL_SERVICES[0],
        matchedStylist: INITIAL_STAFF[0],
        proposedTimeSlot: 'Tomorrow · 2:00 PM',
        hasProposal: true,
      },
      { status: 200 },
    )
  }
}
