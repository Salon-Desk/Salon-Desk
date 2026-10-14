"use client";

import { Plus, Trash2 } from "lucide-react";
import { Badge, Button, IconButton } from "@/components/ui";
import { useAdminContext } from "../_context/admin-context";

export default function AdminStaffPage() {
  const {
    state,
    setIsInviteUserOpen,
    handleToggleUserStatus,
    setDeletingUser,
  } = useAdminContext();

  const superAdminsCount = state.platformUsers.filter(
    (u) => u.role === "Super Admin",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Team &amp; Access Roles
          </h1>
          <p className="text-slate-500 text-xs">
            {state.platformUsers.length} administrators · {superAdminsCount}{" "}
            super admins
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteUserOpen(true)}
          className="rounded-xl px-3.5 py-2 font-medium text-xs shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1" />
          Invite User
        </Button>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-slate-200 border-b bg-slate-50 font-semibold text-slate-700">
              <th className="px-5 py-3">Administrator</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Active</th>
              <th className="px-5 py-3 text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.platformUsers.map((u) => {
              const isActive = u.status === "ACTIVE";
              const isCurrent = u.id === state.currentUser.id;

              return (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-white text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {u.name}
                        </div>
                        {isCurrent ? (
                          <span className="font-mono text-[10px] text-amber-800">
                            (You)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {u.email}
                  </td>

                  <td className="px-5 py-3.5">
                    <Badge
                      tone={
                        u.role === "Super Admin"
                          ? "amber"
                          : u.role === "Compliance Officer"
                            ? "sky"
                            : "slate"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5">
                    <Badge tone={isActive ? "emerald" : "rose"}>
                      {u.status}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                    {u.lastActive}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u.id)}
                        disabled={isCurrent}
                        className={`rounded-lg px-2.5 py-1 font-medium text-[11px] transition-colors ${
                          isCurrent
                            ? "cursor-not-allowed text-slate-300"
                            : isActive
                              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {isActive ? "Revoke" : "Activate"}
                      </button>

                      <IconButton
                        title={
                          isCurrent
                            ? "Cannot delete current session"
                            : "Delete administrator account"
                        }
                        tone="danger"
                        disabled={isCurrent}
                        className={`rounded-xl h-7 w-7 ${
                          isCurrent ? "cursor-not-allowed opacity-30" : ""
                        }`}
                        onClick={() => setDeletingUser(u)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
