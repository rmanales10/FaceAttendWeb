'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

interface AttendanceRecord {
    student_id: string;
    student_name: string;
    status: 'present' | 'absent' | 'late';
    state?: 'Present' | 'Late' | 'Absent';
    attendance_type?: 'face' | 'manual';
}

interface ClassAttendance {
    id?: string;
    class_schedule: {
        building_room: string;
        course_code: string;
        course_year: string;
        department: string;
        schedule: string;
        subject_name: string;
        teacher_name: string;
        year_level: string;
    };
    attendance_records: AttendanceRecord[];
    date?: Timestamp | string;
    attendance_date?: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    is_submitted?: boolean;
    subject?: string;
    section?: string;
    time?: string;
    created_at?: Timestamp;
}

function ReportDownloadContent() {
    const searchParams = useSearchParams();
    const attendanceId = searchParams.get('attendanceId');

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [attendanceData, setAttendanceData] = useState<ClassAttendance | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (attendanceId) {
            fetchAttendanceData();
        } else {
            setError('No attendance ID provided');
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendanceId]);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const attendanceQuery = query(
                collection(db, 'classAttendance'),
                where('__name__', '==', attendanceId)
            );
            const snapshot = await getDocs(attendanceQuery);

            if (snapshot.empty) {
                setError('Attendance record not found');
                return;
            }

            const data = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            } as ClassAttendance;

            setAttendanceData(data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Timestamp | string | undefined): string => {
        if (!date) return 'N/A';

        try {
            if (date instanceof Timestamp) {
                return date.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            if (typeof date === 'string') {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            return 'N/A';
        } catch {
            return 'N/A';
        }
    };

    const generateDOCX = async () => {
        if (!attendanceData) return;

        setDownloading(true);
        try {
            // Get the date for the report
            const reportDate = attendanceData.attendance_date || formatDate(attendanceData.date);

            // Get all students from the attendance records
            const attendanceStudents = attendanceData.attendance_records || [];

            // Prepare student data for the template
            const studentsData = attendanceStudents.map((record, index) => {
                // Determine attendance symbol based on state field
                let attendanceSymbol = 'X';
                const state = (record as any).state || record.status;
                if (state === 'Present' || state === 'present') {
                    attendanceSymbol = '✓';
                } else if (state === 'Late' || state === 'late') {
                    attendanceSymbol = 'L';
                } else {
                    attendanceSymbol = 'X';
                }

                return {
                    no: (index + 1).toString(),
                    name: record.student_name || 'N/A',
                    course_year: attendanceData.class_schedule?.course_year || attendanceData.section || 'N/A',
                    attendance: attendanceSymbol
                };
            });

            // Fetch the template file
            const templateResponse = await fetch('/reports/FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx');
            const templateArrayBuffer = await templateResponse.arrayBuffer();

            // Load the template
            const zip = new PizZip(templateArrayBuffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Set the template data
            doc.render({
                subject: attendanceData.class_schedule?.subject_name || attendanceData.subject || 'N/A',
                course_code: attendanceData.class_schedule?.course_code || 'N/A',
                schedule: attendanceData.class_schedule?.schedule || attendanceData.time || 'N/A',
                building_room: attendanceData.class_schedule?.building_room || 'N/A',
                date: reportDate,
                teacher: attendanceData.class_schedule?.teacher_name || 'N/A',
                students: studentsData,
                total_students: (attendanceData.total_students || attendanceStudents.length).toString(),
                present_count: (attendanceData.present_count || 0).toString(),
                absent_count: (attendanceData.absent_count || 0).toString(),
                course_year: attendanceData.class_schedule?.course_year || attendanceData.section || 'N/A',
                department: attendanceData.class_schedule?.department || 'N/A',
            });

            // Generate the output document
            const output = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            const subjectName = attendanceData.class_schedule?.subject_name || attendanceData.subject || 'Attendance';
            const fileName = `Attendance_${subjectName.replace(/\s+/g, '_')}_${reportDate.replace(/\s+/g, '_')}.docx`;
            saveAs(output, fileName);

            setSuccess(true);

            // Notify Flutter app and close after a short delay
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    window.location.href = 'flutter://download-complete';
                }
            }, 1500);
        } catch (err) {
            console.error('Error generating DOCX:', err);
            setError('Failed to generate report. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">Loading attendance data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Download Complete!</h2>
                    <p className="text-slate-600 mb-6">The report has been downloaded successfully.</p>
                    <p className="text-sm text-slate-500">This window will close automatically...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Download Attendance Report</h1>
                    <p className="text-slate-600">Click the button below to download the DOCX file</p>
                </div>

                {/* Attendance Details */}
                {attendanceData && (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Report Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Subject</p>
                                <p className="font-semibold text-slate-800">
                                    {attendanceData.class_schedule?.subject_name || attendanceData.subject || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Section</p>
                                <p className="font-semibold text-slate-800">
                                    {attendanceData.class_schedule?.course_year || attendanceData.section || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Date</p>
                                <p className="font-semibold text-slate-800">
                                    {attendanceData.attendance_date || formatDate(attendanceData.date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Teacher</p>
                                <p className="font-semibold text-slate-800">
                                    {attendanceData.class_schedule?.teacher_name || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Total</p>
                                <p className="text-2xl font-bold text-blue-600">{attendanceData.total_students || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Present</p>
                                <p className="text-2xl font-bold text-green-600">{attendanceData.present_count || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Absent</p>
                                <p className="text-2xl font-bold text-red-600">{attendanceData.absent_count || 0}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Download Button */}
                <button
                    onClick={generateDOCX}
                    disabled={downloading}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${downloading
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                        }`}
                >
                    {downloading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating Report...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            <span>Download DOCX Report</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function ReportDownloadPublicPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600 font-medium text-lg">Loading...</p>
                    </div>
                </div>
            }
        >
            <ReportDownloadContent />
        </Suspense>
    );
}

