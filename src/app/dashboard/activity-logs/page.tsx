'use client';

import React, { useState, useEffect } from 'react';
import { activityLogService, ActivityLog } from '@/lib/firestore';
import {
    Search,
    History,
    Clock,
    User,
    Activity,
    Filter
} from 'lucide-react';

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [logs, searchQuery]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await activityLogService.getAllActivityLogs();
            setLogs(data);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        if (!searchQuery.trim()) {
            setFilteredLogs(logs);
            return;
        }

        const filtered = logs.filter(log =>
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredLogs(filtered);
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    const getActionIcon = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('login') || actionLower.includes('logout')) {
            return <User className="w-4 h-4" />;
        } else if (actionLower.includes('create') || actionLower.includes('add')) {
            return <Activity className="w-4 h-4" />;
        } else if (actionLower.includes('update') || actionLower.includes('edit')) {
            return <Activity className="w-4 h-4" />;
        } else if (actionLower.includes('delete')) {
            return <Activity className="w-4 h-4" />;
        }
        return <History className="w-4 h-4" />;
    };

    const getActionColor = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('login')) return 'text-green-600 bg-green-100';
        if (actionLower.includes('logout')) return 'text-red-600 bg-red-100';
        if (actionLower.includes('create') || actionLower.includes('add')) return 'text-blue-600 bg-blue-100';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'text-yellow-600 bg-yellow-100';
        if (actionLower.includes('delete')) return 'text-red-600 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    };

    if (loading) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-2xl w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-slate-200 rounded-xl w-1/3 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded-xl w-1/2"></div>
                                    </div>
                                </div>
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
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Activity Logs</h1>
                        <p className="text-slate-600">Track system activities and user actions</p>
                    </div>
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-3 rounded-2xl border border-slate-200">
                        <span className="text-slate-700 font-semibold">
                            Total Logs: {logs.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search logs by action, user, or details..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-slate-800 placeholder-slate-400"
                    />
                </div>
                <button className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 px-6 py-4 rounded-2xl hover:from-slate-200 hover:to-gray-200 transition-all duration-200 flex items-center space-x-3 shadow-sm hover:shadow-md">
                    <Filter className="w-5 h-5" />
                    <span className="font-medium">Filter</span>
                </button>
            </div>

            {/* Activity Logs List */}
            {filteredLogs.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <History className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No activity logs found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No activities recorded yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group"
                        >
                            <div className="flex items-start space-x-6">
                                <div className={`p-4 rounded-2xl ${getActionColor(log.action).split(' ')[1]} group-hover:scale-110 transition-transform duration-300`}>
                                    <div className={getActionColor(log.action).split(' ')[0]}>
                                        {getActionIcon(log.action)}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{log.action}</h3>
                                        <div className="flex items-center space-x-3 text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6 mb-4">
                                        <div className="flex items-center space-x-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-2">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium">{log.user}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl text-sm font-semibold ${getActionColor(log.action)} border`}>
                                            {log.action}
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-4">{log.details}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
