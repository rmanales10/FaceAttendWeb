'use client';

import React, { useState } from 'react';
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
    Calendar,
    ScanFace,
    Menu,
    X,
    FileText,
    Building2
} from 'lucide-react';

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'teachers', label: 'Teachers', icon: Users, path: '/dashboard/teachers' },
    { id: 'students', label: 'Students', icon: GraduationCap, path: '/dashboard/students' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, path: '/dashboard/subjects' },
    { id: 'rooms', label: 'Rooms', icon: Building2, path: '/dashboard/rooms' },
    { id: 'class-schedule', label: 'Class Schedule', icon: Calendar, path: '/dashboard/class-schedule' },
    { id: 'face-training', label: 'Face Training', icon: Camera, path: '/dashboard/face-training' },
    // { id: 'face-recognition', label: 'Face Recognition', icon: ScanFace, path: '/dashboard/face-recognition' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/dashboard/reports' },
    // { id: 'activity-logs', label: 'Activity Logs', icon: History, path: '/dashboard/activity-logs' },
];

export default function Sidebar() {
    const { logout } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden p-1">
                            <Image
                                src="/images/logo.png"
                                alt="Face Attendance Logo"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800">Face Attend</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6 text-slate-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-slate-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed lg:static inset-y-0 left-0 z-40 w-70 h-screen bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 shadow-lg lg:shadow-sm transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Header Section - Hidden on mobile (shown in top bar) */}
                    <div className="hidden lg:block p-6 border-b border-slate-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1.5">
                                <Image
                                    src="/images/logo.png"
                                    alt="Face Attendance Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Face Attend</h1>
                                <p className="text-slate-500 text-sm">Admin Panel</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 px-4 py-6 overflow-y-auto">
                        <nav className="space-y-1">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.path;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.path}
                                        onClick={closeMobileMenu}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                        <span className="font-medium">{item.label}</span>
                                        {isActive && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto flex-shrink-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Logout Section */}
                    <div className="p-4 border-t border-slate-200">
                        <button
                            onClick={() => {
                                handleLogout();
                                closeMobileMenu();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                        >
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 flex-shrink-0" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
