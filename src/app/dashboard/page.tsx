'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService } from '@/lib/firestore';
import { Calendar, Users, GraduationCap, BookOpen, Clock } from 'lucide-react';

interface Statistics {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalHolidays: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Statistics>({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        totalHolidays: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStatistics();
                setStats(data);
            } catch (error) {
                console.error('Error fetching statistics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Teachers',
            value: stats.totalTeachers,
            description: 'Track current number of teachers',
            color: 'from-green-500 to-green-600',
            icon: Users,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
        },
        {
            title: 'Students',
            value: stats.totalStudents,
            description: 'Track current number of students',
            color: 'from-purple-500 to-purple-600',
            icon: GraduationCap,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        {
            title: 'Subjects',
            value: stats.totalSubjects,
            description: 'Track current number of subjects',
            color: 'from-blue-500 to-blue-600',
            icon: BookOpen,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            title: 'Holidays',
            value: stats.totalHolidays,
            description: 'Track current number of holidays',
            color: 'from-red-500 to-red-600',
            icon: Calendar,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600'
        }
    ];

    if (loading) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-2xl w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <div className="h-4 bg-slate-200 rounded-xl w-1/2 mb-4"></div>
                                <div className="h-8 bg-slate-200 rounded-xl w-1/3 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded-xl w-3/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
                        <p className="text-slate-600">Monitor and manage your system</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-2xl border border-blue-100">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-slate-700 font-semibold">
                            {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-4 rounded-2xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-7 h-7 ${card.iconColor}`} />
                                </div>
                                <div className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${card.color} text-white text-lg font-bold shadow-lg`}>
                                    {card.value}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{card.title}</h3>
                            <p className="text-slate-600 text-sm mb-4">{card.description}</p>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className={`bg-gradient-to-r ${card.color} h-2 rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.min((card.value / 100) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">New student registered</p>
                                <p className="text-xs text-slate-500">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">Face training completed</p>
                                <p className="text-xs text-slate-500">15 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-100">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">New subject added</p>
                                <p className="text-xs text-slate-500">1 hour ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">System Status</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                            <span className="text-slate-700 font-medium">Database Connection</span>
                            <span className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 text-sm font-semibold">Online</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                            <span className="text-slate-700 font-medium">Face Recognition</span>
                            <span className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 text-sm font-semibold">Active</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100">
                            <span className="text-slate-700 font-medium">System Load</span>
                            <span className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-yellow-600 text-sm font-semibold">Normal</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
