import { combineReducers } from '@reduxjs/toolkit'

import { apiSlice } from './apiSlice'
import authSlice from './authSlice'

export const rootReducer = combineReducers({
  auth: authSlice,
  [apiSlice.reducerPath]: apiSlice.reducer,
})
