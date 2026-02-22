'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search, User } from 'lucide-react';
import Image from 'next/image';

const Header = () => {
  const { user, role } = useAuth();

  return (
    <header className="h-16 border-bottom border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search lectures, tasks..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative">
            {user?.photoURL ? (
              <Image 
                src={user.photoURL} 
                alt="Avatar" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={20} className="text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
