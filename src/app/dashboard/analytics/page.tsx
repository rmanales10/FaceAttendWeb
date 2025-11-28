'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { classAttendanceService } from '@/lib/firestore';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    Clock,
    BookOpen,
    GraduationCap,
    AlertCircle,
    CheckCircle,
    Loader2,
    FileQuestion
} from 'lucide-react';

interface AnalyticsData {
    totalAttendance: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcuse: number;
    attendanceRate: number;
    dailyTrend: Array<{ date: string; present: number; absent: number; late: number; excuse: number }>;
    subjectWise: Array<{ subject: string; present: number; absent: number; late: number; excuse: number; total: number; rate: number }>;
    classWise: Array<{ class: string; present: number; absent: number; late: number; excuse: number; total: number; rate: number }>;
    attendanceType: Array<{ name: string; value: number }>;
    weeklyTrend: Array<{ week: string; present: number; absent: number; late: number; excuse: number }>;
}

const COLORS = {
    present: '#10b981',
    absent: '#ef4444',
    late: '#f59e0b',
    excuse: '#8b5cf6',
    face: '#3b82f6',
    manual: '#6b7280'
};

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const allAttendance = await classAttendanceService.getAllClassAttendance();

            // Filter by date range
            const now = new Date();
            let filteredAttendance = allAttendance;

            if (dateRange === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredAttendance = allAttendance.filter(att => {
                    const attDate = att.created_at?.toDate() || new Date(att.attendance_date);
                    return attDate >= weekAgo;
                });
            } else if (dateRange === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredAttendance = allAttendance.filter(att => {
                    const attDate = att.created_at?.toDate() || new Date(att.attendance_date);
                    return attDate >= monthAgo;
                });
            }

            // Calculate totals
            const totalAttendance = filteredAttendance.length;
            const totalPresent = filteredAttendance.reduce((sum, att) => sum + (att.present_count || 0), 0);
            const totalAbsent = filteredAttendance.reduce((sum, att) => sum + (att.absent_count || 0), 0);
            const totalLate = filteredAttendance.reduce((sum, att) => sum + (att.late_count || 0), 0);
            const totalExcuse = filteredAttendance.reduce((sum, att) => sum + (att.excuse_count || 0), 0);
            const totalStudents = totalPresent + totalAbsent + totalLate + totalExcuse;
            const attendanceRate = totalStudents > 0 ? ((totalPresent + totalExcuse) / totalStudents) * 100 : 0;

            // Daily trend
            const dailyMap = new Map<string, { present: number; absent: number; late: number; excuse: number }>();
            filteredAttendance.forEach(att => {
                const date = att.attendance_date || (att.created_at?.toDate().toISOString().split('T')[0] || '');
                if (date) {
                    const existing = dailyMap.get(date) || { present: 0, absent: 0, late: 0, excuse: 0 };
                    dailyMap.set(date, {
                        present: existing.present + (att.present_count || 0),
                        absent: existing.absent + (att.absent_count || 0),
                        late: existing.late + (att.late_count || 0),
                        excuse: existing.excuse + (att.excuse_count || 0)
                    });
                }
            });
            const dailyTrend = Array.from(dailyMap.entries())
                .map(([date, data]) => ({ date, ...data }))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(-30); // Last 30 days

            // Subject-wise analysis
            const subjectMap = new Map<string, { present: number; absent: number; late: number; excuse: number; total: number }>();
            filteredAttendance.forEach(att => {
                const subject = att.class_schedule.subject_name || 'Unknown';
                const existing = subjectMap.get(subject) || { present: 0, absent: 0, late: 0, excuse: 0, total: 0 };
                subjectMap.set(subject, {
                    present: existing.present + (att.present_count || 0),
                    absent: existing.absent + (att.absent_count || 0),
                    late: existing.late + (att.late_count || 0),
                    excuse: existing.excuse + (att.excuse_count || 0),
                    total: existing.total + (att.total_students || 0)
                });
            });
            const subjectWise = Array.from(subjectMap.entries())
                .map(([subject, data]) => ({
                    subject,
                    ...data,
                    rate: data.total > 0 ? (((data.present + data.excuse) / data.total) * 100) : 0
                }))
                .sort((a, b) => b.rate - a.rate)
                .slice(0, 10); // Top 10 subjects

            // Class-wise analysis
            const classMap = new Map<string, { present: number; absent: number; late: number; excuse: number; total: number }>();
            filteredAttendance.forEach(att => {
                const className = att.class_schedule.course_year || 'Unknown';
                const existing = classMap.get(className) || { present: 0, absent: 0, late: 0, excuse: 0, total: 0 };
                classMap.set(className, {
                    present: existing.present + (att.present_count || 0),
                    absent: existing.absent + (att.absent_count || 0),
                    late: existing.late + (att.late_count || 0),
                    excuse: existing.excuse + (att.excuse_count || 0),
                    total: existing.total + (att.total_students || 0)
                });
            });
            const classWise = Array.from(classMap.entries())
                .map(([className, data]) => ({
                    class: className,
                    ...data,
                    rate: data.total > 0 ? (((data.present + data.excuse) / data.total) * 100) : 0
                }))
                .sort((a, b) => b.rate - a.rate);

            // Attendance type (Face vs Manual)
            let faceCount = 0;
            let manualCount = 0;
            filteredAttendance.forEach(att => {
                att.attendance_records?.forEach(record => {
                    if (record.attendance_type === 'face') {
                        faceCount++;
                    } else if (record.attendance_type === 'manual') {
                        manualCount++;
                    }
                });
            });
            const attendanceType = [
                { name: 'Face Recognition', value: faceCount },
                { name: 'Manual Entry', value: manualCount }
            ];

            // Weekly trend
            const weeklyMap = new Map<string, { present: number; absent: number; late: number; excuse: number }>();
            filteredAttendance.forEach(att => {
                const date = att.attendance_date || (att.created_at?.toDate().toISOString().split('T')[0] || '');
                if (date) {
                    const d = new Date(date);
                    const weekStart = new Date(d);
                    weekStart.setDate(d.getDate() - d.getDay());
                    const weekKey = weekStart.toISOString().split('T')[0];
                    const existing = weeklyMap.get(weekKey) || { present: 0, absent: 0, late: 0, excuse: 0 };
                    weeklyMap.set(weekKey, {
                        present: existing.present + (att.present_count || 0),
                        absent: existing.absent + (att.absent_count || 0),
                        late: existing.late + (att.late_count || 0),
                        excuse: existing.excuse + (att.excuse_count || 0)
                    });
                }
            });
            const weeklyTrend = Array.from(weeklyMap.entries())
                .map(([week, data]) => ({ week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ...data }))
                .sort((a, b) => a.week.localeCompare(b.week))
                .slice(-8); // Last 8 weeks

            setAnalytics({
                totalAttendance,
                totalPresent,
                totalAbsent,
                totalLate,
                totalExcuse,
                attendanceRate,
                dailyTrend,
                subjectWise,
                classWise,
                attendanceType,
                weeklyTrend
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">No analytics data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Analytics Dashboard
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600">Comprehensive attendance insights and trends</p>
                    </div>
                    <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                        <button
                            onClick={() => setDateRange('week')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${dateRange === 'week'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${dateRange === 'month'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setDateRange('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${dateRange === 'all'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            All Time
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-md">
                            <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{analytics.totalPresent.toLocaleString()}</h3>
                    <p className="text-sm font-medium text-slate-600">Total Present</p>
                    <div className="mt-2 h-1 bg-green-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg border-2 border-red-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-md">
                            <AlertCircle className="w-7 h-7 text-white" />
                        </div>
                        <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{analytics.totalAbsent.toLocaleString()}</h3>
                    <p className="text-sm font-medium text-slate-600">Total Absent</p>
                    <div className="mt-2 h-1 bg-red-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-lg border-2 border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-xl shadow-md">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{analytics.totalLate.toLocaleString()}</h3>
                    <p className="text-sm font-medium text-slate-600">Total Late</p>
                    <div className="mt-2 h-1 bg-amber-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-md">
                            <FileQuestion className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{analytics.totalExcuse.toLocaleString()}</h3>
                    <p className="text-sm font-medium text-slate-600">Total Excuse</p>
                    <div className="mt-2 h-1 bg-purple-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-md">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{analytics.attendanceRate.toFixed(1)}%</h3>
                    <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
                    <div className="mt-2 h-1 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${analytics.attendanceRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Daily Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        Daily Attendance Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Legend />
                            <Line type="monotone" dataKey="present" stroke={COLORS.present} strokeWidth={3} name="Present" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="absent" stroke={COLORS.absent} strokeWidth={3} name="Absent" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="late" stroke={COLORS.late} strokeWidth={3} name="Late" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="excuse" stroke={COLORS.excuse} strokeWidth={3} name="Excuse" dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                        Weekly Attendance Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.weeklyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Legend />
                            <Bar dataKey="present" fill={COLORS.present} name="Present" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="absent" fill={COLORS.absent} name="Absent" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="late" fill={COLORS.late} name="Late" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="excuse" fill={COLORS.excuse} name="Excuse" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Type */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-green-600" />
                        Attendance Type Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.attendanceType}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                <Cell fill={COLORS.face} />
                                <Cell fill={COLORS.manual} />
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                        Attendance Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Present', value: analytics.totalPresent },
                                    { name: 'Absent', value: analytics.totalAbsent },
                                    { name: 'Late', value: analytics.totalLate },
                                    { name: 'Excuse', value: analytics.totalExcuse }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                <Cell fill={COLORS.present} />
                                <Cell fill={COLORS.absent} />
                                <Cell fill={COLORS.late} />
                                <Cell fill={COLORS.excuse} />
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Subject-wise and Class-wise Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject-wise */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                        Top Subjects by Attendance Rate
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.subjectWise} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis dataKey="subject" type="category" width={150} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Legend />
                            <Bar dataKey="present" fill={COLORS.present} name="Present" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="absent" fill={COLORS.absent} name="Absent" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="late" fill={COLORS.late} name="Late" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="excuse" fill={COLORS.excuse} name="Excuse" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Class-wise */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                        Class Attendance Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.classWise} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis dataKey="class" type="category" width={100} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Legend />
                            <Bar dataKey="present" fill={COLORS.present} name="Present" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="absent" fill={COLORS.absent} name="Absent" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="late" fill={COLORS.late} name="Late" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="excuse" fill={COLORS.excuse} name="Excuse" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

