'use client'

import { Edit2, Plus, Star, Trash2 } from 'lucide-react'

import { Button, Card, IconButton } from '@/components/ui'

import { useMerchantContext } from '../_context/merchant-context'

export default function MerchantStaffPage() {
  const { state, openAddStaff, openEditStaff, openDeleteStaff } = useMerchantContext()

  const totalClientsCapacity = state.staff.reduce(
    (acc, s) => acc + (s.maxSimultaneousClients || 1),
    0,
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Staff &amp; Stylists
          </h1>
          <p className="text-slate-500 text-xs">
            {state.staff.length} active stylists · {totalClientsCapacity} concurrent client capacity
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddStaff}
          className="rounded-xl px-3.5 py-2 font-medium text-xs shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Stylist
        </Button>
      </div>

      {/* Stylist Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.staff.map((stylist) => (
          <Card
            key={stylist.id}
            hoverTone="amber"
            className="flex flex-col justify-between space-y-4 rounded-3xl p-5 border border-slate-200/90 bg-white shadow-xs transition-all hover:shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stylist.avatar}
                    alt={stylist.name}
                    className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-[11px] text-emerald-800">
                  {stylist.status || 'Active'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{stylist.name}</h3>
                <p className="text-xs font-medium text-amber-800">{stylist.role}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <span className="ml-1 font-bold text-slate-800">
                      {stylist.rating.toFixed(1)}
                    </span>
                  </div>
                  <span>·</span>
                  <span>{stylist.reviewsCount} reviews</span>
                </div>
              </div>

              {/* Working Hours & Capacity Box */}
              <div className="space-y-1 rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Shift:</span>
                  <span className="font-medium text-slate-900 font-mono text-[11px]">
                    {stylist.workingHours}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Concurrent chairs:</span>
                  <span className="font-semibold text-slate-900 text-[11px]">
                    {stylist.maxSimultaneousClients || 1} client max
                  </span>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1">
                {stylist.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-[10px] text-slate-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-slate-100 border-t pt-3">
              <span className="font-mono text-[10px] text-slate-400">{stylist.id}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditStaff(stylist)}
                  className="rounded-xl font-medium text-xs h-7 px-2.5"
                >
                  <Edit2 className="h-3 w-3 mr-1 text-slate-500" />
                  Edit
                </Button>
                <IconButton
                  aria-label="Remove stylist"
                  onClick={() => openDeleteStaff(stylist)}
                  className="rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 h-7 w-7"
                >
                  <Trash2 className="h-3 w-3" />
                </IconButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
