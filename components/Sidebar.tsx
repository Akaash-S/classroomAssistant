'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Mic, 
  BookOpen, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const { role, logout } = useAuth();
  const pathname = usePathname();

  const teacherLinks = [
    { name: 'Dashboard', href: '/dashboard/teacher', icon: LayoutDashboard },
    { name: 'Record Lecture', href: '/dashboard/teacher/record', icon: Mic },
    { name: 'My Lectures', href: '/dashboard/teacher/lectures', icon: BookOpen },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'Calendar', href: '/dashboard/student/calendar', icon: Calendar },
    { name: 'Summaries', href: '/dashboard/student/summaries', icon: GraduationCap },
  ];

  const links = role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <GraduationCap size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">EduAI</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
              pathname === link.href 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <link.icon size={20} />
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
