import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types for our data models
export interface User {
    id?: string;
    fullname: string;
    email: string;
    phone?: string;
    isOnline?: boolean;
    lastActive?: Timestamp;
    lastIPAddress?: string;
    createdAt?: Timestamp;
    role?: string; // 'teacher', 'admin', 'student'
    department?: string;
    base64image?: string;
    face_trained?: boolean;
    face_descriptors?: number[]; // Face embedding for recognition
    training_date?: string;
    training_images_count?: number;
}

export interface Student {
    id?: string;
    full_name: string;
    year_level: string;
    department: string;
    block: string;
    subject?: string[];
    section_year_block?: string;
    face_trained?: boolean;
    face_descriptors?: number[]; // Face embedding for recognition
    training_date?: string;
    training_images_count?: number;
    accuracy?: number;
    created_at?: Timestamp;
    updated_at?: Timestamp;
}

export interface Teacher {
    id?: string;
    full_name: string;
    email: string;
    department: string;
    subjects?: string[];
    created_at?: Timestamp;
    updated_at?: Timestamp;
    base64image?: string;
}

export interface Subject {
    id?: string;
    course_code: string;
    subject_name: string;
    department: string;
    year_level: string;
    created_at?: Timestamp;
    updated_at?: Timestamp;
}

export interface Room {
    id?: string;
    room_code: string;
    created_at?: Timestamp;
    updated_at?: Timestamp;
}

export interface ClassSchedule {
    id?: string;
    teacher_id: string;
    teacher_name: string;
    subject_id: string;
    subject_name: string;
    course_code: string;
    department: string;
    year_level: string;
    course_year: string; // e.g., "BSIT 4D"
    schedule: string; // e.g., "MWF 8:00-9:00 AM"
    building_room: string; // e.g., "LECTURE – MAKESHIFT-04 LABORATORY – COMPLAB 2"
    created_at?: Timestamp;
    updated_at?: Timestamp;
}

export interface AttendanceRecord {
    student_id: string;
    student_name: string;
    status: 'present' | 'absent' | 'late';
    timestamp: Date;
    attendance_type: 'face' | 'manual'; // Distinguish between face recognition and manual entry
    confidence?: number; // Face recognition confidence (only for face type)
}

export interface ClassAttendance {
    id?: string;
    class_schedule: {
        building_room: string;
        course_code: string;
        course_year: string;
        department: string;
        schedule: string;
        subject_id: string;
        subject_name: string;
        teacher_id: string;
        teacher_name: string;
        year_level: string;
    };
    attendance_records: AttendanceRecord[];
    absent_count: number;
    present_count: number;
    late_count: number;
    total_students: number;
    created_at?: Timestamp;
    created_by?: string; // User ID who created the attendance
    attendance_date: string; // Date in YYYY-MM-DD format
}

export interface Holiday {
    id?: string;
    name: string;
    date: string;
    color: string;
    created_at?: Timestamp;
}

export interface ActivityLog {
    id?: string;
    action: string;
    user: string;
    details: string;
    timestamp: Timestamp;
}

