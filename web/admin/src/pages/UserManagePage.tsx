import React, { useState } from 'react';
import { Search, MoreVertical, Ban, CheckCircle, Trash2, Eye, Shield, User } from 'lucide-react';
import type { User as UserType } from '../types';

const mockUsers: UserType[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  username: `user_${String(i + 1).padStart(3, '0')}`,
  email: `user${i + 1}@herbtable.com`,
  role: i === 0 ? 'admin' : 'user',
  status: i % 7 === 0 ? 'banned' : 'active',
  createdAt: `2026-0${Math.floor(i / 5) + 1}-${String((i * 3) % 28 + 1).padStart(2, '0')}`,
  lastLogin: `2026-07-${String(28 - (i % 10)).padStart(2, '0')} ${String(10 + i % 12).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
}));

export default function UserManagePage() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'banned'>('all');

  const filtered = users.filter(u =>
    (filter === 'all' || u.status === filter) &&
    (u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="text-sm text-gray-500">Total: {users.length} | Active: {users.filter(u => u.status === 'active').length} | Banned: {users.filter(u => u.status === 'banned').length}</div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter === f ? 'bg-white shadow' : 'text-gray-500'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-left px-4 py-3">Last Login</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div>
                    <span className="text-sm font-medium">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'admin' && <Shield className="w-3 h-3" />}{u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}{u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.createdAt}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.lastLogin}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => toggleStatus(u.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                      {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
