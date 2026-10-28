'use client'

import {
  AlertCircle,
  Calendar,
  CalendarOff,
  Clock,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react'
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
  useCreateMyTimeOffMutation,
  useDeleteEmployeeShiftMutation,
  useDeleteMyShiftMutation,
  useDeleteMyTimeOffMutation,
  useGetMyEmployeeShiftsQuery,
  useGetMyEmployeesQuery,
  useGetMyShiftsQuery,
  useGetMyTimeOffQuery,
  useUpdateEmployeeShiftMutation,
} from '@/store/api/orgApi'
import type { ApiOrgEmployeeShift, ApiOrgShift } from '@/types/api-org'
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

const WEEK_DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
]

export function StaffShiftsModal({ open, onClose, initialEmployeeId }: StaffShiftsModalProps) {
  const { data: shifts = [] } = useGetMyShiftsQuery(undefined, { skip: !open })
  const { data: employeeShifts = [] } = useGetMyEmployeeShiftsQuery(undefined, { skip: !open })
  const { data: timeOffRecords = [] } = useGetMyTimeOffQuery(undefined, { skip: !open })
  const { data: staffData } = useGetMyEmployeesQuery({ page: 1, page_size: 100 }, { skip: !open })
  const employees: User[] = staffData?.items ?? []

  const [createShift] = useCreateMyShiftMutation()
  const [deleteShift] = useDeleteMyShiftMutation()
  const [assignShift, { isLoading: isAssigning }] = useAssignEmployeeShiftMutation()
  const [updateShift] = useUpdateEmployeeShiftMutation()
  const [removeAssignment, { isLoading: isRemoving }] = useDeleteEmployeeShiftMutation()
  const [createTimeOff, { isLoading: isCreatingTimeOff }] = useCreateMyTimeOffMutation()
  const [deleteTimeOff] = useDeleteMyTimeOffMutation()

  const [activeTab, setActiveTab] = useState<'assignments' | 'timeoff' | 'templates'>('assignments')
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>(initialEmployeeId || 'all')

  // Time off form states
  const [timeOffUserId, setTimeOffUserId] = useState<string>('')
  const [timeOffStartDate, setTimeOffStartDate] = useState<string>('')
  const [timeOffEndDate, setTimeOffEndDate] = useState<string>('')
  const [timeOffReason, setTimeOffReason] = useState<string>('')

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
      await assignShift({
        user_id: userId,
        org_shift_id: shiftId,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      }).unwrap()
      toast.success('Shift assigned to team member', toastColor.success)
    } catch (err) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail || 'Failed to assign shift'
      toast.error(String(msg), toastColor.error)
    }
  }

  const handleToggleDay = async (assignment: ApiOrgEmployeeShift, dayKey: string) => {
    const currentDays =
      assignment.days && assignment.days.length > 0
        ? assignment.days
        : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

    const isDayActive = currentDays.includes(dayKey)
    const newDays = isDayActive ? currentDays.filter((d) => d !== dayKey) : [...currentDays, dayKey]

    if (newDays.length === 0) {
      toast.error('A shift assignment must have at least one working day', toastColor.error)
      return
    }

    try {
      await updateShift({
        assignmentId: assignment.id,
        body: { days: newDays },
      }).unwrap()
      toast.success('Working days updated', toastColor.success)
    } catch (err) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to update working days'
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

  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeOffUserId) {
      toast.error('Please select an employee', toastColor.error)
      return
    }
    if (!timeOffStartDate || !timeOffEndDate) {
      toast.error('Please specify start and end dates', toastColor.error)
      return
    }
    if (timeOffStartDate > timeOffEndDate) {
      toast.error('Start date cannot be after end date', toastColor.error)
      return
    }

    try {
      await createTimeOff({
        user_id: timeOffUserId,
        start_date: timeOffStartDate,
        end_date: timeOffEndDate,
        reason: timeOffReason.trim() || undefined,
      }).unwrap()
      toast.success('Time off scheduled successfully', toastColor.success)
      setTimeOffStartDate('')
      setTimeOffEndDate('')
      setTimeOffReason('')
    } catch (err) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to schedule time off'
      toast.error(String(msg), toastColor.error)
    }
  }

  const handleDeleteTimeOff = async (id: string) => {
    try {
      await deleteTimeOff(id).unwrap()
      toast.success('Time off entry removed', toastColor.success)
    } catch (err) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to remove time off'
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
              Staff Scheduling &amp; Capabilities
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Manage weekly assigned shifts, employee time off / days off, and reusable shift
              templates.
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
              <span>Assigned Shifts ({employeeShifts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeoff')}
              className={cn(
                'inline-flex items-center gap-2 pb-3 pt-1 text-xs font-bold border-b-2 transition-all cursor-pointer',
                activeTab === 'timeoff'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              <CalendarOff className="h-4 w-4" />
              <span>Time Off &amp; Days Off ({timeOffRecords.length})</span>
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
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-2xs"
                    >
                      {/* Top row: Member Info + Assign dropdown */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                {name}
                              </h4>
                              <span className="text-[10px] rounded-md bg-slate-200/80 px-1.5 py-0.5 font-medium text-slate-600 capitalize">
                                {member.role || 'stylist'}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400">{member.email}</p>
                          </div>
                        </div>

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
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-amber-400 focus:outline-hidden cursor-pointer"
                          >
                            <option value="" disabled>
                              + Assign Shift Template…
                            </option>
                            {shifts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Assigned Shifts List with Weekly Day Pickers */}
                      {memberAssignments.length === 0 ? (
                        <p className="text-xs italic text-slate-400 pl-1">
                          No shifts assigned. Uses standard salon working hours.
                        </p>
                      ) : (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          {memberAssignments.map((assignment) => {
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
                            const assignedDays =
                              assignment.days && assignment.days.length > 0
                                ? assignment.days
                                : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

                            return (
                              <div
                                key={assignment.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 shadow-2xs"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  <span className="text-xs font-bold text-amber-950">
                                    {shiftName}
                                  </span>
                                  {timeLabel && (
                                    <span className="font-mono text-[11px] text-amber-800/80 font-normal">
                                      ({timeLabel})
                                    </span>
                                  )}
                                </div>

                                {/* Weekly days selection badges */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                                    Days:
                                  </span>
                                  {WEEK_DAYS.map((wd) => {
                                    const isActive = assignedDays.includes(wd.key)
                                    return (
                                      <button
                                        key={wd.key}
                                        type="button"
                                        onClick={() => void handleToggleDay(assignment, wd.key)}
                                        title={`Toggle ${wd.label}`}
                                        className={cn(
                                          'h-6 w-8 rounded text-[10px] font-bold transition-all cursor-pointer',
                                          isActive
                                            ? 'bg-amber-600 text-white shadow-2xs'
                                            : 'bg-white text-slate-400 border border-slate-200 hover:border-amber-300 hover:text-slate-700',
                                        )}
                                      >
                                        {wd.label}
                                      </button>
                                    )
                                  })}

                                  <button
                                    type="button"
                                    onClick={() => void handleRemoveAssignment(assignment.id)}
                                    className="ml-2 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors p-1"
                                    title="Unassign shift"
                                    disabled={isRemoving}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIME OFF & DAYS OFF */}
        {activeTab === 'timeoff' && (
          <div className="space-y-5">
            {/* Schedule time off form */}
            <form
              onSubmit={(e) => void handleCreateTimeOff(e)}
              className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span>Schedule Employee Day Off / Time Off</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mark staff as unavailable during specific dates. The booking matching algorithm
                automatically excludes them from availability.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Team Member
                  </label>
                  <select
                    value={timeOffUserId}
                    onChange={(e) => setTimeOffUserId(e.target.value)}
                    required
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="" disabled>
                      Select employee…
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {staffDisplayName(emp)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={timeOffStartDate}
                    onChange={(e) => setTimeOffStartDate(e.target.value)}
                    required
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={timeOffEndDate}
                    onChange={(e) => setTimeOffEndDate(e.target.value)}
                    required
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vacation, Sick leave"
                    value={timeOffReason}
                    onChange={(e) => setTimeOffReason(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <PrimaryButton
                  title={isCreatingTimeOff ? 'Scheduling…' : 'Schedule Day Off'}
                  isLoading={isCreatingTimeOff}
                  type="submit"
                  size="sm"
                  fullWidth={false}
                  className="h-9 px-4 text-xs font-bold rounded-xl"
                />
              </div>
            </form>

            {/* List of Time Off records */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Scheduled Time Off Records</h4>
              {timeOffRecords.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 italic">
                  No time off currently scheduled for any staff member.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {timeOffRecords.map((to) => {
                    return (
                      <div
                        key={to.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-amber-300 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {to.employee_name || 'Staff Member'}
                            </span>
                            {to.reason && (
                              <span className="text-[10px] rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 font-medium">
                                {to.reason}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {to.start_date} &rarr; {to.end_date}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteTimeOff(to.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                          title="Remove time off"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SHIFT TEMPLATES */}
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
                  <span>Create Reusable Shift Template</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <RHFTextField
                    name="name"
                    label="Shift Name"
                    placeholder="e.g. Morning Shift"
                    isRequired
                  />
                  <RHFTextField name="startTime" label="Start Time" type="time" isRequired />
                  <RHFTextField name="endTime" label="End Time" type="time" isRequired />
                </div>
                <div className="flex justify-end pt-1">
                  <PrimaryButton
                    title={methods.formState.isSubmitting ? 'Creating…' : 'Create Template'}
                    isLoading={methods.formState.isSubmitting}
                    type="submit"
                    size="sm"
                    fullWidth={false}
                    className="h-9 px-4 text-xs font-bold rounded-xl"
                  />
                </div>
              </div>
            </FormProvider>

            {/* Existing Templates List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Existing Shift Templates</h4>
              {shifts.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 italic">
                  No shift templates yet. Use the form above to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {shifts.map((shift) => {
                    const windows = (shift.data as { windows?: string[][] })?.windows || []
                    const timeLabel =
                      Array.isArray(windows) && windows[0]
                        ? `${windows[0][0]} – ${windows[0][1]}`
                        : 'Custom Hours'

                    return (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-amber-300 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">{shift.name}</h5>
                            <span className="font-mono text-[11px] text-slate-500">
                              {timeLabel}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteShift(shift.id, shift.name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
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
