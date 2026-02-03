import React from 'react';
import { Construction } from 'lucide-react';

export default function EmptyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
      <Construction className="w-16 h-16 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
      <p className="text-sm">This page is under development.</p>
    </div>
  );
}
