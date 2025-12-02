import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

interface AttendanceRecord {
    student_id: string;
    student_name: string;
    status: 'present' | 'absent' | 'late' | 'excuse';
    state?: 'Present' | 'Late' | 'Absent' | 'Excuse';
}

interface ClassAttendance {
    id?: string;
    subject?: string;
    section?: string;
    date?: Timestamp | string;
    attendance_date?: string;
    time?: string;
    class_schedule?: {
        subject_name?: string;
        course_code?: string;
        schedule?: string;
        building_room?: string;
        teacher_name?: string;
        course_year?: string;
        department?: string;
    };
    attendance_records?: AttendanceRecord[];
    total_students?: number;
    present_count?: number;
    absent_count?: number;
}

interface StudentData {
    no: string;
    name: string;
    course_year: string;
    [key: string]: string; // For dynamic date1, date2, etc. properties
}

interface TemplateData {
    subject: string;
    course_code: string;
    schedule: string;
    building_room: string;
    teacher: string;
    students: StudentData[];
    total_students: string;
    course_year: string;
    department: string;
    [key: string]: string | StudentData[]; // For dynamic date1, date2, etc. properties
}

function formatDate(date: Timestamp | string | undefined): string {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
        return date.toDate().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }
    if (typeof date === 'string') {
        return date;
    }
    return 'N/A';
}

export async function POST(request: NextRequest) {
    try {
        const { attendanceIds } = await request.json();

        if (!attendanceIds || !Array.isArray(attendanceIds) || attendanceIds.length === 0) {
            return NextResponse.json(
                { error: 'Attendance IDs are required' },
                { status: 400 }
            );
        }

        // Limit to 10 attendance records
        const limitedIds = attendanceIds.slice(0, 10);

        // Fetch all attendance records
        const attendanceQuery = query(
            collection(db, 'classAttendance'),
            where('__name__', 'in', limitedIds)
        );
        const snapshot = await getDocs(attendanceQuery);

        if (snapshot.empty) {
            return NextResponse.json(
                { error: 'No attendance records found' },
                { status: 404 }
            );
        }

        const attendanceDataList: ClassAttendance[] = [];
        snapshot.docs.forEach((doc) => {
            attendanceDataList.push({
                id: doc.id,
                ...doc.data(),
            } as ClassAttendance);
        });

        // Sort by date (most recent first, then take first 10)
        attendanceDataList.sort((a, b) => {
            const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.attendance_date || '');
            const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.attendance_date || '');
            return dateB.getTime() - dateA.getTime();
        });

        const sortedData = attendanceDataList.slice(0, 10);

        // Get all unique students across all attendance records
        const studentMap = new Map<string, {
            student_id: string;
            student_name: string;
            course_year: string;
            attendance: { [date: string]: string };
        }>();

        // Get subject info from first record
        const firstRecord = sortedData[0];
        const subjectName = firstRecord.class_schedule?.subject_name || firstRecord.subject || 'N/A';
        const courseCode = firstRecord.class_schedule?.course_code || 'N/A';
        const schedule = firstRecord.class_schedule?.schedule || firstRecord.time || 'N/A';
        const buildingRoom = firstRecord.class_schedule?.building_room || 'N/A';
        const teacherName = firstRecord.class_schedule?.teacher_name || 'N/A';
        const courseYear = firstRecord.class_schedule?.course_year || firstRecord.section || 'N/A';
        const department = firstRecord.class_schedule?.department || 'N/A';

        // Process each attendance record
        const dates: string[] = [];
        sortedData.forEach((attendanceData) => {
            const reportDate = attendanceData.attendance_date || formatDate(attendanceData.date);
            dates.push(reportDate);

            const attendanceStudents = attendanceData.attendance_records || [];

            attendanceStudents.forEach((record) => {
                const studentId = record.student_id || '';
                const studentName = record.student_name || 'N/A';

                if (!studentMap.has(studentId)) {
                    studentMap.set(studentId, {
                        student_id: studentId,
                        student_name: studentName,
                        course_year: courseYear,
                        attendance: {},
                    });
                }

                const student = studentMap.get(studentId)!;
                // Determine attendance symbol
                let attendanceSymbol = 'X';
                const state = record.state || record.status;
                if (state === 'Present' || state === 'present') {
                    attendanceSymbol = '✓';
                } else if (state === 'Late' || state === 'late') {
                    attendanceSymbol = 'L';
                } else if (state === 'Excuse' || state === 'excuse') {
                    attendanceSymbol = 'E';
                } else {
                    attendanceSymbol = 'X';
                }

                student.attendance[reportDate] = attendanceSymbol;
            });
        });

        // Convert map to array and sort by name
        const studentsData = Array.from(studentMap.values())
            .sort((a, b) => a.student_name.localeCompare(b.student_name))
            .map((student, index) => {
                // Map attendance by date to date1, date2, etc.
                const attendanceByDateIndex: { [key: string]: string } = {};
                dates.forEach((date, dateIndex) => {
                    attendanceByDateIndex[`date${dateIndex + 1}`] = student.attendance[date] || '';
                });

                return {
                    no: (index + 1).toString(),
                    name: student.student_name,
                    course_year: student.course_year,
                    ...attendanceByDateIndex,
                };
            });

        // Fetch the template file
        const templateResponse = await fetch(
            `${request.nextUrl.origin}/reports/FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx`
        );
        const templateArrayBuffer = await templateResponse.arrayBuffer();

        // Load the template
        const zip = new PizZip(templateArrayBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Prepare template data with multiple dates
        const templateData: TemplateData = {
            subject: subjectName,
            course_code: courseCode,
            schedule: schedule,
            building_room: buildingRoom,
            teacher: teacherName,
            students: studentsData,
            total_students: studentsData.length.toString(),
            course_year: courseYear,
            department: department,
        };

        // Add date columns (up to 10)
        dates.forEach((date, index) => {
            templateData[`date${index + 1}`] = date;
        });

        // Set the template data
        doc.render(templateData);

        // Generate the output document
        const output = doc.getZip().generate({
            type: 'nodebuffer',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const fileName = `Complete_Attendance_${subjectName.replace(/\s+/g, '_')}_${dates[0]?.replace(/\s+/g, '_') || 'Report'}.docx`;

        return new NextResponse(new Uint8Array(output), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error('Error generating complete report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

