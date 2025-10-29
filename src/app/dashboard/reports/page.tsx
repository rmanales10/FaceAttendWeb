'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, Download, Calendar, Loader2, Users, CheckCircle, XCircle, GraduationCap, UserCircle } from 'lucide-react';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

interface AttendanceRecord {
    student_id: string;
    student_name: string;
    status: 'present' | 'absent' | 'late';
    attendance_type?: 'face' | 'manual';
}

interface FacultyAttendanceRecord {
    teacher_id: string;
    teacher_name: string;
    status: 'present' | 'absent' | 'late';
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

interface FacultyAttendance {
    id?: string;
    class_schedule?: {
        building_room: string;
        course_code: string;
        course_year: string;
        department: string;
        schedule: string;
        subject_name: string;
        teacher_name: string;
        year_level: string;
    };
    attendance_records: FacultyAttendanceRecord[];
    date?: Timestamp | string;
    attendance_date?: string;
    total_teachers: number;
    present_count: number;
    absent_count: number;
    is_submitted?: boolean;
    subject?: string;
    department?: string;
    time?: string;
    created_at?: Timestamp;
}

type AttendanceCategory = 'student' | 'faculty';

export default function ReportsPage() {
    const [studentAttendanceRecords, setStudentAttendanceRecords] = useState<ClassAttendance[]>([]);
    const [facultyAttendanceRecords, setFacultyAttendanceRecords] = useState<FacultyAttendance[]>([]);
    const [activeCategory, setActiveCategory] = useState<AttendanceCategory>('student');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentData, facultyData] = await Promise.all([
                fetchStudentAttendance(),
                fetchFacultyAttendance()
            ]);
            setStudentAttendanceRecords(studentData);
            setFacultyAttendanceRecords(facultyData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentAttendance = async (): Promise<ClassAttendance[]> => {
        try {
            const attendanceQuery = query(
                collection(db, 'classAttendance'),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(attendanceQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ClassAttendance));
        } catch (error) {
            console.error('Error fetching student attendance:', error);
            return [];
        }
    };

    const fetchFacultyAttendance = async (): Promise<FacultyAttendance[]> => {
        try {
            const attendanceQuery = query(
                collection(db, 'facultyAttendance'),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(attendanceQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FacultyAttendance));
        } catch (error) {
            console.error('Error fetching faculty attendance:', error);
            return [];
        }
    };

    const formatDate = (date: unknown): string => {
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

    const generateStudentDOCX = async (attendanceData: ClassAttendance) => {
        setGenerating(true);
        try {
            // Get the date for the report
            const reportDate = attendanceData.attendance_date || formatDate(attendanceData.date);

            // Get all students from the attendance records
            const attendanceStudents = attendanceData.attendance_records || [];

            // Prepare student data for the template
            const studentsData = attendanceStudents.map((record, index) => ({
                no: (index + 1).toString(),
                name: record.student_name || 'N/A',
                course_year: attendanceData.class_schedule?.course_year || attendanceData.section || 'N/A',
                attendance: record.status === 'present' ? '✓' : 'X'
            }));

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
            const fileName = `Student_Attendance_${subjectName.replace(/\s+/g, '_')}_${reportDate.replace(/\s+/g, '_')}.docx`;
            saveAs(output, fileName);
        } catch (error) {
            console.error('Error generating DOCX:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const generateFacultyDOCX = async (attendanceData: FacultyAttendance) => {
        setGenerating(true);
        try {
            // Get the date for the report
            const reportDate = attendanceData.attendance_date || formatDate(attendanceData.date);

            // Get all faculty from the attendance records
            const attendanceFaculty = attendanceData.attendance_records || [];

            // Prepare faculty data for the template (adapt to use similar structure)
            const facultyData = attendanceFaculty.map((record, index) => ({
                no: (index + 1).toString(),
                name: record.teacher_name || 'N/A',
                course_year: attendanceData.department || 'N/A',
                attendance: record.status === 'present' ? '✓' : 'X'
            }));

            // Fetch the template file
            const templateResponse = await fetch('/reports/FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx');
            const templateArrayBuffer = await templateResponse.arrayBuffer();

            // Load the template
            const zip = new PizZip(templateArrayBuffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Set the template data (adapt for faculty)
            doc.render({
                subject: attendanceData.class_schedule?.subject_name || attendanceData.subject || 'Faculty Attendance',
                course_code: attendanceData.class_schedule?.course_code || 'N/A',
                schedule: attendanceData.class_schedule?.schedule || attendanceData.time || 'N/A',
                building_room: attendanceData.class_schedule?.building_room || 'N/A',
                date: reportDate,
                teacher: 'Faculty',
                students: facultyData, // Reuse students array for faculty
                total_students: (attendanceData.total_teachers || attendanceFaculty.length).toString(),
                present_count: (attendanceData.present_count || 0).toString(),
                absent_count: (attendanceData.absent_count || 0).toString(),
                course_year: attendanceData.department || 'N/A',
                department: attendanceData.department || attendanceData.class_schedule?.department || 'N/A',
            });

            // Generate the output document
            const output = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            const subjectName = attendanceData.class_schedule?.subject_name || attendanceData.subject || 'Faculty_Attendance';
            const fileName = `Faculty_Attendance_${subjectName.replace(/\s+/g, '_')}_${reportDate.replace(/\s+/g, '_')}.docx`;
            saveAs(output, fileName);
        } catch (error) {
            console.error('Error generating DOCX:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const currentRecords = activeCategory === 'student' ? studentAttendanceRecords : facultyAttendanceRecords;
    const totalRecords = activeCategory === 'student' ? studentAttendanceRecords.length : facultyAttendanceRecords.length;

    const filteredRecords = currentRecords.filter(record => {
        const searchLower = searchQuery.toLowerCase();
        if (activeCategory === 'student') {
            const studentRecord = record as ClassAttendance;
            return (
                (studentRecord.class_schedule?.subject_name || studentRecord.subject || '').toLowerCase().includes(searchLower) ||
                (studentRecord.class_schedule?.course_code || '').toLowerCase().includes(searchLower) ||
                (studentRecord.class_schedule?.course_year || studentRecord.section || '').toLowerCase().includes(searchLower) ||
                formatDate(studentRecord.date || studentRecord.attendance_date).toLowerCase().includes(searchLower)
            );
        } else {
            const facultyRecord = record as FacultyAttendance;
            return (
                (facultyRecord.class_schedule?.subject_name || facultyRecord.subject || '').toLowerCase().includes(searchLower) ||
                (facultyRecord.class_schedule?.course_code || '').toLowerCase().includes(searchLower) ||
                (facultyRecord.department || '').toLowerCase().includes(searchLower) ||
                formatDate(facultyRecord.date || facultyRecord.attendance_date).toLowerCase().includes(searchLower)
            );
        }
    });

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Attendance Reports</h1>
                        <p className="text-sm sm:text-base text-slate-600">Generate and download attendance reports in DOCX format</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-blue-100 text-center sm:text-left">
                        <span className="text-slate-700 font-semibold text-sm sm:text-base">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                            Total Records: {totalRecords}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6 sm:mb-8">
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 inline-flex space-x-2">
                    <button
                        onClick={() => setActiveCategory('student')}
                        className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${activeCategory === 'student'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Student Attendances</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeCategory === 'student' ? 'bg-white bg-opacity-20' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {studentAttendanceRecords.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveCategory('faculty')}
                        className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${activeCategory === 'faculty'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Faculty Attendances</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeCategory === 'faculty' ? 'bg-white bg-opacity-20' : 'bg-purple-100 text-purple-700'
                            }`}>
                            {facultyAttendanceRecords.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-full sm:max-w-lg">
                    <FileText className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        type="text"
                        placeholder="Search by subject, course code, or date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Attendance Records Grid */}
            {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <FileText className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No Attendance Records Found</h3>
                    <p className="text-slate-600">
                        {searchQuery ? 'Try adjusting your search criteria' : `No ${activeCategory} attendance records available yet`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredRecords.map((record) => {
                        const isStudent = activeCategory === 'student';
                        const studentRecord = isStudent ? (record as ClassAttendance) : null;
                        const facultyRecord = !isStudent ? (record as FacultyAttendance) : null;

                        return (
                            <div
                                key={record.id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 text-lg mb-1">
                                            {record.class_schedule?.subject_name || record.subject || 'N/A'}
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            {record.class_schedule?.course_code || (isStudent ? 'N/A' : facultyRecord?.department || 'N/A')}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${record.is_submitted
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {record.is_submitted ? 'Submitted' : 'Pending'}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                        <span>{formatDate(record.date || record.attendance_date)}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Users className="w-4 h-4 mr-2 text-purple-500" />
                                        <span>
                                            {isStudent
                                                ? (studentRecord?.class_schedule?.course_year || studentRecord?.section || 'N/A')
                                                : (facultyRecord?.department || 'N/A')
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                        <div className="text-xs text-slate-600">Present</div>
                                        <div className="text-lg font-bold text-green-700">{record.present_count || 0}</div>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 text-center">
                                        <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                        <div className="text-xs text-slate-600">Absent</div>
                                        <div className="text-lg font-bold text-red-700">{record.absent_count || 0}</div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={() => isStudent ? generateStudentDOCX(studentRecord!) : generateFacultyDOCX(facultyRecord!)}
                                    disabled={generating}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            <span>Generate Report</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

