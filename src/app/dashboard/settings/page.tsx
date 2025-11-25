'use client';

import React, { useState, useEffect } from 'react';
import { settingsService, AppSettings } from '@/lib/firestore';
import { Settings, Clock, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';

export default function SettingsPage() {
    const { toasts, removeToast, success, error: showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        late_minutes: 30,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const currentSettings = await settingsService.getSettings();
            if (currentSettings) {
                setSettings(currentSettings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsService.updateSettings({
                late_minutes: settings.late_minutes,
            });
            success('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            showError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">Settings</h1>
                        <p className="text-slate-500 text-sm sm:text-base lg:text-lg mt-1">
                            Configure application settings
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8 max-w-4xl">
                {/* Late Settings Section */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Late Settings</h2>
                            <p className="text-slate-500 text-sm sm:text-base">
                                Configure when students are marked as late
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-orange-200">
                        <div className="mb-4 sm:mb-6">
                            <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2 sm:mb-3">
                                Late Minutes After Schedule Start
                            </label>
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={settings.late_minutes}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        late_minutes: parseInt(e.target.value) || 0
                                    })}
                                    className="w-24 sm:w-32 px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-slate-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800 font-semibold text-base sm:text-lg text-center"
                                />
                                <span className="text-slate-600 font-medium text-sm sm:text-base">minutes</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-2 sm:mt-3">
                                Students will be marked as <span className="font-semibold text-orange-600">late</span> if they check in after the schedule start time plus this many minutes.
                            </p>
                        </div>

                        {/* Example */}
                        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
                            <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-2">Example:</p>
                            <div className="space-y-1 text-xs sm:text-sm text-slate-600">
                                <p>• Schedule: <span className="font-mono font-semibold">Wed 1:31 AM - 1:30 AM</span></p>
                                <p>• Late Setting: <span className="font-mono font-semibold">{settings.late_minutes} minutes</span></p>
                                <p>• Late Threshold: <span className="font-mono font-semibold text-orange-600">1:31 AM + {settings.late_minutes} mins = {(() => {
                                    const date = new Date();
                                    date.setHours(1, 31, 0, 0);
                                    date.setMinutes(date.getMinutes() + settings.late_minutes);
                                    const hour = date.getHours();
                                    const minute = date.getMinutes();
                                    const period = hour >= 12 ? 'PM' : 'AM';
                                    const displayHour = hour % 12 || 12;
                                    const minuteStr = minute.toString().padStart(2, '0');
                                    return `${displayHour}:${minuteStr} ${period}`;
                                })()}</span></p>
                                <p className="text-slate-500 mt-2">Students checking in after the late threshold will be marked as late.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl ${saving
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}

