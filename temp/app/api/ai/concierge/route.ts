import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_SERVICES, INITIAL_STAFF } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message = '', history = [], selectedServiceId } = body;
    const lowerMsg = message.toLowerCase();

    // Context preparation
    const servicesSummary = INITIAL_SERVICES.map(
      (s) => `${s.id}: ${s.name} ($${s.price}, duration: ${s.durationMin}m, hold deposit: $${s.holdDeposit}, no-show fee: $${s.noShowFee})`
    ).join('\n');

    const staffSummary = INITIAL_STAFF.map(
      (st) => `${st.id}: ${st.name} (${st.role}, rating: ${st.rating}★, specialties: ${st.specialties.join(', ')})`
    ).join('\n');

    // Deterministic matching helper
    let matchedService = INITIAL_SERVICES.find((s) => s.id === selectedServiceId);
    if (!matchedService) {
      if (lowerMsg.includes('balayage') || lowerMsg.includes('color') || lowerMsg.includes('blonde')) {
        matchedService = INITIAL_SERVICES.find((s) => s.id === 'srv-2');
      } else if (lowerMsg.includes('fade') || lowerMsg.includes('haircut') || lowerMsg.includes('towel') || lowerMsg.includes('beard')) {
        matchedService = INITIAL_SERVICES.find((s) => s.id === 'srv-1');
      } else if (lowerMsg.includes('silk') || lowerMsg.includes('press') || lowerMsg.includes('moisture')) {
        matchedService = INITIAL_SERVICES.find((s) => s.id === 'srv-3');
      } else if (lowerMsg.includes('braid') || lowerMsg.includes('cornrow') || lowerMsg.includes('loc')) {
        matchedService = INITIAL_SERVICES.find((s) => s.id === 'srv-4');
      } else if (lowerMsg.includes('facial') || lowerMsg.includes('spa') || lowerMsg.includes('skin') || lowerMsg.includes('hydro')) {
        matchedService = INITIAL_SERVICES.find((s) => s.id === 'srv-5');
      }
    }

    let matchedStylist = INITIAL_STAFF[0];
    if (lowerMsg.includes('elena') || matchedService?.id === 'srv-2') {
      matchedStylist = INITIAL_STAFF.find((st) => st.id === 'stf-2') || INITIAL_STAFF[0];
    } else if (lowerMsg.includes('kai') || matchedService?.id === 'srv-3' || matchedService?.id === 'srv-4') {
      matchedStylist = INITIAL_STAFF.find((st) => st.id === 'stf-3') || INITIAL_STAFF[0];
    } else if (lowerMsg.includes('marcus') || matchedService?.id === 'srv-1' || matchedService?.id === 'srv-5') {
      matchedStylist = INITIAL_STAFF.find((st) => st.id === 'stf-1') || INITIAL_STAFF[0];
    }

    let proposedTimeSlot = 'Tomorrow · 2:00 PM';
    if (lowerMsg.includes('morning') || lowerMsg.includes('10') || lowerMsg.includes('11')) {
      proposedTimeSlot = 'Tomorrow · 10:30 AM';
    } else if (lowerMsg.includes('saturday') || lowerMsg.includes('weekend')) {
      proposedTimeSlot = 'Saturday · 11:00 AM';
    } else if (lowerMsg.includes('evening') || lowerMsg.includes('5') || lowerMsg.includes('6')) {
      proposedTimeSlot = 'Tomorrow · 5:30 PM';
    }

    // Try Gemini if API key is provided
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemPrompt = `You are the AI Concierge for "SalonDesk Deposits", a luxury salon booking platform.
Core principle: "A hold, not a charge. $0 debited today. PayPal authorization holds reserve client time and prevent salon no-shows."
Available Services:
${servicesSummary}

Available Stylists:
${staffSummary}

Respond in concise, warm, highly polished luxury concierge tone (2-3 sentences max).
Explain that reserving a slot uses a PayPal authorization hold where $0 leaves their account today, and free cancellation is guaranteed up to 24 hours prior.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nClient inquiry: "${message}"` }],
            },
          ],
        });

        const text = response.text || '';
        return NextResponse.json({
          replyText: text,
          matchedService: matchedService || INITIAL_SERVICES[0],
          matchedStylist,
          proposedTimeSlot,
          hasProposal: true,
          model: 'gemini-2.5-flash',
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local concierge engine:', geminiError);
      }
    }

    // Intelligent fallback
    let replyText = '';
    if (lowerMsg.includes('policy') || lowerMsg.includes('how does') || lowerMsg.includes('charge') || lowerMsg.includes('fee')) {
      replyText = `At SalonDesk, we use PayPal authorization holds: no money leaves your card today ($0 debited). Your $${matchedService?.holdDeposit || 25} hold reserves ${matchedStylist.name}'s chair. You can cancel with 1 click free of charge up to 24 hours prior!`;
    } else if (matchedService) {
      replyText = `Excellent choice! I have curated the "${matchedService.name}" ($${matchedService.price}, ${matchedService.durationMin} mins) with our ${matchedStylist.role}, ${matchedStylist.name}. Would you like to authorize the $${matchedService.holdDeposit} hold ($0 charged today) for ${proposedTimeSlot}?`;
    } else {
      replyText = `Welcome to Crown & Blade Atelier. I can assist you with booking precision cuts, custom balayage, artisan braids, or facial treatments. All reservations use our $0-down PayPal authorization hold model. How may I style you today?`;
    }

    return NextResponse.json({
      replyText,
      matchedService: matchedService || INITIAL_SERVICES[0],
      matchedStylist,
      proposedTimeSlot,
      hasProposal: Boolean(matchedService),
      model: 'salondesk-concierge-v1',
    });
  } catch (error) {
    console.error('Concierge route error:', error);
    return NextResponse.json(
      {
        replyText: "I'd be delighted to assist you with booking a service. Please pick a service below or let me know what look you'd like to achieve.",
        matchedService: INITIAL_SERVICES[0],
        matchedStylist: INITIAL_STAFF[0],
        proposedTimeSlot: 'Tomorrow · 2:00 PM',
        hasProposal: true,
      },
      { status: 200 }
    );
  }
}
