import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Post } from '../types';

const mockPosts: Post[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: ['Herb Collection Guide', 'Traditional Medicine Basics', 'Seasonal Herbs', 'Healing Properties', 'Garden Setup Tips',
    'Herb Preservation Methods', 'Natural Remedies', 'Herbal Tea Recipes', 'Medicinal Plant Care', 'Ancient Herb Knowledge',
    'Modern Herbalism', 'Herb Identification', 'Organic Growing', 'Herb Combinations', 'Seasonal Wellness'][i % 15],
  author: `user_${String((i % 5) + 1).padStart(3, '0')}`,
  category: ['Guide', 'Tutorial', 'Reference', 'Recipe', 'Tips'][i % 5],
  status: (['published', 'draft', 'archived'] as const)[i % 3],
  views: Math.floor(Math.random() * 5000) + 100,
  likes: Math.floor(Math.random() * 500) + 10,
  createdAt: `2026-07-${String(28 - i).padStart(2, '0')}`,
  thumbnail: i % 3 === 0 ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=herbs&image_size=landscape_4_3' : undefined,
}));

export default function PostManagePage() {
  const [posts, setPosts] = useState(mockPosts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filtered = posts.filter(p =>
    (statusFilter === 'all' || p.status === statusFilter) &&
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Post Management</h2>
        <div className="text-sm text-gray-500">Total: {posts.length} | Published: {posts.filter(p => p.status === 'published').length}</div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'published', 'draft', 'archived'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${statusFilter === s ? 'bg-white shadow' : 'text-gray-500'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-4 py-3">Post</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Views</th>
              <th className="text-left px-4 py-3">Likes</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.thumbnail ? (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden cursor-pointer" onClick={() => setPreviewImage(p.thumbnail!)}>
                        <ImageIcon className="w-full h-full text-gray-400" />
                      </div>
                    ) : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>}
                    <span className="text-sm font-medium max-w-[200px] truncate">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.author}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">{p.category}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.likes}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-xl p-4 max-w-lg" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="rounded-lg max-w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
