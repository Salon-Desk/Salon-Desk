'use client'

import {
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  Mail,
  Phone,
  Sparkles,
  SquarePen,
  Trash2,
  UserRound,
} from 'lucide-react'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  staffAvatarGradient,
  staffDisplayName,
  staffInitials,
  staffPhone,
  staffPicture,
} from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import type { ApiOrgEmployeeShift } from '@/types/api-org'
import type { User } from '@/types/user'

interface MerchantStaffCardProps {
  member: User
  shifts?: ApiOrgEmployeeShift[]
  onCopyId: (id: string) => void
  isCopied?: boolean
  onEdit?: (member: User) => void
  onDelete?: (member: User) => void
  onManageShifts?: (member: User) => void
  onResendInvite?: (member: User) => void
  onResetPassword?: (member: User) => void
}

export function MerchantStaffCard({
  member,
  shifts = [],
  onCopyId,
  isCopied = false,
  onEdit,
  onDelete,
  onManageShifts,
  onResendInvite,
  onResetPassword,
}: MerchantStaffCardProps) {
  const name = staffDisplayName(member)
  const initials = staffInitials(name)
  const gradient = staffAvatarGradient(member.id || name)
  const picture = staffPicture(member)
  const phone = staffPhone(member)
  const isOwner = member.role === 'org_owner'
  const isActive = (member.status || 'active').toLowerCase() === 'active'

  const roleTone =
    member.role === 'org_owner' ? 'amber' : member.role === 'reception' ? 'sky' : 'emerald'
  const roleLabel =
    member.role === 'org_owner' ? 'Owner' : member.role === 'reception' ? 'Receptionist' : 'Stylist'

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.14),0_4px_12px_-2px_rgba(0,0,0,0.03)]">
      {/* Decorative top accent line with role-based gradient */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-1 transition-opacity duration-200 opacity-70 group-hover:opacity-100',
          member.role === 'org_owner'
            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
            : member.role === 'reception'
              ? 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600'
              : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600',
        )}
      />

      <div className="space-y-3.5">
        {/* Header: Unified Avatar + Name + Badges (prevents collision) */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={picture}
                alt={name}
                className="h-13 w-13 rounded-2xl border-2 border-white object-cover shadow-sm ring-1 ring-slate-200/80 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className={cn(
                  'flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-sm ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105',
                  gradient,
                )}
              >
                {initials || <UserRound className="h-6 w-6" />}
              </div>
            )}
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs',
                isActive ? 'bg-emerald-500' : 'bg-slate-400',
              )}
              title={isActive ? 'Active Member' : 'Inactive Member'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900 tracking-tight transition-colors group-hover:text-amber-800 truncate">
                  {name}
                </h3>
                {(member.profile?.handle || member.handle) && (
                  <p className="font-mono text-[11px] text-amber-700/90 font-medium">
                    @{member.profile?.handle || member.handle}
                  </p>
                )}
              </div>
              <StatusBadge tone={isActive ? 'emerald' : 'slate'} size="sm" dot>
                {member.status || 'Active'}
              </StatusBadge>
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <Badge tone={roleTone} size="sm" variant="soft" className="font-semibold">
                {roleLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact details card block with truncation and min-w-0 */}
        <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-600">
          <a
            href={`mailto:${member.email}`}
            className="flex items-center gap-2 truncate transition-colors hover:text-amber-800"
            title="Send email"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-amber-600" />
            <span className="truncate font-mono text-[11.5px]">{member.email}</span>
          </a>

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 truncate font-mono text-[11.5px] transition-colors hover:text-amber-800"
              title="Call phone number"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-amber-600" />
              <span className="truncate">{phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span className="italic text-[11px]">No phone provided</span>
            </div>
          )}
        </div>

        {/* Shift assignment badges */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Schedule</span>
            {onManageShifts && (
              <button
                type="button"
                onClick={() => onManageShifts(member)}
                className="cursor-pointer text-amber-700 hover:text-amber-900 hover:underline capitalize text-[11px] font-semibold"
              >
                Change
              </button>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {shifts.length > 0 ? (
              shifts.map((s) => {
                const daysLabel =
                  s.days && s.days.length > 0
                    ? s.days.map((d) => d.slice(0, 3).toUpperCase()).join(', ')
                    : null
                return (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200/90 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-amber-900 shadow-2xs"
                  >
                    <Clock className="h-2.5 w-2.5 text-amber-600" />
                    <span>{s.shift_name || 'Shift'}</span>
                    {daysLabel && (
                      <span className="text-[9.5px] text-amber-700/80 font-normal">
                        ({daysLabel})
                      </span>
                    )}
                  </span>
                )
              })
            ) : (
              <span className="text-[11px] text-slate-400 italic">Default salon hours</span>
            )}
          </div>
        </div>

        {member.category_ids && member.category_ids.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Capabilities
            </div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-800 border border-amber-300/40 px-2 py-0.5 text-[10.5px] font-semibold">
                <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                <span>
                  {member.category_ids.length} service{' '}
                  {member.category_ids.length === 1 ? 'category' : 'categories'} assigned
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions: Prevents collision with responsive flex-wrap and premium button styling */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onCopyId(member.id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-1 text-[11px] font-mono text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-900 cursor-pointer"
          title="Click to copy staff ID"
        >
          <span>ID: {member.id.slice(0, 8)}</span>
          {isCopied ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <Copy className="h-3 w-3 text-slate-400" />
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {onManageShifts && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageShifts(member)}
              title="Manage work shifts and schedule"
              className="h-8 gap-1.5 rounded-xl border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-2xs transition-all active:scale-95"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Shifts</span>
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(member)}
              title="Edit team member details"
              className="h-8 gap-1.5 rounded-xl border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-2xs transition-all active:scale-95"
            >
              <SquarePen className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </Button>
          )}
          {!isOwner && onResendInvite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResendInvite(member)}
              title="Resend invitation email with temporary credentials"
              className="h-8 gap-1 rounded-xl border-slate-200/90 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 shadow-2xs transition-all active:scale-95"
            >
              <Mail className="h-3.5 w-3.5 text-sky-600" />
              <span>Invite</span>
            </Button>
          )}

          {!isOwner && onResetPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResetPassword(member)}
              title="Reset password and email new temporary credentials"
              className="h-8 gap-1 rounded-xl border-slate-200/90 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-2xs transition-all active:scale-95"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              <span>Reset</span>
            </Button>
          )}

          {!isOwner && onResendInvite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResendInvite(member)}
              title="Resend invitation email with temporary credentials"
              className="h-8 gap-1 rounded-xl border-slate-200/90 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 shadow-2xs transition-all active:scale-95"
            >
              <Mail className="h-3.5 w-3.5 text-sky-600" />
              <span>Invite</span>
            </Button>
          )}

          {!isOwner && onResetPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResetPassword(member)}
              title="Reset password and email new temporary credentials"
              className="h-8 gap-1 rounded-xl border-slate-200/90 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-2xs transition-all active:scale-95"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              <span>Reset</span>
            </Button>
          )}

          {!isOwner && onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(member)}
              title="Remove member from roster"
              className="h-8 w-8 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-transparent transition-all active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
