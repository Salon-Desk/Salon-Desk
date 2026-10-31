import type {
  DisputeCase,
  DisputeListResponse,
  SlotRescueResponse,
  WaitlistEntry,
} from '@/types/dispute'

import { baseApi } from '../baseApi'

export const disputeApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listDisputes: builder.query<DisputeListResponse, void>({
      query: () => ({
        url: '/api/v1/disputes',
        method: 'GET',
      }),
      providesTags: ['disputes'],
    }),

    getDisputeForBooking: builder.query<DisputeCase, string>({
      query: (bookingId) => ({
        url: `/api/v1/disputes/booking/${bookingId}`,
        method: 'GET',
      }),
      providesTags: ['disputes'],
    }),

    simulateDispute: builder.mutation<
      DisputeCase,
      { bookingId: string; reason?: string; dispute_amount?: number | string }
    >({
      query: ({ bookingId, reason, dispute_amount }) => ({
        url: `/api/v1/disputes/booking/${bookingId}/simulate`,
        method: 'POST',
        data: { reason, dispute_amount },
      }),
      invalidatesTags: ['disputes', 'bookings'],
    }),

    submitDisputeEvidence: builder.mutation<DisputeCase, { disputeId: string }>({
      query: ({ disputeId }) => ({
        url: `/api/v1/disputes/${disputeId}/submit-evidence`,
        method: 'POST',
        data: {},
      }),
      invalidatesTags: ['disputes'],
    }),

    makeDisputeOffer: builder.mutation<
      DisputeCase,
      { disputeId: string; offer_amount: number | string; note?: string }
    >({
      query: ({ disputeId, offer_amount, note }) => ({
        url: `/api/v1/disputes/${disputeId}/make-offer`,
        method: 'POST',
        data: { offer_amount, note },
      }),
      invalidatesTags: ['disputes'],
    }),

    adjudicateSandboxDispute: builder.mutation<
      DisputeCase,
      { disputeId: string; outcome?: 'SELLER_FAVOR' | 'BUYER_FAVOR' }
    >({
      query: ({ disputeId, outcome = 'SELLER_FAVOR' }) => ({
        url: `/api/v1/disputes/${disputeId}/adjudicate-sandbox`,
        method: 'POST',
        data: { outcome },
      }),
      invalidatesTags: ['disputes'],
    }),

    getBookingWaitlist: builder.query<WaitlistEntry[], string>({
      query: (bookingId) => ({
        url: `/api/v1/settlements/${bookingId}/waitlist`,
        method: 'GET',
      }),
      providesTags: ['bookings'],
    }),

    rescueSlot: builder.mutation<
      SlotRescueResponse,
      { bookingId: string; waitlist_entry_id?: string }
    >({
      query: ({ bookingId, waitlist_entry_id }) => ({
        url: `/api/v1/settlements/${bookingId}/rescue-slot`,
        method: 'POST',
        params: waitlist_entry_id ? { waitlist_entry_id } : undefined,
      }),
      invalidatesTags: ['bookings', 'payments', 'disputes'],
    }),
  }),
})

export const {
  useListDisputesQuery,
  useGetDisputeForBookingQuery,
  useSimulateDisputeMutation,
  useSubmitDisputeEvidenceMutation,
  useMakeDisputeOfferMutation,
  useAdjudicateSandboxDisputeMutation,
  useGetBookingWaitlistQuery,
  useRescueSlotMutation,
} = disputeApi
