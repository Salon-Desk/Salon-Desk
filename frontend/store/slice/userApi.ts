import type { MessageOut } from '@/types/auth'
import type { User } from '@/types/user'

import { apiSlice } from '../apiSlice'

export interface CreateEmployeeRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'reception' | 'stylist'
  middle_name?: string | null
  phone?: string | null
}

export interface CreateStaffRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  middle_name?: string | null
  phone?: string | null
}

export interface AssignShiftRequest {
  user_id: string
  org_shift_id: string
}

/**
 * SalonDesk RTK Query user and staff management endpoints.
 * Corresponds to postman/collection.json:
 * - GET    /api/v1/organizations/me/employees
 * - POST   /api/v1/organizations/me/employees
 * - DELETE /api/v1/organizations/me/employees/:employee_id
 * - POST   /api/v1/organizations/me/employee-shifts
 * - POST   /api/v1/admin/staff
 * - DELETE /api/v1/admin/staff/:staff_id
 */
export const userApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Salon staff
    getEmployees: builder.query<User[], void>({
      query: () => ({
        url: '/api/v1/organizations/me/employees',
        method: 'GET',
      }),
      providesTags: ['user'],
    }),

    addEmployee: builder.mutation<User, CreateEmployeeRequest>({
      query: (data) => ({
        url: '/api/v1/organizations/me/employees',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['user'],
    }),

    deleteEmployee: builder.mutation<MessageOut, string>({
      query: (employeeId) => ({
        url: `/api/v1/organizations/me/employees/${employeeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['user'],
    }),

    assignShift: builder.mutation<unknown, AssignShiftRequest>({
      query: (data) => ({
        url: '/api/v1/organizations/me/employee-shifts',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['user'],
    }),

    // Admin staff
    addAdminStaff: builder.mutation<User, CreateStaffRequest>({
      query: (data) => ({
        url: '/api/v1/admin/staff',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['user'],
    }),

    deleteAdminStaff: builder.mutation<MessageOut, string>({
      query: (staffId) => ({
        url: `/api/v1/admin/staff/${staffId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['user'],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useAddEmployeeMutation,
  useDeleteEmployeeMutation,
  useAssignShiftMutation,
  useAddAdminStaffMutation,
  useDeleteAdminStaffMutation,
} = userApi
