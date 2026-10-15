import './api/sharedApi'
import './api/platformApi'
import './api/orgApi'
import './api/clientApi'
import './slice/userApi'

import { configureStore } from '@reduxjs/toolkit'

import { adminDemoReducer } from './adminDemoSlice'
import authReducer from './authSlice'
import { baseApi } from './baseApi'
import bookingDraftReducer from './bookingDraftSlice'
import { clientDemoReducer } from './clientDemoSlice'
import { merchantDemoReducer } from './merchantDemoSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookingDraft: bookingDraftReducer,
    merchantDemo: merchantDemoReducer,
    adminDemo: adminDemoReducer,
    clientDemo: clientDemoReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
