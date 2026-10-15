import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface ConciergeDraftMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BookingDraftState {
  orgId: string | null
  serviceIds: string[]
  startsAt: string | null
  stylistId: string | null
  customerNotes: string | null
  returnPath: string | null
  resumeAfterAuth: boolean
  conciergeMessages: ConciergeDraftMessage[]
  selectedServiceName: string | null
}

const initialState: BookingDraftState = {
  orgId: null,
  serviceIds: [],
  startsAt: null,
  stylistId: null,
  customerNotes: null,
  returnPath: null,
  resumeAfterAuth: false,
  conciergeMessages: [],
  selectedServiceName: null,
}

const bookingDraftSlice = createSlice({
  name: 'bookingDraft',
  initialState,
  reducers: {
    setBookingDraft: (state, action: PayloadAction<Partial<BookingDraftState>>) => {
      Object.assign(state, action.payload)
      if (action.payload.serviceIds) {
        state.serviceIds = action.payload.serviceIds
      }
    },
    pauseBookingForAuth: (
      state,
      action: PayloadAction<{ returnPath: string; resumeAfterAuth?: boolean }>,
    ) => {
      state.returnPath = action.payload.returnPath
      state.resumeAfterAuth = action.payload.resumeAfterAuth ?? true
    },
    appendConciergeMessage: (state, action: PayloadAction<ConciergeDraftMessage>) => {
      state.conciergeMessages.push(action.payload)
    },
    clearBookingDraft: () => initialState,
  },
})

export const { setBookingDraft, pauseBookingForAuth, appendConciergeMessage, clearBookingDraft } =
  bookingDraftSlice.actions

export default bookingDraftSlice.reducer

export const bookingDraftSelector = (state: { bookingDraft: BookingDraftState }) =>
  state.bookingDraft

export const hasPendingBookingDraft = (state: { bookingDraft: BookingDraftState }) =>
  state.bookingDraft.resumeAfterAuth &&
  (state.bookingDraft.serviceIds.length > 0 || Boolean(state.bookingDraft.startsAt))
