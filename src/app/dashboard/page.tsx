'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService, holidayService, Holiday, activityLogService, ActivityLog } from '@/lib/firestore';
import { Calendar, Users, GraduationCap, BookOpen, Clock, Plus, Trash2, X, Activity, AlertCircle, User, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Statistics {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalHolidays: number;
}

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState<Statistics>({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        totalHolidays: 0
    });
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [showHolidayForm, setShowHolidayForm] = useState(false);
    const [newHoliday, setNewHoliday] = useState({
        name: '',
        date: '',
        color: '#3b82f6'
    });
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsData, holidaysData, activityData] = await Promise.all([
                dashboardService.getStatistics(),
                holidayService.getAllHolidays(),
                activityLogService.getAllActivityLogs()
            ]);
            setStats(statsData);
            setHolidays(holidaysData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setActivityLogs(activityData.slice(0, 5)); // Get only the 5 most recent
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const showConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'success' = 'warning') => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            type
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal({
            ...confirmModal,
            isOpen: false
        });
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.name || !newHoliday.date) return;

        try {
            await holidayService.addHoliday(newHoliday);
            await activityLogService.addActivityLog({
                action: 'Holiday Added',
                user: 'Admin',
                details: `Added holiday: ${newHoliday.name} on ${new Date(newHoliday.date).toLocaleDateString()}`
            });
            setNewHoliday({ name: '', date: '', color: '#3b82f6' });
            setShowHolidayForm(false);
            await fetchData();
        } catch (error) {
            console.error('Error adding holiday:', error);
            showConfirmation(
                'Error',
                'Failed to add holiday. Please try again.',
                () => closeConfirmModal(),
                'danger'
            );
        }
    };

    const handleDeleteHoliday = (id: string, holidayName: string) => {
        showConfirmation(
            'Delete Holiday',
            `Are you sure you want to delete "${holidayName}"? This action cannot be undone.`,
            async () => {
                try {
                    await holidayService.deleteHoliday(id);
                    await activityLogService.addActivityLog({
                        action: 'Holiday Deleted',
                        user: 'Admin',
                        details: `Deleted holiday: ${holidayName}`
                    });
                    await fetchData();
                    closeConfirmModal();
                } catch (error) {
                    console.error('Error deleting holiday:', error);
                    closeConfirmModal();
                    showConfirmation(
                        'Error',
                        'Failed to delete holiday. Please try again.',
                        () => closeConfirmModal(),
                        'danger'
                    );
                }
            },
            'danger'
        );
    };

    const getUpcomingHolidays = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return holidays.filter(holiday => new Date(holiday.date) >= today).slice(0, 5);
    };

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

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
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-6 sm:h-8 bg-slate-200 rounded-2xl w-2/3 sm:w-1/4 mb-4 sm:mb-6"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
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
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-1 sm:mb-2">Admin Dashboard</h1>
                        <p className="text-sm sm:text-base text-slate-600">Monitor and manage your system</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* User Info */}
                        {user && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 sm:px-5 py-3 rounded-xl border border-indigo-100 shadow-sm">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                {user.displayName || 'Admin User'}
                                            </p>
                                            {isAdmin && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-1.5 mt-0.5">
                                            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                            <p className="text-xs text-slate-600 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Date */}
                        <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 rounded-xl border border-blue-100 shadow-sm">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-slate-700 font-semibold text-sm sm:text-base whitespace-nowrap">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ${card.iconColor}`} />
                                </div>
                                <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r ${card.color} text-white text-base sm:text-lg font-bold shadow-lg`}>
                                    {card.value}
                                </div>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors">{card.title}</h3>
                            <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{card.description}</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Set Holidays */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">Upcoming Holidays</h3>
                        <button
                            onClick={() => setShowHolidayForm(!showHolidayForm)}
                            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold"
                        >
                            {showHolidayForm ? (
                                <>
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Cancel</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Add Holiday</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Holiday Form */}
                    {showHolidayForm && (
                        <form onSubmit={handleAddHoliday} className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Holiday Name</label>
                                    <input
                                        type="text"
                                        value={newHoliday.name}
                                        onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                        placeholder="e.g., Christmas Day"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newHoliday.date}
                                        onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Color</label>
                                    <div className="flex space-x-2">
                                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewHoliday({ ...newHoliday, color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${newHoliday.color === color ? 'border-slate-800 scale-110' : 'border-slate-300'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold"
                                >
                                    Add Holiday
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Upcoming Holidays List */}
                    <div className="space-y-3 sm:space-y-4">
                        {getUpcomingHolidays().length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No upcoming holidays</p>
                            </div>
                        ) : (
                            getUpcomingHolidays().map((holiday) => (
                                <div
                                    key={holiday.id}
                                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 hover:shadow-md"
                                    style={{
                                        backgroundColor: `${holiday.color}10`,
                                        borderColor: `${holiday.color}30`
                                    }}
                                >
                                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                        <div
                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: holiday.color }}
                                        ></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">{holiday.name}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500">
                                                {new Date(holiday.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => holiday.id && handleDeleteHoliday(holiday.id, holiday.name)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 flex-shrink-0"
                                        title="Delete holiday"
                                    >
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">Recent Activity</h3>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {activityLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No recent activity</p>
                            </div>
                        ) : (
                            activityLogs.map((log, index) => {
                                const colors = [
                                    { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100', dot: 'bg-blue-500' },
                                    { bg: 'from-green-50 to-emerald-50', border: 'border-green-100', dot: 'bg-green-500' },
                                    { bg: 'from-purple-50 to-violet-50', border: 'border-purple-100', dot: 'bg-purple-500' },
                                    { bg: 'from-orange-50 to-amber-50', border: 'border-orange-100', dot: 'bg-orange-500' },
                                    { bg: 'from-pink-50 to-rose-50', border: 'border-pink-100', dot: 'bg-pink-500' }
                                ];
                                const color = colors[index % colors.length];

                                const timeAgo = log.timestamp ? getTimeAgo(log.timestamp.toDate()) : 'Just now';

                                return (
                                    <div
                                        key={log.id}
                                        className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r ${color.bg} rounded-xl sm:rounded-2xl border ${color.border} transition-all duration-300 hover:shadow-md`}
                                    >
                                        <div className={`w-2 h-2 sm:w-3 sm:h-3 ${color.dot} rounded-full flex-shrink-0`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{log.action}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-600 truncate">{log.details}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{timeAgo}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
                        {/* Modal Header */}
                        <div className={`p-6 border-b ${confirmModal.type === 'danger' ? 'bg-red-50 border-red-100' :
                            confirmModal.type === 'success' ? 'bg-green-50 border-green-100' :
                                'bg-yellow-50 border-yellow-100'
                            }`}>
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-full ${confirmModal.type === 'danger' ? 'bg-red-100' :
                                    confirmModal.type === 'success' ? 'bg-green-100' :
                                        'bg-yellow-100'
                                    }`}>
                                    <AlertCircle className={`w-6 h-6 ${confirmModal.type === 'danger' ? 'text-red-600' :
                                        confirmModal.type === 'success' ? 'text-green-600' :
                                            'text-yellow-600'
                                        }`} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{confirmModal.title}</h3>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-slate-600 leading-relaxed">{confirmModal.message}</p>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 rounded-b-2xl flex space-x-3">
                            <button
                                onClick={closeConfirmModal}
                                className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all duration-300 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmModal.onConfirm();
                                }}
                                className={`flex-1 px-4 py-3 text-white rounded-lg transition-all duration-300 font-semibold ${confirmModal.type === 'danger'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' :
                                    confirmModal.type === 'success'
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' :
                                        'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
