'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Camera,
    History,
    LogOut,
    Calendar
} from 'lucide-react';

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'teachers', label: 'Teachers', icon: Users, path: '/dashboard/teachers' },
    { id: 'students', label: 'Students', icon: GraduationCap, path: '/dashboard/students' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, path: '/dashboard/subjects' },
    { id: 'class-schedule', label: 'Class Schedule', icon: Calendar, path: '/dashboard/class-schedule' },
    { id: 'face-training', label: 'Face Training', icon: Camera, path: '/dashboard/face-training' },
    { id: 'activity-logs', label: 'Activity Logs', icon: History, path: '/dashboard/activity-logs' },
];

export default function Sidebar() {
    const { logout } = useAuth();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="w-70 h-screen bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 shadow-sm">
            <div className="flex flex-col h-full">
                {/* Header Section */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                            <Image
                                src="/images/logo.png"
                                alt="Face Attendance Logo"
                                width={32}
                                height={32}
                                className="object-contain filter brightness-0 invert"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Tap Attend</h1>
                            <p className="text-slate-500 text-sm">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 px-4 py-6">
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.path}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout Section */}
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
