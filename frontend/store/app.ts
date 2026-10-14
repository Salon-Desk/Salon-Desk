// Ensure endpoint injection for RTK Query slices
import './slice/authApi'
import './slice/userApi'
import './slice/organizationApi'
import './slice/adminApi'
import './slice/catalogApi'
import './slice/bookingsApi'
import './slice/paymentsApi'

import { configureStore } from '@reduxjs/toolkit'

import { apiSlice } from './apiSlice'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
