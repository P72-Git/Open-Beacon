import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Search, Bookmark, Compass, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, signIn, logOut } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 md:hidden z-50">
        <NavItem to="/" icon={<Home size={24} />} label="Home" />
        <NavItem to="/search" icon={<Search size={24} />} label="Search" />
        <NavItem to="/saved" icon={<Bookmark size={24} />} label="Saved" />
        <NavItem to="/explore" icon={<Compass size={24} />} label="Explore" />
      </nav>
      
      {/* Side Navigation for Desktop */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-4 z-50">
        <div className="text-2xl font-bold text-blue-600 mb-8 px-4">Open Beacon</div>
        <div className="flex-1">
          <NavItem to="/" icon={<Home size={20} />} label="Home" desktop />
          <NavItem to="/search" icon={<Search size={20} />} label="Search" desktop />
          <NavItem to="/saved" icon={<Bookmark size={20} />} label="Saved" desktop />
          <NavItem to="/explore" icon={<Compass size={20} />} label="Explore" desktop />
        </div>
        
        <div className="mt-auto border-t border-gray-100 pt-4">
          {user ? (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User size={16} />
                  </div>
                )}
                <span className="text-sm font-medium truncate w-24">{user.displayName}</span>
              </div>
              <button onClick={logOut} className="text-gray-500 hover:text-red-600">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={signIn}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-xl font-medium transition-colors"
            >
              <LogIn size={18} />
              Sign In
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, desktop = false }: { to: string, icon: React.ReactNode, label: string, desktop?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex ${desktop ? 'flex-row items-center space-x-3 px-4 py-3 rounded-lg mb-2' : 'flex-col items-center justify-center w-full h-full'} 
        ${isActive ? 'text-blue-600 font-medium ' + (desktop ? 'bg-blue-50' : '') : 'text-gray-500 hover:text-gray-900 ' + (desktop ? 'hover:bg-gray-100' : '')}`
      }
    >
      {icon}
      <span className={desktop ? 'text-base' : 'text-xs mt-1'}>{label}</span>
    </NavLink>
  );
}
