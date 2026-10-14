"use client";

import { Plus, Trash2 } from "lucide-react";
import { Badge, Button, IconButton } from "@/components/ui";
import type { PlatformUser } from "@/types";

interface StaffTabProps {
  users: PlatformUser[];
  currentUserId: string;
  onInvite: () => void;
  onToggleStatus: (userId: string) => void;
  onDelete: (user: PlatformUser) => void;
}

export function StaffTab({
  users,
  currentUserId,
  onInvite,
  onToggleStatus,
  onDelete,
}: StaffTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-200">
      <div className="flex justify-end">
        <Button onClick={onInvite}>
          <Plus className="h-3.5 w-3.5" />
          <span>Invite</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-slate-200 border-b bg-slate-50 font-semibold text-slate-700">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isActive = u.status === "ACTIVE";
              const isCurrent = u.id === currentUserId;

              return (
                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                  <td className="flex items-center gap-2.5 px-4 py-3.5 font-bold text-slate-900">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-amber-100 font-bold text-amber-800">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div>{u.name}</div>
                      {isCurrent ? (
                        <span className="font-mono font-semibold text-[10px] text-amber-800">
                          You
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-slate-700">
                    {u.email}
                  </td>

                  <td className="px-4 py-3.5">
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

                  <td className="px-4 py-3.5">
                    <Badge tone={isActive ? "emerald" : "rose"}>
                      {u.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                    {u.lastActive}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(u.id)}
                        disabled={isCurrent}
                        className={`rounded border px-2.5 py-1 font-semibold text-[11px] shadow-xs transition-colors ${
                          isCurrent
                            ? "cursor-not-allowed border-slate-200 text-slate-400 opacity-40"
                            : isActive
                              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {isActive ? "Revoke" : "Reactivate"}
                      </button>

                      <IconButton
                        title={
                          isCurrent
                            ? "Cannot delete signed-in user"
                            : "Delete"
                        }
                        tone="danger"
                        disabled={isCurrent}
                        className={isCurrent ? "opacity-30" : undefined}
                        onClick={() => onDelete(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
