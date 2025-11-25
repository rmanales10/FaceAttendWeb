'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, GraduationCap, UserCircle, Loader2 } from 'lucide-react';

function FaceTrainingSuccessContent() {
    const searchParams = useSearchParams();
    const personType = searchParams?.get('type') || 'student';
    const personName = searchParams?.get('name') || 'Student';

    useEffect(() => {
        // Auto-close the window after 5 seconds
        const timer = setTimeout(() => {
            if (window.opener) {
                // If opened from another window, close this one
                window.close();
            } else {
                // If opened directly, try to close (may not work in all browsers)
                window.close();
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-2xl w-full">
                {/* Success Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Header with gradient */}
                    <div className={`bg-gradient-to-r ${personType === 'student'
                        ? 'from-blue-500 to-blue-600'
                        : 'from-purple-500 to-purple-600'
                        } p-4 sm:p-5 text-center`}>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
                            <CheckCircle className="w-9 h-9 sm:w-10 sm:h-10 text-green-500" />
                        </div>
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                            Training Completed!
                        </h1>
                        <p className="text-white/90 text-xs sm:text-sm">
                            {personType === 'student' ? 'Student' : 'Teacher'} Successfully Trained
                        </p>
                    </div>

                    {/* Content - Single Column Stack */}
                    <div className="p-4 sm:p-5">
                        {/* Person Info */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-slate-200">
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${personType === 'student'
                                    ? 'from-blue-500 to-blue-600'
                                    : 'from-purple-500 to-purple-600'
                                    } rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md flex-shrink-0`}>
                                    {personName
                                        .split(' ')
                                        .map(word => word[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-0.5 truncate">
                                        {personName}
                                    </h2>
                                    <div className="flex items-center space-x-1.5">
                                        {personType === 'student' ? (
                                            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                                        ) : (
                                            <UserCircle className="w-3.5 h-3.5 text-purple-500" />
                                        )}
                                        <span className="text-slate-600 text-xs sm:text-sm capitalize">{personType}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                            <div className="flex items-start space-x-2">
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-green-800 text-sm sm:text-base mb-1.5">
                                        Face Recognition Training Successful!
                                    </h3>
                                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed">
                                        Your face data has been successfully trained and saved. You can now use face recognition
                                        for attendance tracking. The system will recognize you when you scan your face.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                            <h4 className="font-semibold text-blue-900 mb-2 text-xs sm:text-sm">What&apos;s Next?</h4>
                            <div className="space-y-1.5">
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold text-sm">•</span>
                                    <span className="text-blue-800 text-xs sm:text-sm">Your face data is now registered in the system</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold text-sm">•</span>
                                    <span className="text-blue-800 text-xs sm:text-sm">You can use face recognition for attendance</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold text-sm">•</span>
                                    <span className="text-blue-800 text-xs sm:text-sm">If needed, you can retrain your face data anytime</span>
                                </div>
                            </div>
                        </div>

                        {/* Auto-close message */}
                        <div className="text-center">
                            <p className="text-slate-500 text-xs">
                                This window will close automatically in a few seconds...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FaceTrainingSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600 font-medium text-lg">Loading...</p>
                    </div>
                </div>
            }
        >
            <FaceTrainingSuccessContent />
        </Suspense>
    );
}

