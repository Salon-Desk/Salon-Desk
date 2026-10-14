'use client'

import { Edit2, Plus, Trash2 } from 'lucide-react'

import { Button, Card, IconButton } from '@/components/ui'
import type { StaffMember } from '@/types'

interface StaffTabProps {
  staff: StaffMember[]
  onAddStaff: () => void
  onEditStaff: (member: StaffMember) => void
  onDeleteStaff: (member: StaffMember) => void
}

export function StaffTab({ staff, onAddStaff, onEditStaff, onDeleteStaff }: StaffTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold text-slate-900 text-xl">Staff &amp; Stylist Management</h2>
          <p className="text-slate-600 text-xs">
            Configure staff working hours, breaks, specialties, and client capacity for
            authorization hold bookings.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onAddStaff}>
          <Plus className="h-3.5 w-3.5" />
          Add Stylist
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {staff.map((stylist) => (
          <Card
            key={stylist.id}
            hoverTone="amber"
            className="flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stylist.avatar}
                  alt={stylist.name}
                  className="h-14 w-14 rounded-full border-2 border-amber-300 object-cover"
                />
                <span
                  className={`rounded border px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${
                    stylist.status === 'ACTIVE'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-100 text-slate-600'
                  }`}
                >
                  {stylist.status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{stylist.name}</h3>
                <p className="font-semibold text-amber-800 text-xs">{stylist.role}</p>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  ★ {stylist.rating.toFixed(1)} ({stylist.reviewsCount} reviews)
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
                <div className="text-slate-700">
                  Hours: <strong className="text-slate-900">{stylist.workingHours}</strong>
                </div>
                <div className="text-[11px] text-slate-500">Break: {stylist.breakPeriod}</div>
                <div className="text-[11px] text-slate-500">
                  Max Clients: {stylist.maxSimultaneousClients || 1} at a time
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {stylist.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-medium text-[10px] text-slate-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-slate-100 border-t pt-3">
              <IconButton
                aria-label="Edit stylist"
                onClick={() => onEditStaff(stylist)}
                className="border border-slate-200 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                aria-label="Remove stylist"
                onClick={() => onDeleteStaff(stylist)}
                className="border border-rose-200 bg-rose-50 text-rose-700 shadow-xs hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
