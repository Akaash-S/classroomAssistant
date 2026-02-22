'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const ROLES = [
    {
        id: 'student',
        label: 'Student',
        description: 'Access lecture summaries, track assignments, and stay on top of deadlines.',
        icon: BookOpen,
        color: 'indigo',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-400',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        ring: 'ring-indigo-400',
    },
    {
        id: 'teacher',
        label: 'Teacher',
        description: 'Record lectures, manage AI-generated tasks, and notify your students.',
        icon: GraduationCap,
        color: 'emerald',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-400',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        ring: 'ring-emerald-400',
    },
    {
        id: 'admin',
        label: 'Admin',
        description: 'Full access to manage users, content, and system settings.',
        icon: ShieldCheck,
        color: 'violet',
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        border: 'border-violet-400',
        iconColor: 'text-violet-600 dark:text-violet-400',
        ring: 'ring-violet-400',
    },
] as const;

type RoleId = 'student' | 'teacher' | 'admin';

const ROLE_REDIRECTS: Record<RoleId, string> = {
    student: '/dashboard/student',
    teacher: '/dashboard/teacher',
    admin: '/dashboard/teacher',
};

export default function SelectRolePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [selected, setSelected] = useState<RoleId | null>(null);
    const [saving, setSaving] = useState(false);

    // Guard: redirect away if not signed in
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    const handleConfirm = async () => {
        if (!selected || !user || !db) return;
        setSaving(true);
        try {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: selected,
                createdAt: new Date().toISOString(),
            });
            router.replace(ROLE_REDIRECTS[selected]);
        } catch (err) {
            console.error('[SelectRole] Failed to save role:', err);
            setSaving(false);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-xl shadow-indigo-200 dark:shadow-none">
                        <GraduationCap size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Welcome{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
                        Choose your role to get started. You can always ask an admin to change it later.
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {ROLES.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selected === role.id;
                        return (
                            <button
                                key={role.id}
                                onClick={() => setSelected(role.id as RoleId)}
                                className={`
                  relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                  ${isSelected
                                        ? `${role.border} ${role.bg} ring-4 ${role.ring} ring-offset-2 dark:ring-offset-slate-900 shadow-lg scale-[1.02]`
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                                    }
                `}
                            >
                                {isSelected && (
                                    <span className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                )}
                                <div className={`w-14 h-14 ${role.bg} rounded-xl flex items-center justify-center mb-4 ${role.iconColor}`}>
                                    <Icon size={28} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">{role.label}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{role.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Confirm Button */}
                <button
                    onClick={handleConfirm}
                    disabled={!selected || saving}
                    className={`
            w-full py-4 rounded-2xl font-bold text-lg transition-all
            ${selected && !saving
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }
          `}
                >
                    {saving ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Setting up your account…
                        </span>
                    ) : selected ? (
                        `Continue as ${ROLES.find(r => r.id === selected)?.label}`
                    ) : (
                        'Select a role to continue'
                    )}
                </button>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                    Signed in as {user.email}
                </p>
            </motion.div>
        </div>
    );
}
