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
    [key: string]: string; // For dynamic attendance1, attendance2, etc. properties
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

    try {
        let dateObj: Date;

        if (date instanceof Timestamp) {
            dateObj = date.toDate();
        } else if (typeof date === 'string') {
            // Try to parse the string date
            dateObj = new Date(date);
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                // If it's already in mm/dd/yyyy format, return it
                // Otherwise try to parse it differently
                const parts = date.split(/[\/\-]/);
                if (parts.length === 3) {
                    // Try to parse as mm/dd/yyyy or yyyy-mm-dd
                    const month = parseInt(parts[0], 10);
                    const day = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                        // If first part is > 12, it's probably yyyy-mm-dd
                        if (month > 12) {
                            dateObj = new Date(year, month - 1, day);
                        } else {
                            dateObj = new Date(year, month - 1, day);
                        }
                    } else {
                        return date; // Return as-is if can't parse
                    }
                } else {
                    return date; // Return as-is if format is unknown
                }
            }
        } else {
            return 'N/A';
        }

        // Format as mm/dd/yy
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2); // Get last 2 digits of year
        return `${month}/${day}/${year}`;
    } catch {
        // If formatting fails, return the original value or 'N/A'
        return typeof date === 'string' ? date : 'N/A';
    }
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
        // Use a map to track date index and ensure consistent date formatting
        const dateIndexMap = new Map<string, number>(); // Maps formatted date to index
        const dates: string[] = [];

        sortedData.forEach((attendanceData) => {
            // Format date consistently
            let reportDate: string;
            if (attendanceData.attendance_date) {
                // If attendance_date is already a formatted string, use it
                reportDate = attendanceData.attendance_date;
            } else {
                // Otherwise format it
                reportDate = formatDate(attendanceData.date);
            }

            // Only add unique dates
            if (!dateIndexMap.has(reportDate)) {
                const dateIndex = dates.length;
                dates.push(reportDate);
                dateIndexMap.set(reportDate, dateIndex);
            }

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

                // Store attendance by date index key (date1, date2, etc.)
                const dateIndex = dateIndexMap.get(reportDate)!;
                student.attendance[`date${dateIndex + 1}`] = attendanceSymbol;
            });
        });

        // Convert map to array and sort by name
        const studentsData = Array.from(studentMap.values())
            .sort((a, b) => a.student_name.localeCompare(b.student_name))
            .map((student, index) => {
                // Build attendance object with attendance1, attendance2, etc.
                const attendanceByDateIndex: { [key: string]: string } = {};

                // Initialize all attendance columns (up to 10) with empty string
                // Only initialize for dates that exist
                for (let i = 1; i <= dates.length; i++) {
                    const dateKey = `date${i}`;
                    const attendanceKey = `attendance${i}`;
                    // Get attendance symbol from student.attendance using dateKey
                    const attendanceSymbol = student.attendance[dateKey];
                    attendanceByDateIndex[attendanceKey] = attendanceSymbol || '';
                }

                // Initialize remaining attendance columns (if dates.length < 10) with empty strings
                for (let i = dates.length + 1; i <= 10; i++) {
                    attendanceByDateIndex[`attendance${i}`] = '';
                }

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
        // Initialize all date columns, filling with empty string if no date exists
        for (let i = 1; i <= 10; i++) {
            const dateIndex = i - 1;
            if (dates[dateIndex]) {
                templateData[`date${i}`] = dates[dateIndex];
            } else {
                // Set to empty string to avoid "undefined" in template
                templateData[`date${i}`] = '';
            }
        }

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

