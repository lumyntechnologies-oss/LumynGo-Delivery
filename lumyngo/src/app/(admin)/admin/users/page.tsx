"use client";

import { useEffect, useState } from "react";
import { Users, Shield, Truck, Package, Loader2, Search } from "lucide-react";
import { getAllUsers, updateUserRole } from "@/services/admin";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import AppNav from "@/components/shared/AppNav";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdating(userId);
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
    } catch {
      alert("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const roleIcon = { CUSTOMER: Package, RIDER: Truck, ADMIN: Shield };
  const roleColor = {
    CUSTOMER: "text-blue-400 bg-blue-600/10 border-blue-600/20",
    RIDER: "text-green-400 bg-green-600/10 border-green-600/20",
    ADMIN: "text-purple-400 bg-purple-600/10 border-purple-600/20",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="ADMIN" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-slate-400 text-sm mt-1">{users.length} total users</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-slate-600"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">User</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Joined</div>
            <div className="col-span-2">Actions</div>
          </div>

          {filtered.map((user) => {
            const RoleIcon = roleIcon[user.role];
            return (
              <div key={user.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-800 last:border-0 items-center hover:bg-slate-800/30 transition-colors">
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${roleColor[user.role]}`}>
                    <RoleIcon className="w-3 h-3" />
                    {user.role}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-slate-500">{formatDate(user.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <select
                    className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-slate-600"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updating === user.id}
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="RIDER">Rider</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No users found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
