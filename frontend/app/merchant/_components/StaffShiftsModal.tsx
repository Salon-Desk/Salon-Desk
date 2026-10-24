'use client'

import { AlertCircle, Clock, Layers, Plus, Sparkles, Trash2, UserCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextField from '@/components/forms/RHFTextField'
import { toastColor } from '@/constant/toast-color'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import {
  staffAvatarGradient,
  staffDisplayName,
  staffInitials,
  staffPicture,
} from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import {
  useAssignEmployeeShiftMutation,
  useCreateMyShiftMutation,
  useDeleteEmployeeShiftMutation,
  useDeleteMyShiftMutation,
  useGetMyEmployeeShiftsQuery,
  useGetMyEmployeesQuery,
  useGetMyShiftsQuery,
} from '@/store/api/orgApi'
import type { ApiOrgShift } from '@/types/api-org'
import type { User } from '@/types/user'

import {
  createShiftDefaultValues,
  type CreateShiftFormData,
  createShiftSchema,
} from '../_schemas/shift.schema'

interface StaffShiftsModalProps {
  open: boolean
  onClose: () => void
  initialEmployeeId?: string | null
}

export function StaffShiftsModal({ open, onClose, initialEmployeeId }: StaffShiftsModalProps) {
  const { data: shifts = [] } = useGetMyShiftsQuery(undefined, {
    skip: !open,
  })
  const { data: employeeShifts = [] } = useGetMyEmployeeShiftsQuery(undefined, { skip: !open })
  const { data: staffData } = useGetMyEmployeesQuery({ page: 1, page_size: 100 }, { skip: !open })
  const employees: User[] = staffData?.items ?? []

  const [createShift, { isLoading: isCreatingShift }] = useCreateMyShiftMutation()
  const [deleteShift, { isLoading: isDeletingShift }] = useDeleteMyShiftMutation()
  const [assignShift, { isLoading: isAssigning }] = useAssignEmployeeShiftMutation()
  const [removeAssignment, { isLoading: isRemoving }] = useDeleteEmployeeShiftMutation()

  const [activeTab, setActiveTab] = useState<'assignments' | 'templates'>('assignments')
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>(initialEmployeeId || 'all')

  const methods = useForm<CreateShiftFormData>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: createShiftDefaultValues,
    mode: 'onBlur',
  })

  const submitShiftHandler = useFormSubmitHandler<CreateShiftFormData, ApiOrgShift>(
    async (body: CreateShiftFormData) => {
      const res = await createShift({
        name: body.name.trim(),
        data: {
          windows: [[body.startTime, body.endTime]],
        },
      }).unwrap()
      return { data: res }
    },
    () => {
      methods.reset(createShiftDefaultValues)
    },
    'Shift template created successfully',
  )

  const onSubmitShift = async (data: CreateShiftFormData) => {
    await submitShiftHandler(data)
  }

  const handleDeleteShift = async (shiftId: string, shiftName: string) => {
    try {
      await deleteShift(shiftId).unwrap()
      toast.success(`Deleted shift "${shiftName}"`, toastColor.success)
    } catch (err) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail || 'Failed to delete shift'
      toast.error(String(msg), toastColor.error)
    }
  }

  const handleAssignShift = async (userId: string, shiftId: string) => {
    try {
      await assignShift({ user_id: userId, org_shift_id: shiftId }).unwrap()
      toast.success('Shift assigned to team member', toastColor.success)
    } catch (err) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail || 'Failed to assign shift'
      toast.error(String(msg), toastColor.error)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await removeAssignment(assignmentId).unwrap()
      toast.success('Shift assignment removed', toastColor.success)
    } catch (err) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail || 'Failed to remove shift'
      toast.error(String(msg), toastColor.error)
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    if (selectedEmpFilter !== 'all') {
      return emp.id === selectedEmpFilter
    }
    return true
  })

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(val) => {
        if (!val) onClose()
      }}
      classNameContent="max-w-3xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-300/40">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Staff Shifts &amp; Work Hours
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Define reusable shift schedules and assign them to your stylists and receptionists.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={cn(
                'inline-flex items-center gap-2 pb-3 pt-1 text-xs font-bold border-b-2 transition-all cursor-pointer',
                activeTab === 'assignments'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              <UserCheck className="h-4 w-4" />
              <span>Staff Assignments ({employeeShifts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={cn(
                'inline-flex items-center gap-2 pb-3 pt-1 text-xs font-bold border-b-2 transition-all cursor-pointer',
                activeTab === 'templates'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              <Layers className="h-4 w-4" />
              <span>Shift Templates ({shifts.length})</span>
            </button>
          </div>

          {activeTab === 'assignments' && employees.length > 1 && (
            <div className="pb-2">
              <select
                aria-label="Filter by team member"
                value={selectedEmpFilter}
                onChange={(e) => setSelectedEmpFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">All Team Members</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {staffDisplayName(emp)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: STAFF ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {shifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/50 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-600/80" />
                <h3 className="mt-2 text-sm font-bold text-slate-900">
                  No Shift Templates Defined
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-sm mx-auto">
                  Before assigning shifts to your team, create your first shift template (e.g.{' '}
                  &ldquo;Morning Shift&rdquo; 09:00 - 15:00).
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Shift Template</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map((member) => {
                  const name = staffDisplayName(member)
                  const initials = staffInitials(name)
                  const gradient = staffAvatarGradient(member.id || name)
                  const picture = staffPicture(member)
                  const memberAssignments = employeeShifts.filter((es) => es.user_id === member.id)

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:bg-white hover:border-slate-300 hover:shadow-2xs sm:flex-row sm:items-center sm:justify-between"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-3">
                        {picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={picture}
                            alt={name}
                            className="h-10 w-10 rounded-xl border border-slate-200 object-cover shadow-2xs"
                          />
                        ) : (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xs font-bold text-white shadow-2xs`}
                          >
                            {initials}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{name}</h4>
                            <span className="text-[10px] rounded-md bg-slate-200/80 px-1.5 py-0.5 font-medium text-slate-600 capitalize">
                              {member.role || 'stylist'}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400">{member.email}</p>
                        </div>
                      </div>

                      {/* Assigned Shifts & Quick Assign */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {memberAssignments.length === 0 ? (
                          <span className="text-xs italic text-slate-400">
                            Uses salon default hours
                          </span>
                        ) : (
                          memberAssignments.map((assignment) => {
                            const shift = shifts.find((s) => s.id === assignment.org_shift_id)
                            const shiftName = assignment.shift_name || shift?.name || 'Shift'
                            const windows =
                              assignment.shift_data?.windows ||
                              (shift?.data as { windows?: string[][] })?.windows ||
                              []
                            const timeLabel =
                              Array.isArray(windows) && windows[0]
                                ? `${windows[0][0]} – ${windows[0][1]}`
                                : ''

                            return (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-2xs"
                              >
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>{shiftName}</span>
                                {timeLabel && (
                                  <span className="font-mono text-[10px] text-amber-700/80 font-normal">
                                    ({timeLabel})
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveAssignment(assignment.id)}
                                  className="ml-1 text-amber-600 hover:text-rose-600 cursor-pointer transition-colors"
                                  title="Unassign shift"
                                  disabled={isRemoving}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          })
                        )}

                        {/* Assign dropdown */}
                        <div className="flex items-center gap-1">
                          <select
                            aria-label={`Assign shift to ${name}`}
                            onChange={(e) => {
                              if (e.target.value) {
                                void handleAssignShift(member.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            defaultValue=""
                            disabled={isAssigning}
                            className="h-7.5 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-amber-400 focus:outline-hidden cursor-pointer"
                          >
                            <option value="" disabled>
                              + Assign Shift…
                            </option>
                            {shifts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SHIFT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-5">
            {/* Create Template Form using useFormSubmitHandler and RHF components */}
            <FormProvider
              methods={methods}
              onSubmit={(e) => void methods.handleSubmit(onSubmitShift)(e)}
            >
              <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Create New Shift Template</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <RHFTextField
                      name="name"
                      label="Shift Name"
                      placeholder="e.g. Morning Shift"
                      isRequired
                    />
                  </div>

                  <div>
                    <RHFTextField name="startTime" label="Start Time" type="time" isRequired />
                  </div>

                  <div>
                    <RHFTextField name="endTime" label="End Time" type="time" isRequired />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <PrimaryButton
                    title="Add Shift Template"
                    type="submit"
                    size="sm"
                    fullWidth={false}
                    isLoading={isCreatingShift}
                    icon={<Plus className="h-3.5 w-3.5" />}
                    className="h-9 rounded-xl px-4 text-xs font-bold"
                  />
                </div>
              </div>
            </FormProvider>

            {/* List Existing Shift Templates */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Configured Shifts ({shifts.length})
              </h4>

              {shifts.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  No shift templates have been created yet. Add one above to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {shifts.map((shift) => {
                    const windows = (shift.data as { windows?: string[][] })?.windows || []
                    const timeLabel =
                      Array.isArray(windows) && windows[0]
                        ? `${windows[0][0]} – ${windows[0][1]}`
                        : 'Custom Hours'

                    return (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-900">{shift.name}</span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>{timeLabel}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteShift(shift.id, shift.name)}
                          disabled={isDeletingShift}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete shift template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomResponsiveDialog>
  )
}
