import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, MapPin, Clock, Calendar, Moon, Zap, Coffee, Pill, ShoppingCart, Fuel, Stethoscope, Beer, Navigation, User, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import VoiceSearchOverlay from '../components/VoiceSearchOverlay';
import LocationModal from '../components/LocationModal';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { address } = useLocationContext();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const categories = [
    { name: 'Pharmacy', icon: <Pill size={20} /> },
    { name: 'Food', icon: <ShoppingCart size={20} /> },
    { name: 'Grocery', icon: <ShoppingCart size={20} /> },
    { name: 'Gas', icon: <Fuel size={20} /> },
    { name: 'Coffee', icon: <Coffee size={20} /> },
    { name: 'Urgent Care', icon: <Stethoscope size={20} /> },
    { name: 'Bars', icon: <Beer size={20} /> },
  ];

  const quickFilters = [
    { name: 'Open now', icon: <Clock size={16} /> },
    { name: 'Open Sunday', icon: <Calendar size={16} /> },
    { name: '24/7', icon: <Zap size={16} /> },
    { name: 'Late night', icon: <Moon size={16} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 md:ml-64">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Open Beacon</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
            >
              <Navigation size={14} className="mr-1.5" />
              {address}
            </button>
            <div className="md:hidden">
              {user ? (
                user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User size={16} />
                  </div>
                )
              ) : (
                <button onClick={signIn} className="p-2 bg-gray-100 rounded-full text-gray-600">
                  <LogIn size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="What do you need right now?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            onClick={() => setIsVoiceOpen(true)}
          >
            <div className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <Mic className="h-5 w-5 text-blue-600" />
            </div>
          </button>
        </form>
      </header>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Filters</h2>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => navigate(`/search?q=${encodeURIComponent(filter.name)}`)}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <span className="mr-2 text-gray-400">{filter.icon}</span>
              {filter.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Categories</h2>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/search?q=${encodeURIComponent(cat.name)}`)}
              className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full mb-2">
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Find essentials open near you</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DynamicCard title="Pharmacy open now" subtitle="Nearest is 0.8 mi away" icon={<Pill />} color="bg-green-50 text-green-700" />
          <DynamicCard title="Coffee open early" subtitle="3 options nearby" icon={<Coffee />} color="bg-amber-50 text-amber-700" />
          <DynamicCard title="Open late nearby" subtitle="Food and convenience" icon={<Moon />} color="bg-indigo-50 text-indigo-700" />
          <DynamicCard title="Sunday essentials" subtitle="Groceries and hardware" icon={<ShoppingCart />} color="bg-blue-50 text-blue-700" />
        </div>
      </section>

      <VoiceSearchOverlay isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </div>
  );
}

function DynamicCard({ title, subtitle, icon, color }: { title: string, subtitle: string, icon: React.ReactNode, color: string }) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/search?q=${encodeURIComponent(title)}`)}
      className="flex items-start p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-left w-full"
    >
      <div className={`p-3 rounded-xl mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </motion.button>
  );
}
