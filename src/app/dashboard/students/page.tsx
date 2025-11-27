'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { studentService, Student, subjectService, Subject, classScheduleService, ClassSchedule, userService, Teacher, roomService, Room } from '@/lib/firestore';
import { parseClassListCSV, ParsedCSVData } from '@/lib/csvParser';
import DeleteConfirmationModal from '@/components/Modals/DeleteConfirmationModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    GraduationCap,
    Users,
    BookOpen,
    X,
    Save,
    Check,
    Upload,
    FileText,
    Loader2,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

export default function StudentsPage() {
    const { modalState, showConfirmation, closeModal } = useConfirmModal();
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [yearLevelFilter, setYearLevelFilter] = useState('');
    const [blockFilter, setBlockFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [studentToView, setStudentToView] = useState<Student | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        year_level: '',
        department: '',
        block: '',
        selectedSubjects: [] as string[]
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchStudents();
        fetchSubjects();
    }, []);

    useEffect(() => {
        filterStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, searchQuery, departmentFilter, yearLevelFilter, blockFilter]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const data = await studentService.getAllStudents();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const data = await subjectService.getAllSubjects();
            setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Clear selected subjects when year level or department changes
            selectedSubjects: (name === 'year_level' || name === 'department') ? [] : prev.selectedSubjects
        }));
    };

    const handleSubjectToggle = (subjectId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedSubjects: prev.selectedSubjects.includes(subjectId)
                ? prev.selectedSubjects.filter(id => id !== subjectId)
                : [...prev.selectedSubjects, subjectId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Extract department code from full department name (e.g., "BSIT - Bachelor..." -> "BSIT")
            const departmentCode = formData.department.split(' - ')[0].trim();

            // Extract year number from year_level (e.g., "4th Year" -> "4")
            const yearNumber = formData.year_level.includes('1st') ? '1' :
                formData.year_level.includes('2nd') ? '2' :
                    formData.year_level.includes('3rd') ? '3' : '4';

            // Generate section_year_block (e.g., "BSIT 4D")
            const section_year_block = `${departmentCode} ${yearNumber}${formData.block}`;

            const studentData = {
                full_name: formData.full_name,
                year_level: formData.year_level,
                department: formData.department,
                block: formData.block,
                section_year_block: section_year_block,
                subject: formData.selectedSubjects
            };

            await studentService.addStudent(studentData);
            await fetchStudents();
            setShowAddModal(false);
            setFormData({
                full_name: '',
                year_level: '',
                department: '',
                block: '',
                selectedSubjects: []
            });
        } catch (error) {
            console.error('Error adding student:', error);
            showConfirmation(
                'Error',
                'Failed to add student. Please try again.',
                () => closeModal(),
                'danger',
                'OK',
                ''
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentToEdit?.id) return;

        setIsUpdating(true);
        try {
            // Extract department code from full department name (e.g., "BSIT - Bachelor..." -> "BSIT")
            const departmentCode = formData.department.split(' - ')[0].trim();

            // Extract year number from year_level (e.g., "4th Year" -> "4")
            const yearNumber = formData.year_level.includes('1st') ? '1' :
                formData.year_level.includes('2nd') ? '2' :
                    formData.year_level.includes('3rd') ? '3' : '4';

            // Generate section_year_block (e.g., "BSIT 4D")
            const section_year_block = `${departmentCode} ${yearNumber}${formData.block}`;

            const studentData = {
                full_name: formData.full_name,
                year_level: formData.year_level,
                department: formData.department,
                block: formData.block,
                section_year_block: section_year_block,
                subject: formData.selectedSubjects
            };

            await studentService.updateStudent(studentToEdit.id, studentData);
            await fetchStudents();
            closeEditModal();
        } catch (error) {
            console.error('Error updating student:', error);
            showConfirmation(
                'Error',
                'Failed to update student. Please try again.',
                () => closeModal(),
                'danger',
                'OK',
                ''
            );
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setFormData({
            full_name: '',
            year_level: '',
            department: '',
            block: '',
            selectedSubjects: []
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDepartmentFilter('');
        setYearLevelFilter('');
        setBlockFilter('');
    };

    const filterStudents = useCallback(() => {
        let filtered = students;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(student =>
                student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.year_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.block.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply department filter
        if (departmentFilter) {
            filtered = filtered.filter(student => student.department === departmentFilter);
        }

        // Apply year level filter
        if (yearLevelFilter) {
            filtered = filtered.filter(student => student.year_level === yearLevelFilter);
        }

        // Apply block filter
        if (blockFilter) {
            filtered = filtered.filter(student => student.block === blockFilter);
        }

        // Sort alphabetically by full name
        filtered = filtered.sort((a, b) => {
            const nameA = a.full_name.toLowerCase().trim();
            const nameB = b.full_name.toLowerCase().trim();
            return nameA.localeCompare(nameB);
        });

        setFilteredStudents(filtered);
    }, [students, searchQuery, departmentFilter, yearLevelFilter, blockFilter]);

    const handleViewStudent = (student: Student) => {
        setStudentToView(student);
        setShowViewModal(true);
    };

    const handleEditStudent = (student: Student) => {
        setStudentToEdit(student);
        setFormData({
            full_name: student.full_name,
            year_level: student.year_level,
            department: student.department,
            block: student.block,
            selectedSubjects: student.subject || []
        });
        setShowEditModal(true);
    };

    const handleDeleteStudent = (student: Student) => {
        setStudentToDelete(student);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete?.id) return;

        setIsDeleting(true);
        try {
            await studentService.deleteStudent(studentToDelete.id);
            await fetchStudents();
            setShowDeleteModal(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error('Error deleting student:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setStudentToDelete(null);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setStudentToView(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setStudentToEdit(null);
        setFormData({
            full_name: '',
            year_level: '',
            department: '',
            block: '',
            selectedSubjects: []
        });
    };

    const handleImportCSV = async () => {
        if (!parsedData) return;

        setIsImporting(true);
        setImportResult(null);
        const details: Record<string, number> = {
            'Students Created': 0,
            'Students Updated': 0,
            'Subjects Created': 0,
            'Rooms Created': 0,
            'Class Schedules Created': 0,
            'Errors': 0
        };

        try {
            // Get all existing data
            setImportProgress({ current: 0, total: 5, message: 'Loading existing data...' });
            const [existingStudents, existingSubjects, existingTeachers, existingSchedules, existingRooms] = await Promise.all([
                studentService.getAllStudents(),
                subjectService.getAllSubjects(),
                userService.getTeachers(),
                classScheduleService.getAllClassSchedules(),
                roomService.getAllRooms()
            ]);

            // Find or create subject
            setImportProgress({ current: 1, total: 5, message: 'Processing subject...' });
            let subject = existingSubjects.find(s => s.course_code === parsedData.courseCode);
            let subjectId = '';

            if (!subject) {
                // Extract year level from section (e.g., "BSIT4D" -> "4th Year")
                const yearLevelMatch = parsedData.section.match(/(\d+)/);
                const yearLevel = yearLevelMatch ? `${yearLevelMatch[1]}th Year` : parsedData.yearLevel || 'Unknown';

                await subjectService.addSubject({
                    course_code: parsedData.courseCode,
                    subject_name: parsedData.subjectName,
                    department: parsedData.department,
                    year_level: yearLevel
                });
                // Refresh subjects to get the new ID
                const updatedSubjects = await subjectService.getAllSubjects();
                subject = updatedSubjects.find(s => s.course_code === parsedData.courseCode);
                details['Subjects Created']++;
            }

            if (subject) {
                subjectId = subject.id || '';
            }

            // Find teacher (if exists)
            setImportProgress({ current: 2, total: 5, message: 'Finding teacher...' });
            let teacher = existingTeachers.find(t =>
                t.full_name.toLowerCase().trim() === parsedData.facultyName.toLowerCase().trim()
            );
            const teacherId = teacher?.id || '';
            const teacherName = teacher?.full_name || parsedData.facultyName;

            // Process students
            setImportProgress({ current: 3, total: parsedData.students.length + 5, message: 'Processing students...' });
            let studentCount = 0;

            for (const studentData of parsedData.students) {
                studentCount++;
                setImportProgress({
                    current: 3 + studentCount,
                    total: parsedData.students.length + 5,
                    message: `Processing student ${studentCount}/${parsedData.students.length}: ${studentData.fullName}`
                });

                // Check if student exists (by full name)
                const existingStudent = existingStudents.find(s =>
                    s.full_name.toLowerCase().trim() === studentData.fullName.toLowerCase().trim()
                );

                // Extract year level from section
                const yearLevelMatch = parsedData.section.match(/(\d+)/);
                const yearLevel = yearLevelMatch ? `${yearLevelMatch[1]}th Year` : parsedData.yearLevel || 'Unknown';

                // Extract block letter from section (e.g., "BSIT4D" -> "D")
                const blockMatch = parsedData.section.match(/\d+([A-Z]+)$/);
                const block = blockMatch ? blockMatch[1] : parsedData.section.replace(/^[A-Z]+\d+/, '');

                if (existingStudent) {
                    // Merge: Add subject to existing student's subjects array if not already there
                    const currentSubjects = existingStudent.subject || [];
                    if (subjectId && !currentSubjects.includes(subjectId)) {
                        await studentService.updateStudent(existingStudent.id!, {
                            subject: [...currentSubjects, subjectId],
                            section_year_block: parsedData.section,
                            updated_at: new Date() as any
                        });
                        details['Students Updated']++;
                    }
                } else {
                    // Create new student
                    await studentService.addStudent({
                        full_name: studentData.fullName,
                        year_level: yearLevel,
                        department: parsedData.department,
                        block: block, // Use extracted block letter (e.g., "D")
                        section_year_block: parsedData.section,
                        subject: subjectId ? [subjectId] : []
                    });
                    details['Students Created']++;
                }
            }

            // Create/update rooms from schedules
            setImportProgress({
                current: parsedData.students.length + 4,
                total: parsedData.students.length + parsedData.schedules.length + 6,
                message: 'Processing rooms...'
            });

            // Extract unique rooms from schedules
            const uniqueRooms = new Set<string>();
            for (const sched of parsedData.schedules) {
                if (sched.room && sched.room.trim()) {
                    uniqueRooms.add(sched.room.trim());
                }
            }

            // Create rooms that don't exist
            for (const roomName of uniqueRooms) {
                const existingRoom = existingRooms.find(r =>
                    r.room_code.toLowerCase().trim() === roomName.toLowerCase().trim()
                );

                if (!existingRoom) {
                    await roomService.addRoom({
                        room_code: roomName
                    });
                    details['Rooms Created']++;
                }
            }

            // Create class schedules
            setImportProgress({
                current: parsedData.students.length + 5,
                total: parsedData.students.length + parsedData.schedules.length + 6,
                message: 'Creating class schedules...'
            });

            // Track processed schedules to avoid duplicates within the same import
            const processedScheduleKeys = new Set<string>();

            for (let i = 0; i < parsedData.schedules.length; i++) {
                const sched = parsedData.schedules[i];
                setImportProgress({
                    current: parsedData.students.length + 5 + i + 1,
                    total: parsedData.students.length + parsedData.schedules.length + 6,
                    message: `Creating schedule ${i + 1}/${parsedData.schedules.length}`
                });

                // Format schedule string
                const scheduleString = `${sched.day} ${sched.time}`;

                // Create a unique key for this schedule to check for duplicates
                const scheduleKey = `${parsedData.courseCode}|${parsedData.section}|${scheduleString}|${sched.room}`;

                // Skip if we've already processed this schedule in this import
                if (processedScheduleKeys.has(scheduleKey)) {
                    continue;
                }
                processedScheduleKeys.add(scheduleKey);

                // Check if schedule already exists in database
                const existingSchedule = existingSchedules.find(s =>
                    s.course_code === parsedData.courseCode &&
                    s.course_year === parsedData.section &&
                    s.schedule === scheduleString &&
                    s.building_room === sched.room
                );

                if (!existingSchedule && subjectId) {
                    const yearLevelMatch = parsedData.section.match(/(\d+)/);
                    const yearLevel = yearLevelMatch ? `${yearLevelMatch[1]}th Year` : parsedData.yearLevel || 'Unknown';

                    await classScheduleService.addClassSchedule({
                        teacher_id: teacherId,
                        teacher_name: teacherName,
                        subject_id: subjectId,
                        subject_name: parsedData.subjectName,
                        course_code: parsedData.courseCode,
                        department: parsedData.department,
                        year_level: yearLevel,
                        course_year: parsedData.section,
                        schedule: scheduleString,
                        building_room: sched.room
                    });
                    details['Class Schedules Created']++;
                }
            }

            setImportResult({
                success: true,
                message: 'CSV import completed successfully!',
                details
            });

        } catch (error) {
            console.error('Error importing CSV:', error);
            details['Errors']++;
            setImportResult({
                success: false,
                message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                details
            });
        } finally {
            setIsImporting(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-6 sm:h-8 bg-slate-200 rounded-2xl w-2/3 sm:w-1/4 mb-4 sm:mb-6"></div>
                    <div className="space-y-3 sm:space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="h-3 sm:h-4 bg-slate-200 rounded-xl w-2/3 sm:w-1/3 mb-2"></div>
                                        <div className="h-2.5 sm:h-3 bg-slate-200 rounded-xl w-full sm:w-1/2"></div>
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
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Students Management</h1>
                        <p className="text-sm sm:text-base text-slate-600">Track and manage student records</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-blue-100 text-center sm:text-left">
                            <span className="text-slate-700 font-semibold text-sm sm:text-base">
                                Total Students: {students.length}
                            </span>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                                <Upload className="w-5 h-5" />
                                <span className="font-medium text-sm sm:text-base">Import CSV</span>
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium text-sm sm:text-base">Add New Student</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-white to-slate-50 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4">
                    <div className="flex flex-col gap-3">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm shadow-sm hover:shadow-md"
                            />
                        </div>

                        {/* Filter Controls */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Year Level Filter */}
                            <div className="relative group">
                                <GraduationCap className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none z-10" />
                                <select
                                    value={yearLevelFilter}
                                    onChange={(e) => setYearLevelFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm min-w-[100px] shadow-sm hover:shadow-md appearance-none cursor-pointer font-medium text-slate-800 antialiased"
                                    style={{
                                        WebkitFontSmoothing: 'antialiased',
                                        MozOsxFontSmoothing: 'grayscale',
                                        textRendering: 'optimizeLegibility'
                                    }}
                                >
                                    <option value="" className="font-medium text-slate-800">All Years</option>
                                    <option value="1st Year" className="font-medium text-slate-800">1st Year</option>
                                    <option value="2nd Year" className="font-medium text-slate-800">2nd Year</option>
                                    <option value="3rd Year" className="font-medium text-slate-800">3rd Year</option>
                                    <option value="4th Year" className="font-medium text-slate-800">4th Year</option>
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div className="relative group">
                                <Users className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none z-10" />
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm min-w-[100px] shadow-sm hover:shadow-md appearance-none cursor-pointer font-medium text-slate-800 antialiased"
                                    style={{
                                        WebkitFontSmoothing: 'antialiased',
                                        MozOsxFontSmoothing: 'grayscale',
                                        textRendering: 'optimizeLegibility'
                                    }}
                                >
                                    <option value="" className="font-medium text-slate-800">All Departments</option>
                                    <option value="BSIT" className="font-medium text-slate-800">BSIT</option>
                                    <option value="BFPT" className="font-medium text-slate-800">BFPT</option>
                                    <option value="BTLED" className="font-medium text-slate-800">BTLED</option>
                                </select>
                            </div>

                            {/* Block Filter */}
                            <div className="relative group">
                                <BookOpen className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none z-10" />
                                <select
                                    value={blockFilter}
                                    onChange={(e) => setBlockFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm min-w-[100px] shadow-sm hover:shadow-md appearance-none cursor-pointer font-medium text-slate-800 antialiased"
                                    style={{
                                        WebkitFontSmoothing: 'antialiased',
                                        MozOsxFontSmoothing: 'grayscale',
                                        textRendering: 'optimizeLegibility'
                                    }}
                                >
                                    <option value="" className="font-medium text-slate-800">All Blocks</option>
                                    <option value="A" className="font-medium text-slate-800">Block A</option>
                                    <option value="B" className="font-medium text-slate-800">Block B</option>
                                    <option value="C" className="font-medium text-slate-800">Block C</option>
                                    <option value="D" className="font-medium text-slate-800">Block D</option>
                                    <option value="E" className="font-medium text-slate-800">Block E</option>
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {(searchQuery || departmentFilter || yearLevelFilter || blockFilter) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all duration-200 text-sm font-medium flex items-center space-x-1.5 shadow-sm hover:shadow-md"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(departmentFilter || yearLevelFilter || blockFilter) && (
                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-200">
                            <span className="text-xs text-slate-500 font-medium">Active:</span>
                            {yearLevelFilter && (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    {yearLevelFilter}
                                </span>
                            )}
                            {departmentFilter && (
                                <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                                    <Users className="w-3 h-3 mr-1" />
                                    {departmentFilter}
                                </span>
                            )}
                            {blockFilter && (
                                <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    Block {blockFilter}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Students Table */}
            {filteredStudents.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No students found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first student'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Year Level
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Block
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredStudents.map((student, index) => (
                                    <tr key={student.id} className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {getInitials(student.full_name)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{student.full_name}</div>
                                                    <div className="text-xs text-slate-500">Student #{students.indexOf(student) + 1}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <GraduationCap className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700">{student.year_level}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4 text-green-500" />
                                                <span className="text-sm font-medium text-slate-700">{student.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <BookOpen className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-medium text-slate-700">{student.block}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => handleViewStudent(student)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="View Student"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditStudent(student)}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Edit Student"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudent(student)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-800">Add New Student</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="full_name"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                            placeholder="Enter student's full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="year_level" className="block text-sm font-medium text-slate-700 mb-1">
                                            Year Level
                                        </label>
                                        <select
                                            id="year_level"
                                            name="year_level"
                                            value={formData.year_level}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 text-sm"
                                            required
                                        >
                                            <option value="">Select Year Level</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
                                            Department
                                        </label>
                                        <select
                                            id="department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 text-sm"
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                                            <option value="BFPT">BFPT - Bachelor of Food Processing Technology</option>
                                            <option value="BTLED">BTLED - Bachelor of Technology and Livelihood Education</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="block" className="block text-sm font-medium text-slate-700 mb-1">
                                            Block
                                        </label>
                                        <input
                                            type="text"
                                            id="block"
                                            name="block"
                                            value={formData.block}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                            placeholder="e.g., Block A"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Subject Selection */}
                                {formData.year_level && formData.department ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Select Subjects ({formData.year_level} - {formData.department})
                                        </label>
                                        <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                                            {(() => {
                                                const filteredSubjects = subjects.filter(subject =>
                                                    subject.department === formData.department &&
                                                    subject.year_level === formData.year_level
                                                );

                                                if (filteredSubjects.length === 0) {
                                                    return (
                                                        <div className="text-center py-4">
                                                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-slate-500 font-medium text-sm">No subjects available</p>
                                                            <p className="text-slate-400 text-xs mt-1">
                                                                for {formData.year_level} - {formData.department}
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {filteredSubjects.map((subject) => (
                                                            <div
                                                                key={subject.id}
                                                                onClick={() => handleSubjectToggle(subject.id!)}
                                                                className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.selectedSubjects.includes(subject.id!)
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-xs">{subject.subject_name}</div>
                                                                        <div className="text-xs text-slate-500">{subject.course_code}</div>
                                                                    </div>
                                                                    {formData.selectedSubjects.includes(subject.id!) && (
                                                                        <Check className="w-4 h-4 text-blue-600" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Selected: {formData.selectedSubjects.length} subject(s)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium text-sm">Select Year Level and Department</p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            Choose your year level and department above to see available subjects
                                        </p>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Add Student</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Student Modal */}
            {showViewModal && studentToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Student Details</h2>
                                <button
                                    onClick={closeViewModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Student Info */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                        {getInitials(studentToView.full_name)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{studentToView.full_name}</h3>
                                        <p className="text-slate-500 text-sm">Student #{students.indexOf(studentToView) + 1}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <GraduationCap className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-medium text-slate-600">Year Level</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{studentToView.year_level}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Users className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-medium text-slate-600">Department</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{studentToView.department}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-orange-500" />
                                            <span className="text-xs font-medium text-slate-600">Block</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{studentToView.block}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs font-medium text-slate-600">Subjects</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {studentToView.subject?.length || 0} enrolled
                                        </p>
                                    </div>
                                </div>

                                {/* Subjects List */}
                                {studentToView.subject && studentToView.subject.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Enrolled Subjects:</h4>
                                        <div className="space-y-2">
                                            {studentToView.subject.map((subjectId, index) => {
                                                const subject = subjects.find(s => s.id === subjectId);
                                                return subject ? (
                                                    <div key={index} className="bg-blue-50 rounded-lg p-2 flex items-center justify-between">
                                                        <div>
                                                            <span className="text-sm font-medium text-blue-800">{subject.subject_name}</span>
                                                            <span className="text-xs text-blue-600 ml-2">({subject.course_code})</span>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 mt-4">
                                <button
                                    onClick={closeViewModal}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium text-sm"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        closeViewModal();
                                        handleEditStudent(studentToView);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
                                >
                                    Edit Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-800">Edit Student</h2>
                                <button
                                    onClick={closeEditModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="edit_full_name" className="block text-sm font-medium text-slate-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_full_name"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                            placeholder="Enter student's full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit_year_level" className="block text-sm font-medium text-slate-700 mb-1">
                                            Year Level
                                        </label>
                                        <select
                                            id="edit_year_level"
                                            name="year_level"
                                            value={formData.year_level}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 text-sm"
                                            required
                                        >
                                            <option value="">Select Year Level</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="edit_department" className="block text-sm font-medium text-slate-700 mb-1">
                                            Department
                                        </label>
                                        <select
                                            id="edit_department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 text-sm"
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                                            <option value="BFPT">BFPT - Bachelor of Food Processing Technology</option>
                                            <option value="BTLED">BTLED - Bachelor of Technology and Livelihood Education</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="edit_block" className="block text-sm font-medium text-slate-700 mb-1">
                                            Block
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_block"
                                            name="block"
                                            value={formData.block}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                            placeholder="e.g., Block A"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Subject Selection */}
                                {formData.year_level && formData.department ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Select Subjects ({formData.year_level} - {formData.department})
                                        </label>
                                        <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                                            {(() => {
                                                const filteredSubjects = subjects.filter(subject =>
                                                    subject.department === formData.department &&
                                                    subject.year_level === formData.year_level
                                                );

                                                if (filteredSubjects.length === 0) {
                                                    return (
                                                        <div className="text-center py-4">
                                                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-slate-500 font-medium text-sm">No subjects available</p>
                                                            <p className="text-slate-400 text-xs mt-1">
                                                                for {formData.year_level} - {formData.department}
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {filteredSubjects.map((subject) => (
                                                            <div
                                                                key={subject.id}
                                                                onClick={() => handleSubjectToggle(subject.id!)}
                                                                className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.selectedSubjects.includes(subject.id!)
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-xs">{subject.subject_name}</div>
                                                                        <div className="text-xs text-slate-500">{subject.course_code}</div>
                                                                    </div>
                                                                    {formData.selectedSubjects.includes(subject.id!) && (
                                                                        <Check className="w-4 h-4 text-blue-600" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Selected: {formData.selectedSubjects.length} subject(s)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium text-sm">Select Year Level and Department</p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            Choose your year level and department above to see available subjects
                                        </p>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={closeEditModal}
                                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Update Student</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Delete Student"
                message="Are you sure you want to delete this student? This action cannot be undone and will permanently remove the student from the system."
                itemName={studentToDelete ? `${studentToDelete.full_name} (${studentToDelete.year_level} - ${studentToDelete.department})` : undefined}
                isLoading={isDeleting}
                confirmText="Delete Student"
                cancelText="Cancel"
            />

            {/* Error/Info Modal */}
            <ConfirmModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                onConfirm={() => {
                    modalState.onConfirm();
                }}
                onCancel={closeModal}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
            />

            {/* CSV Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <Upload className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Import CSV Class List</h2>
                                        <p className="text-sm text-slate-600">Upload and import students from CSV file</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setCsvFile(null);
                                        setParsedData(null);
                                        setImportResult(null);
                                        setImportProgress({ current: 0, total: 0, message: '' });
                                        setIsDragging(false);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* File Upload Section */}
                            {!parsedData && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Select CSV File
                                    </label>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-slate-300 hover:border-green-400'
                                            }`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDragging(true);
                                        }}
                                        onDragEnter={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDragging(false);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDragging(false);

                                            const file = e.dataTransfer.files?.[0];
                                            if (file) {
                                                // Check if file is CSV
                                                if (!file.name.toLowerCase().endsWith('.csv')) {
                                                    setImportResult({
                                                        success: false,
                                                        message: 'Please upload a CSV file only.'
                                                    });
                                                    return;
                                                }

                                                setCsvFile(file);
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const text = event.target?.result as string;
                                                    const parsed = parseClassListCSV(text);
                                                    if (parsed) {
                                                        setParsedData(parsed);
                                                    } else {
                                                        setImportResult({
                                                            success: false,
                                                            message: 'Failed to parse CSV file. Please check the format.'
                                                        });
                                                    }
                                                };
                                                reader.onerror = () => {
                                                    setImportResult({
                                                        success: false,
                                                        message: 'Error reading file. Please try again.'
                                                    });
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setCsvFile(file);
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const text = event.target?.result as string;
                                                        const parsed = parseClassListCSV(text);
                                                        if (parsed) {
                                                            setParsedData(parsed);
                                                        } else {
                                                            setImportResult({
                                                                success: false,
                                                                message: 'Failed to parse CSV file. Please check the format.'
                                                            });
                                                        }
                                                    };
                                                    reader.onerror = () => {
                                                        setImportResult({
                                                            success: false,
                                                            message: 'Error reading file. Please try again.'
                                                        });
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                            className="hidden"
                                            id="csv-upload"
                                        />
                                        <label
                                            htmlFor="csv-upload"
                                            className="cursor-pointer flex flex-col items-center space-y-4"
                                        >
                                            <FileText className={`w-12 h-12 ${isDragging ? 'text-green-500' : 'text-slate-400'}`} />
                                            <div>
                                                <span className="text-green-600 font-medium">Click to upload</span>
                                                <span className="text-slate-600"> or drag and drop</span>
                                            </div>
                                            <p className="text-xs text-slate-500">CSV files only</p>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Preview Section */}
                            {parsedData && !isImporting && !importResult && (
                                <div className="mb-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Preview</h3>
                                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm font-medium text-slate-600">Section:</span>
                                                <p className="text-slate-800 font-semibold">{parsedData.section}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-slate-600">Course Code:</span>
                                                <p className="text-slate-800 font-semibold">{parsedData.courseCode}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-sm font-medium text-slate-600">Subject:</span>
                                                <p className="text-slate-800 font-semibold">{parsedData.subjectName}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-slate-600">Faculty:</span>
                                                <p className="text-slate-800 font-semibold">{parsedData.facultyName || 'Not found'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-slate-600">Students:</span>
                                                <p className="text-slate-800 font-semibold">{parsedData.students.length}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-sm font-medium text-slate-600">Schedules:</span>
                                                <div className="mt-1 space-y-1">
                                                    {parsedData.schedules.map((sched, idx) => (
                                                        <p key={idx} className="text-slate-800 text-sm">
                                                            {sched.day} {sched.time} ({sched.room})
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleImportCSV}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                        >
                                            <Upload className="w-5 h-5" />
                                            <span>Import Data</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setParsedData(null);
                                                setCsvFile(null);
                                                setIsDragging(false);
                                            }}
                                            className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Import Progress */}
                            {isImporting && (
                                <div className="mb-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                            <span className="font-medium text-blue-800">Importing...</span>
                                        </div>
                                        {importProgress.total > 0 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-blue-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    {importProgress.current} / {importProgress.total} - {importProgress.message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Import Result */}
                            {importResult && (
                                <div className={`mb-6 rounded-lg p-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-start space-x-3">
                                        {importResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {importResult.message}
                                            </p>
                                            {importResult.details && (
                                                <div className="mt-2 text-sm space-y-1">
                                                    {Object.entries(importResult.details).map(([key, value]) => (
                                                        <p key={key} className={importResult.success ? 'text-green-700' : 'text-red-700'}>
                                                            • {key}: {String(value)}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setCsvFile(null);
                                            setParsedData(null);
                                            setImportResult(null);
                                            setImportProgress({ current: 0, total: 0, message: '' });
                                            setIsDragging(false);
                                            if (importResult.success) {
                                                fetchStudents();
                                                fetchSubjects();
                                            }
                                        }}
                                        className={`mt-4 w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${importResult.success
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                            }`}
                                    >
                                        {importResult.success ? 'Close & Refresh' : 'Close'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