export interface Admin {
    id?: string;
    uid: string; // Firebase Auth UID
    fullName: string;
    email: string;
    role: 'admin';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Admin operations
export const adminService = {
    async createAdmin(admin: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
        await addDoc(collection(db, 'admins'), {
            ...admin,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    },

    async getAdminByUid(uid: string): Promise<Admin | null> {
        const q = query(collection(db, 'admins'), where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as Admin;
    },

    async getAdminByEmail(email: string): Promise<Admin | null> {
        const q = query(collection(db, 'admins'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as Admin;
    },

    async getAllAdmins(): Promise<Admin[]> {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Admin[];
    },

    async isAdmin(uid: string): Promise<boolean> {
        const admin = await this.getAdminByUid(uid);
        return admin !== null && admin.role === 'admin';
    }
};

// Student operations
export const studentService = {
    async getAllStudents(): Promise<Student[]> {
        const querySnapshot = await getDocs(collection(db, 'students'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Student[];
    },

    // Alias for getAllStudents
    async getStudents(): Promise<Student[]> {
        return this.getAllStudents();
    },

    async addStudent(student: Omit<Student, 'id'>): Promise<void> {
        await addDoc(collection(db, 'students'), {
            ...student,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });
    },

    async updateStudent(id: string, student: Partial<Student>): Promise<void> {
        const studentRef = doc(db, 'students', id);
        await updateDoc(studentRef, {
            ...student,
            updated_at: Timestamp.now()
        });
    },

    async deleteStudent(id: string): Promise<void> {
        await deleteDoc(doc(db, 'students', id));
    },

    async getStudentById(id: string): Promise<Student | null> {
        const querySnapshot = await getDocs(
            query(collection(db, 'students'), where('__name__', '==', id))
        );
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Student;
    }
};

// Teacher operations
export const teacherService = {
    async getAllTeachers(): Promise<Teacher[]> {
        const querySnapshot = await getDocs(collection(db, 'teachers'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Teacher[];
    },

    async addTeacher(teacher: Omit<Teacher, 'id'>): Promise<void> {
        await addDoc(collection(db, 'teachers'), {
            ...teacher,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });
    },

    async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<void> {
        const teacherRef = doc(db, 'teachers', id);
        await updateDoc(teacherRef, {
            ...teacher,
            updated_at: Timestamp.now()
        });
    },

    async deleteTeacher(id: string): Promise<void> {
        await deleteDoc(doc(db, 'teachers', id));
    }
};

// Subject operations
export const subjectService = {
    async getAllSubjects(): Promise<Subject[]> {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Subject[];
    },

    async getSubjectsByDepartment(department: string): Promise<Subject[]> {
        const q = query(
            collection(db, 'subjects'),
            where('department', '==', department)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Subject[];
    },

    async addSubject(subject: Omit<Subject, 'id'>): Promise<void> {
        await addDoc(collection(db, 'subjects'), {
            ...subject,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });
    },

    async updateSubject(id: string, subject: Partial<Subject>): Promise<void> {
        const subjectRef = doc(db, 'subjects', id);
        await updateDoc(subjectRef, {
            ...subject,
            updated_at: Timestamp.now()
        });
    },

    async deleteSubject(id: string): Promise<void> {
        await deleteDoc(doc(db, 'subjects', id));
    }
};

// Room operations
export const roomService = {
    async getAllRooms(): Promise<Room[]> {
        const querySnapshot = await getDocs(collection(db, 'rooms'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Room[];
    },

    async addRoom(room: Omit<Room, 'id'>): Promise<void> {
        await addDoc(collection(db, 'rooms'), {
            ...room,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });
    },

    async updateRoom(id: string, room: Partial<Room>): Promise<void> {
        const roomRef = doc(db, 'rooms', id);
        await updateDoc(roomRef, {
            ...room,
            updated_at: Timestamp.now()
        });
    },

    async deleteRoom(id: string): Promise<void> {
        await deleteDoc(doc(db, 'rooms', id));
    }
};

// Holiday operations
export const holidayService = {
    async getAllHolidays(): Promise<Holiday[]> {
        const querySnapshot = await getDocs(collection(db, 'holidays'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Holiday[];
    },

    async addHoliday(holiday: Omit<Holiday, 'id'>): Promise<void> {
        await addDoc(collection(db, 'holidays'), {
            ...holiday,
            created_at: Timestamp.now()
        });
    },

    async deleteHoliday(id: string): Promise<void> {
        await deleteDoc(doc(db, 'holidays', id));
    }
};

// Activity log operations
export const activityLogService = {
    async getAllActivityLogs(): Promise<ActivityLog[]> {
        const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ActivityLog[];
    },

    async addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
        await addDoc(collection(db, 'activity_logs'), {
            ...log,
            timestamp: Timestamp.now()
        });
    }
};

// User service for fetching users as teachers
export const userService = {
    async getAllUsers(): Promise<User[]> {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as User[];
    },

    async getUsersByRole(role: string): Promise<User[]> {
        const q = query(collection(db, 'users'), where('role', '==', role));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as User[];
    },

    async updateUser(id: string, data: Partial<User>): Promise<void> {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
            ...data,
            lastActive: serverTimestamp()
        });
    },

    async getTeachers(): Promise<Teacher[]> {
        const users = await this.getAllUsers();
        // Filter users who are teachers or have teacher-like data
        return users
            .filter(user => user.role === 'teacher' || (!user.role && user.email && user.fullname))
            .map(user => ({
                id: user.id,
                full_name: user.fullname,
                email: user.email,
                department: user.department || 'General',
                created_at: user.createdAt,
                updated_at: user.lastActive,
                base64image: user.base64image
            })) as Teacher[];
    }
};

// Class Schedule service
export const classScheduleService = {
    async getAllClassSchedules(): Promise<ClassSchedule[]> {
        const querySnapshot = await getDocs(collection(db, 'classSchedules'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ClassSchedule[];
    },

    // Alias for getAllClassSchedules
    async getClassSchedules(): Promise<ClassSchedule[]> {
        return this.getAllClassSchedules();
    },

    async addClassSchedule(classSchedule: Omit<ClassSchedule, 'id'>): Promise<void> {
        await addDoc(collection(db, 'classSchedules'), {
            ...classSchedule,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
    },

    async updateClassSchedule(id: string, classSchedule: Partial<ClassSchedule>): Promise<void> {
        await updateDoc(doc(db, 'classSchedules', id), {
            ...classSchedule,
            updated_at: serverTimestamp()
        });
    },

    async deleteClassSchedule(id: string): Promise<void> {
        await deleteDoc(doc(db, 'classSchedules', id));
    }
};

// Class Attendance service
export const classAttendanceService = {
    async getAllClassAttendance(): Promise<ClassAttendance[]> {
        const querySnapshot = await getDocs(
            query(collection(db, 'classAttendance'), orderBy('created_at', 'desc'))
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ClassAttendance[];
    },

    async getClassAttendanceById(id: string): Promise<ClassAttendance | null> {
        const docSnap = await getDocs(
            query(collection(db, 'classAttendance'), where('__name__', '==', id))
        );
        if (docSnap.empty) return null;

        const docData = docSnap.docs[0];
        return { id: docData.id, ...docData.data() } as ClassAttendance;
    },

    async getClassAttendanceByScheduleId(scheduleId: string): Promise<ClassAttendance[]> {
        const querySnapshot = await getDocs(
            query(
                collection(db, 'classAttendance'),
                where('class_schedule.subject_id', '==', scheduleId),
                orderBy('created_at', 'desc')
            )
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ClassAttendance[];
    },

    async getClassAttendanceByDate(date: string): Promise<ClassAttendance[]> {
        const querySnapshot = await getDocs(
            query(
                collection(db, 'classAttendance'),
                where('attendance_date', '==', date),
                orderBy('created_at', 'desc')
            )
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ClassAttendance[];
    },

    async addClassAttendance(attendance: Omit<ClassAttendance, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'classAttendance'), {
            ...attendance,
            created_at: serverTimestamp()
        });
        return docRef.id;
    },

    async updateClassAttendance(id: string, attendance: Partial<ClassAttendance>): Promise<void> {
        await updateDoc(doc(db, 'classAttendance', id), attendance);
    },

    async deleteClassAttendance(id: string): Promise<void> {
        await deleteDoc(doc(db, 'classAttendance', id));
    }
};

// Dashboard statistics
export const dashboardService = {
    async getStatistics() {
        const [students, teachers, subjects, holidays] = await Promise.all([
            getDocs(collection(db, 'students')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'subjects')),
            getDocs(collection(db, 'holidays'))
        ]);

        return {
            totalStudents: students.size,
            totalTeachers: teachers.size,
            totalSubjects: subjects.size,
            totalHolidays: holidays.size
        };
    }
};
