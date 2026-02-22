'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  Calendar,
  GraduationCap,
  LogOut,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const { role, logout, user } = useAuth();
  const pathname = usePathname();

  const teacherLinks = [
    { name: 'Dashboard', href: '/dashboard/teacher', icon: LayoutDashboard },
    { name: 'Record Lecture', href: '/dashboard/teacher/record', icon: Mic },
    { name: 'My Lectures', href: '/dashboard/teacher/lectures', icon: FileText },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'Calendar', href: '/dashboard/student/calendar', icon: Calendar },
    { name: 'Summaries', href: '/dashboard/student/summaries', icon: BookOpen },
  ];

  // Admin uses teacher interface
  const links = role === 'teacher' || role === 'admin' ? teacherLinks : studentLinks;

  const roleLabel = role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student';

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <GraduationCap size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">EduAI</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        {user && (
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.displayName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{roleLabel}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
