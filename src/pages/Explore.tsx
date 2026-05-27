import React from 'react';
import { Compass, Moon, Calendar, Coffee, Star, Navigation } from 'lucide-react';

export default function Explore() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 md:ml-64">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Explore</h1>
        <p className="text-gray-500 mt-2">Discover essentials open near you.</p>
      </header>

      <div className="space-y-6">
        <ExploreSection title="Open late" icon={<Moon className="text-indigo-600" />} color="bg-indigo-50" />
        <ExploreSection title="Sunday essentials" icon={<Calendar className="text-blue-600" />} color="bg-blue-50" />
        <ExploreSection title="Best coffee open now" icon={<Coffee className="text-amber-600" />} color="bg-amber-50" />
        <ExploreSection title="Top-rated food nearby" icon={<Star className="text-yellow-600" />} color="bg-yellow-50" />
        <ExploreSection title="Traveler essentials" icon={<Navigation className="text-emerald-600" />} color="bg-emerald-50" />
      </div>
    </div>
  );
}

function ExploreSection({ title, icon, color }: { title: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="text-gray-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>
    </div>
  );
}
