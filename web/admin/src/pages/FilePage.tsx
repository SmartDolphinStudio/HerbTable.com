import React, { useState } from 'react';
import { Folder, FileText, Image, Film, Music, Archive, ChevronRight, Search, Grid, List } from 'lucide-react';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified: string;
  icon?: string;
}

const mockFiles: FileItem[] = [
  { name: 'uploads', type: 'folder', modified: '2026-07-28 10:30' },
  { name: 'backups', type: 'folder', modified: '2026-07-27 03:00' },
  { name: 'logs', type: 'folder', modified: '2026-07-28 12:00' },
  { name: 'config', type: 'folder', modified: '2026-07-25 14:20' },
  { name: 'database.db', type: 'file', size: '24.5 MB', modified: '2026-07-28 11:45' },
  { name: 'server.log', type: 'file', size: '1.2 MB', modified: '2026-07-28 12:00' },
  { name: 'nginx.conf', type: 'file', size: '4.2 KB', modified: '2026-07-20 09:15' },
  { name: 'backup_20260727.tar.gz', type: 'file', size: '156 MB', modified: '2026-07-27 03:05' },
];

export default function FilePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState('/');

  const filtered = mockFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="w-8 h-8 text-yellow-500" />;
    if (file.name.endsWith('.log')) return <FileText className="w-8 h-8 text-gray-500" />;
    if (file.name.match(/\.(png|jpg|gif)$/i)) return <Image className="w-8 h-8 text-green-500" />;
    if (file.name.match(/\.(mp4|avi|mov)$/i)) return <Film className="w-8 h-8 text-purple-500" />;
    if (file.name.match(/\.(mp3|wav|flac)$/i)) return <Music className="w-8 h-8 text-pink-500" />;
    if (file.name.match(/\.(zip|tar|gz|rar)$/i)) return <Archive className="w-8 h-8 text-orange-500" />;
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-blue-500" onClick={() => setCurrentPath('/')}>/</span>
          {currentPath !== '/' && <><ChevronRight className="w-4 h-4" /><span>{currentPath}</span></>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
            <Grid className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Modified</div>
          </div>
          {filtered.map((file, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer items-center">
              <div className="col-span-5 flex items-center gap-3">
                {getIcon(file)}
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <div className="col-span-2 text-sm text-gray-500">{file.size || '--'}</div>
              <div className="col-span-2 text-sm text-gray-500">{file.type === 'folder' ? 'Folder' : 'File'}</div>
              <div className="col-span-3 text-sm text-gray-500">{file.modified}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((file, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md cursor-pointer flex flex-col items-center gap-2">
              {getIcon(file)}
              <span className="text-sm font-medium text-center truncate w-full">{file.name}</span>
              <span className="text-xs text-gray-400">{file.size || 'Folder'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
