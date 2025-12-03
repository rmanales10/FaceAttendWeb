import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { list } from '@vercel/blob';

interface AttendanceRecord {
    student_id: string;
    student_name: string;
    status: 'present' | 'absent' | 'late' | 'excuse';
    state?: 'Present' | 'Late' | 'Absent' | 'Excuse';
}

interface ClassAttendance {
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

interface TemplateInfo {
    id: string;
    name: string;
    size?: number;
    uploadedAt?: number;
    url?: string;
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
        const courseYear = firstRecord.class_schedule?.course_year || firstRecord.section || 'N/A';
        const schedule = firstRecord.class_schedule?.schedule || firstRecord.time || 'N/A';
        const buildingRoom = firstRecord.class_schedule?.building_room || 'N/A';
        const teacherName = firstRecord.class_schedule?.teacher_name || 'N/A';
        const department = firstRecord.class_schedule?.department || 'N/A';

        // Collect all students and their attendance for each date
        sortedData.forEach((attendanceRecord) => {
            const recordDate = attendanceRecord.date instanceof Timestamp
                ? attendanceRecord.date.toDate().toISOString().split('T')[0]
                : attendanceRecord.attendance_date || '';

            (attendanceRecord.attendance_records || []).forEach((record) => {
                const studentId = record.student_id;
                if (!studentMap.has(studentId)) {
                    studentMap.set(studentId, {
                        student_id: studentId,
                        student_name: record.student_name,
                        course_year: courseYear,
                        attendance: {},
                    });
                }

                const student = studentMap.get(studentId)!;
                // Map attendance status to symbol
                let attendanceSymbol = 'X'; // Default to absent
                const state = record.state || record.status;
                if (state === 'Present' || state === 'present') {
                    attendanceSymbol = '✓';
                } else if (state === 'Late' || state === 'late') {
                    attendanceSymbol = 'L';
                } else if (state === 'Excuse' || state === 'excuse') {
                    attendanceSymbol = 'E';
                }
                student.attendance[recordDate] = attendanceSymbol;
            });
        });

        // Convert map to array and sort by student name
        const studentsArray = Array.from(studentMap.values()).sort((a, b) =>
            a.student_name.localeCompare(b.student_name)
        );

        // Get unique dates and sort them
        const datesSet = new Set<string>();
        studentsArray.forEach((student) => {
            Object.keys(student.attendance).forEach((date) => datesSet.add(date));
        });
        const dates = Array.from(datesSet).sort().slice(0, 10); // Limit to 10 dates

        // Format dates for template
        const formattedDates = dates.map((dateStr) => {
            try {
                const date = new Date(dateStr);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                return `${month}/${day}/${year}`;
            } catch {
                return dateStr;
            }
        });

        // Prepare student data with attendance for each date
        const studentsData: StudentData[] = studentsArray.map((student, index) => {
            const attendanceByDateIndex: { [key: string]: string } = {};

            // Map attendance for each date
            dates.forEach((dateStr, dateIndex) => {
                const attendanceKey = `attendance${dateIndex + 1}`;
                const attendanceSymbol = student.attendance[dateStr] || '';
                attendanceByDateIndex[attendanceKey] = attendanceSymbol || '';
            });

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

        // Fetch the template file from Vercel Blob Storage or fallback to public folder
        let templateBuffer: ArrayBuffer;
        try {
            const SELECTED_TEMPLATE_KEY = 'templates/selected.json';
            const TEMPLATES_LIST_KEY = 'templates/templates.json';

            // Get selected template ID
            const selectedList = await list({ prefix: SELECTED_TEMPLATE_KEY });
            if (selectedList.blobs.length === 0) {
                throw new Error('No template selected');
            }

            const selectedBlob = selectedList.blobs[0];
            const selectedResponse = await fetch(selectedBlob.url);
            const selected = await selectedResponse.json();
            const templateId = selected.templateId;

            if (!templateId) {
                throw new Error('No template selected');
            }

            // Get template info
            const templatesList = await list({ prefix: TEMPLATES_LIST_KEY });
            if (templatesList.blobs.length === 0) {
                throw new Error('No templates list found');
            }

            const listBlob = templatesList.blobs[0];
            const templatesResponse = await fetch(listBlob.url);
            const templates: TemplateInfo[] = await templatesResponse.json();
            const template = templates.find((t) => t.id === templateId);

            if (!template) {
                throw new Error('Template not found');
            }

            // Fetch the template file from Blob Storage
            const templateFileName = `templates/${templateId}.docx`;
            const templateBlobs = await list({ prefix: templateFileName });
            if (templateBlobs.blobs.length === 0) {
                throw new Error('Template file not found');
            }

            const templateBlob = templateBlobs.blobs[0];
            const fileResponse = await fetch(templateBlob.url);
            templateBuffer = await fileResponse.arrayBuffer();
        } catch {
            // Fallback to default template in public folder
            const templateResponse = await fetch(
                `${request.nextUrl.origin}/reports/FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx`
            );
            templateBuffer = await templateResponse.arrayBuffer();
        }

        // Load the template (PizZip accepts both Buffer and ArrayBuffer)
        const zip = new PizZip(templateBuffer);
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
            if (formattedDates[dateIndex]) {
                templateData[`date${i}`] = formattedDates[dateIndex];
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

        // Format filename as: IT413_IT_ELECTIVE_2_BSIT4D.docx
        // Extract subject name without course code for filename
        let subjectNameForFile = subjectName || 'SUBJECT';
        if (subjectName && subjectName.includes(' ')) {
            const parts = subjectName.split(' ');
            // If first part looks like a course code (e.g., "IT413"), remove it
            if (parts[0].match(/^[A-Z]{2,4}\d{3,4}$/)) {
                subjectNameForFile = parts.slice(1).join(' ');
            }
        }
        // Replace spaces with underscores and convert to uppercase
        subjectNameForFile = subjectNameForFile.replace(/\s+/g, '_').toUpperCase();

        const sectionForFile = courseYear.replace(/\s+/g, '_').toUpperCase();
        const courseCodeForFile = courseCode.toUpperCase();
        const fileName = `${courseCodeForFile}_${subjectNameForFile}_${sectionForFile}.docx`;

        return new NextResponse(new Uint8Array(output), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error('Error generating complete report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
