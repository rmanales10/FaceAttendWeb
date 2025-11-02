'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { classScheduleService, ClassSchedule, userService, Teacher, subjectService, Subject, studentService, Student, roomService, Room } from '@/lib/firestore';
import DeleteConfirmationModal from '@/components/Modals/DeleteConfirmationModal';
import { useToast } from '@/components/Toast/Toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Clock,
    MapPin,
    Users,
    BookOpen,
    GraduationCap,
    X,
    Save
} from 'lucide-react';

export default function ClassSchedulePage() {
    const { showToast } = useToast();
    const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
    const [filteredSchedules, setFilteredSchedules] = useState<ClassSchedule[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [yearLevelFilter, setYearLevelFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<ClassSchedule | null>(null);
    const [scheduleToEdit, setScheduleToEdit] = useState<ClassSchedule | null>(null);
    const [scheduleToView, setScheduleToView] = useState<ClassSchedule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [formData, setFormData] = useState({
        teacher_id: '',
        teacher_name: '',
        subject_id: '',
        subject_name: '',
        course_code: '',
        course_year: '',
        schedule: '',
        building_room: '',
        department: '',
        year_level: ''
    });

    const [scheduleData, setScheduleData] = useState({
        days: [] as string[],
        startTime: '',
        endTime: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterSchedules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classSchedules, searchQuery, departmentFilter, yearLevelFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedulesData, teachersData, subjectsData, studentsData, roomsData] = await Promise.all([
                classScheduleService.getAllClassSchedules(),
                userService.getTeachers(),
                subjectService.getAllSubjects(),
                studentService.getAllStudents(),
                roomService.getAllRooms()
            ]);
            setClassSchedules(schedulesData);
            setTeachers(teachersData);
            setSubjects(subjectsData);
            setStudents(studentsData);
            setRooms(roomsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterSchedules = useCallback(() => {
        let filtered = classSchedules;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(schedule =>
                schedule.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.year_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.course_year.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.schedule.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.building_room.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply department filter
        if (departmentFilter) {
            filtered = filtered.filter(schedule => schedule.department === departmentFilter);
        }

        // Apply year level filter
        if (yearLevelFilter) {
            filtered = filtered.filter(schedule => schedule.year_level === yearLevelFilter);
        }

        setFilteredSchedules(filtered);
    }, [classSchedules, searchQuery, departmentFilter, yearLevelFilter]);

    const clearFilters = () => {
        setSearchQuery('');
        setDepartmentFilter('');
        setYearLevelFilter('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubjectChange = (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            setFormData(prev => ({
                ...prev,
                subject_id: subjectId,
                subject_name: subject.subject_name,
                course_code: subject.course_code,
                department: subject.department,
                year_level: subject.year_level,
                course_year: '' // Clear course_year when subject changes
            }));
        }
    };

    const handleTeacherChange = (teacherId: string) => {
        const teacher = teachers.find(t => t.id === teacherId);
        if (teacher) {
            setFormData(prev => ({
                ...prev,
                teacher_id: teacherId,
                teacher_name: teacher.full_name
            }));
        }
    };

    const getCourseYearOptions = () => {
        const options = new Set<string>();

        // If no subject is selected, return empty array
        if (!formData.subject_id) {
            return [];
        }

        // Get the selected subject to filter by department and year level
        const selectedSubject = subjects.find(s => s.id === formData.subject_id);
        if (!selectedSubject) {
            return [];
        }

        // Filter students by the selected subject's department and year level
        const filteredStudents = students.filter(student =>
            student.department === selectedSubject.department &&
            student.year_level === selectedSubject.year_level
        );

        // Use the actual section_year_block field from students, or generate it if missing
        // This ensures exact matching between class schedules and student sections
        filteredStudents.forEach(student => {
            let sectionYearBlock;

            if (student.section_year_block) {
                // Use the existing section_year_block value
                sectionYearBlock = student.section_year_block.trim();
            } else {
                // Fallback: Generate it from department, year_level, and block (for old records)
                const departmentCode = student.department?.split(' - ')[0]?.trim() || '';
                const yearNumber = student.year_level?.includes('1st') ? '1' :
                    student.year_level?.includes('2nd') ? '2' :
                        student.year_level?.includes('3rd') ? '3' : '4';
                sectionYearBlock = `${departmentCode} ${yearNumber}${student.block || ''}`.trim();
            }

            if (sectionYearBlock) {
                options.add(sectionYearBlock);
            }
        });

        return Array.from(options).sort();
    };

    const toggleDay = (day: string) => {
        setScheduleData(prev => {
            const days = prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day];
            return { ...prev, days };
        });
    };

    const formatScheduleString = () => {
        if (scheduleData.days.length === 0 || !scheduleData.startTime || !scheduleData.endTime) {
            return '';
        }

        const daysStr = scheduleData.days.sort((a, b) => {
            const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return order.indexOf(a) - order.indexOf(b);
        }).join('');

        // Convert 24-hour format to 12-hour format with AM/PM
        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${period}`;
        };

        return `${daysStr} ${formatTime(scheduleData.startTime)} - ${formatTime(scheduleData.endTime)}`;
    };

    const parseScheduleString = (scheduleStr: string) => {
        // Parse a schedule string like "MWF 8:00 AM - 9:00 AM" back into components
        const match = scheduleStr.match(/^([A-Za-z]+)\s+(\d+:\d+)\s+(AM|PM)\s+-\s+(\d+:\d+)\s+(AM|PM)$/);
        if (match) {
            const [, daysStr, startTime12, startPeriod, endTime12, endPeriod] = match;
            const dayMap: { [key: string]: string } = {
                'M': 'Mon', 'T': 'Tue', 'W': 'Wed', 'Th': 'Thu', 'F': 'Fri', 'S': 'Sat', 'Su': 'Sun'
            };

            const days: string[] = [];
            let i = 0;
            while (i < daysStr.length) {
                if (i < daysStr.length - 1 && dayMap[daysStr.substring(i, i + 2)]) {
                    days.push(dayMap[daysStr.substring(i, i + 2)]);
                    i += 2;
                } else if (dayMap[daysStr[i]]) {
                    days.push(dayMap[daysStr[i]]);
                    i++;
                } else {
                    i++;
                }
            }

            // Convert 12-hour format to 24-hour format for time input
            const convertTo24Hour = (time: string, period: string) => {
                const [hours, minutes] = time.split(':');
                let hour = parseInt(hours);
                if (period === 'PM' && hour !== 12) {
                    hour += 12;
                } else if (period === 'AM' && hour === 12) {
                    hour = 0;
                }
                return `${hour.toString().padStart(2, '0')}:${minutes}`;
            };

            setScheduleData({
                days,
                startTime: convertTo24Hour(startTime12, startPeriod),
                endTime: convertTo24Hour(endTime12, endPeriod)
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that course_year is selected when subject is selected
        if (formData.subject_id && !formData.course_year) {
            if (getCourseYearOptions().length === 0) {
                showToast('No students are available for the selected subject. Please add students for this subject first.', 'warning', 6000);
            } else {
                showToast('Please select a Course & Year for the selected subject.', 'warning', 5000);
            }
            return;
        }

        // Format and validate schedule
        const formattedSchedule = formatScheduleString();
        if (!formattedSchedule) {
            showToast('Please complete the schedule information (days, start time, and end time).', 'warning', 5000);
            return;
        }

        setIsSubmitting(true);

        try {
            const scheduleDataToSubmit = {
                teacher_id: formData.teacher_id,
                teacher_name: formData.teacher_name,
                subject_id: formData.subject_id,
                subject_name: formData.subject_name,
                course_code: formData.course_code,
                department: formData.department,
                year_level: formData.year_level,
                course_year: formData.course_year,
                schedule: formattedSchedule,
                building_room: formData.building_room
            };

            await classScheduleService.addClassSchedule(scheduleDataToSubmit);
            await fetchData();
            setShowAddModal(false);
            setFormData({
                teacher_id: '',
                teacher_name: '',
                subject_id: '',
                subject_name: '',
                course_code: '',
                course_year: '',
                schedule: '',
                building_room: '',
                department: '',
                year_level: ''
            });
            setScheduleData({
                days: [],
                startTime: '',
                endTime: ''
            });
        } catch (error) {
            console.error('Error adding class schedule:', error);
            showToast('Error adding class schedule. Please try again.', 'error', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scheduleToEdit?.id) return;

        // Validate that course_year is selected when subject is selected
        if (formData.subject_id && !formData.course_year) {
            if (getCourseYearOptions().length === 0) {
                showToast('No students are available for the selected subject. Please add students for this subject first.', 'warning', 6000);
            } else {
                showToast('Please select a Course & Year for the selected subject.', 'warning', 5000);
            }
            return;
        }

        // Format and validate schedule
        const formattedSchedule = formatScheduleString();
        if (!formattedSchedule) {
            showToast('Please complete the schedule information (days, start time, and end time).', 'warning', 5000);
            return;
        }

        setIsUpdating(true);
        try {
            const scheduleDataToUpdate = {
                teacher_id: formData.teacher_id,
                teacher_name: formData.teacher_name,
                subject_id: formData.subject_id,
                subject_name: formData.subject_name,
                course_code: formData.course_code,
                department: formData.department,
                year_level: formData.year_level,
                course_year: formData.course_year,
                schedule: formattedSchedule,
                building_room: formData.building_room
            };

            await classScheduleService.updateClassSchedule(scheduleToEdit.id, scheduleDataToUpdate);
            await fetchData();
            closeEditModal();
        } catch (error) {
            console.error('Error updating class schedule:', error);
            showToast('Error updating class schedule. Please try again.', 'error', 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleViewSchedule = (schedule: ClassSchedule) => {
        setScheduleToView(schedule);
        setShowViewModal(true);
    };

    const handleEditSchedule = (schedule: ClassSchedule) => {
        setScheduleToEdit(schedule);
        setFormData({
            teacher_id: schedule.teacher_id,
            teacher_name: schedule.teacher_name,
            subject_id: schedule.subject_id,
            subject_name: schedule.subject_name,
            course_code: schedule.course_code,
            course_year: schedule.course_year,
            schedule: schedule.schedule,
            building_room: schedule.building_room,
            department: schedule.department,
            year_level: schedule.year_level
        });
        parseScheduleString(schedule.schedule);
        setShowEditModal(true);
    };

    const handleDeleteSchedule = (schedule: ClassSchedule) => {
        setScheduleToDelete(schedule);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!scheduleToDelete?.id) return;

        setIsDeleting(true);
        try {
            await classScheduleService.deleteClassSchedule(scheduleToDelete.id);
            await fetchData();
            setShowDeleteModal(false);
            setScheduleToDelete(null);
        } catch (error) {
            console.error('Error deleting class schedule:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setScheduleToDelete(null);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setScheduleToView(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setScheduleToEdit(null);
        setFormData({
            teacher_id: '',
            teacher_name: '',
            subject_id: '',
            subject_name: '',
            course_code: '',
            course_year: '',
            schedule: '',
            building_room: '',
            department: '',
            year_level: ''
        });
        setScheduleData({
            days: [],
            startTime: '',
            endTime: ''
        });
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setFormData({
            teacher_id: '',
            teacher_name: '',
            subject_id: '',
            subject_name: '',
            course_code: '',
            course_year: '',
            schedule: '',
            building_room: '',
            department: '',
            year_level: ''
        });
        setScheduleData({
            days: [],
            startTime: '',
            endTime: ''
        });
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Class Schedule Management</h1>
                        <p className="text-sm sm:text-base text-slate-600">Assign teachers to subjects with schedules and locations</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-purple-100 text-center sm:text-left">
                            <span className="text-slate-700 font-semibold text-sm sm:text-base">
                                Total Schedules: {classSchedules.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-violet-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium text-sm sm:text-base">Add New Schedule</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6">
                <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        {/* Search Bar */}
                        <div className="relative group sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-purple-500 transition-colors duration-200" />
                            <input
                                type="text"
                                placeholder="Search schedules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm shadow-sm hover:shadow-md"
                            />
                        </div>

                        {/* Filter Controls */}
                        <div className="flex items-center gap-2">
                            {/* Department Filter */}
                            <div className="relative group">
                                <GraduationCap className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-purple-500 transition-colors duration-200 pointer-events-none z-10" />
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm min-w-[100px] shadow-sm hover:shadow-md appearance-none cursor-pointer font-medium text-slate-800 antialiased"
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

                            {/* Year Level Filter */}
                            <div className="relative group">
                                <BookOpen className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-purple-500 transition-colors duration-200 pointer-events-none z-10" />
                                <select
                                    value={yearLevelFilter}
                                    onChange={(e) => setYearLevelFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm min-w-[100px] shadow-sm hover:shadow-md appearance-none cursor-pointer font-medium text-slate-800 antialiased"
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

                            {/* Clear Filters Button */}
                            {(searchQuery || departmentFilter || yearLevelFilter) && (
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
                    {(departmentFilter || yearLevelFilter) && (
                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-200">
                            <span className="text-xs text-slate-500 font-medium">Active:</span>
                            {departmentFilter && (
                                <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    {departmentFilter}
                                </span>
                            )}
                            {yearLevelFilter && (
                                <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {yearLevelFilter}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Class Schedules Table */}
            {filteredSchedules.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No class schedules found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first class schedule'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Teacher & Subject
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Course & Year
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Schedule
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Bldg. and Room No.
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredSchedules.map((schedule, index) => (
                                    <tr key={schedule.id} className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {schedule.teacher_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{schedule.teacher_name}</div>
                                                    <div className="text-xs text-slate-500">{schedule.subject_name}</div>
                                                    <div className="text-xs text-blue-600 font-medium">{schedule.course_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <GraduationCap className="w-4 h-4 text-purple-500" />
                                                <span className="text-sm font-medium text-slate-700">
                                                    {schedule.course_year}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="w-4 h-4 text-green-500" />
                                                <span className="text-sm font-medium text-slate-700">{schedule.schedule}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-medium text-slate-700">{schedule.building_room}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => handleViewSchedule(schedule)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="View Schedule"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSchedule(schedule)}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Edit Schedule"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchedule(schedule)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Delete Schedule"
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

            {/* Add Class Schedule Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New Class Schedule</h2>
                                    <p className="text-purple-100 text-sm">Assign teacher to subject with schedule and location</p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Row 1: Teacher and Building and Room */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label htmlFor="teacher_id" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <Users className="w-3 h-3 text-blue-500" />
                                            <span>Teacher</span>
                                        </label>
                                        <select
                                            id="teacher_id"
                                            name="teacher_id"
                                            value={formData.teacher_id}
                                            onChange={(e) => handleTeacherChange(e.target.value)}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Teacher</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id} className="font-medium text-slate-800">
                                                    {teacher.full_name} - {teacher.department}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="building_room" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <MapPin className="w-3 h-3 text-orange-500" />
                                            <span>Bldg. and Room No.</span>
                                        </label>
                                        <select
                                            id="building_room"
                                            name="building_room"
                                            value={formData.building_room}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 focus:border-orange-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Room</option>
                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.room_code}>
                                                    {room.room_code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Course & Year and Schedule */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Course & Year */}
                                    <div className="group">
                                        <label htmlFor="course_year" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <GraduationCap className="w-3 h-3 text-purple-500" />
                                            <span>Course & Year</span>
                                        </label>
                                        <select
                                            id="course_year"
                                            name="course_year"
                                            value={formData.course_year}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 focus:border-purple-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                            disabled={!formData.subject_id}
                                        >
                                            <option value="">{formData.subject_id ? 'Select Course & Year' : 'Select a subject first'}</option>
                                            {formData.subject_id && getCourseYearOptions().length > 0 ? (
                                                getCourseYearOptions().map(option => (
                                                    <option key={option} value={option} className="font-medium text-slate-800">
                                                        {option}
                                                    </option>
                                                ))
                                            ) : formData.subject_id ? (
                                                <option value="" disabled className="font-medium text-slate-500 italic">
                                                    No students found for this subject
                                                </option>
                                            ) : null}
                                        </select>
                                    </div>

                                    {/* Schedule Button */}
                                    <div className="group">
                                        <label className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <Clock className="w-3 h-3 text-orange-500" />
                                            <span>Schedule</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowScheduleModal(true)}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-left flex items-center justify-between group"
                                        >
                                            <span className="text-sm text-slate-700">
                                                {formatScheduleString() || 'Click to set schedule'}
                                            </span>
                                            <Clock className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform duration-200" />
                                        </button>
                                    </div>
                                </div>

                                {/* Row 3: Subject */}
                                <div className="group">
                                    <label htmlFor="subject_id" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <BookOpen className="w-3 h-3 text-emerald-500" />
                                        <span>Subject</span>
                                    </label>
                                    <select
                                        id="subject_id"
                                        name="subject_id"
                                        value={formData.subject_id}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id} className="font-medium text-slate-800">
                                                {subject.course_code} - {subject.subject_name} ({subject.department} {subject.year_level})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Add Schedule</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Class Schedule Modal */}
            {showViewModal && scheduleToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Class Schedule Details</h2>
                                <button
                                    onClick={closeViewModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Schedule Info */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {scheduleToView.teacher_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{scheduleToView.teacher_name}</h3>
                                        <p className="text-slate-500 text-sm">{scheduleToView.subject_name}</p>
                                        <p className="text-blue-600 text-sm font-medium">{scheduleToView.course_code}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <GraduationCap className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs font-medium text-slate-600">Course & Year</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {scheduleToView.course_year}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Clock className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-medium text-slate-600">Schedule</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{scheduleToView.schedule}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <MapPin className="w-4 h-4 text-orange-500" />
                                            <span className="text-xs font-medium text-slate-600">Bldg. and Room No.</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{scheduleToView.building_room}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-medium text-slate-600">Subject</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{scheduleToView.subject_name}</p>
                                        <p className="text-xs text-slate-500">{scheduleToView.course_code}</p>
                                    </div>
                                </div>
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
                                        handleEditSchedule(scheduleToView);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
                                >
                                    Edit Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Class Schedule Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Class Schedule</h2>
                                    <p className="text-emerald-100 text-sm">Update schedule information</p>
                                </div>
                                <button
                                    onClick={closeEditModal}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Form */}
                            <form onSubmit={handleUpdateSchedule} className="space-y-4">
                                {/* Row 1: Teacher and Building and Room */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label htmlFor="edit_teacher_id" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <Users className="w-3 h-3 text-blue-500" />
                                            <span>Teacher</span>
                                        </label>
                                        <select
                                            id="edit_teacher_id"
                                            name="teacher_id"
                                            value={formData.teacher_id}
                                            onChange={(e) => handleTeacherChange(e.target.value)}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Teacher</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id} className="font-medium text-slate-800">
                                                    {teacher.full_name} - {teacher.department}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="edit_building_room" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <MapPin className="w-3 h-3 text-orange-500" />
                                            <span>Bldg. and Room No.</span>
                                        </label>
                                        <select
                                            id="edit_building_room"
                                            name="building_room"
                                            value={formData.building_room}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 focus:border-orange-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Room</option>
                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.room_code}>
                                                    {room.room_code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Course & Year and Schedule */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Course & Year */}
                                    <div className="group">
                                        <label htmlFor="edit_course_year" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <GraduationCap className="w-3 h-3 text-purple-500" />
                                            <span>Course & Year</span>
                                        </label>
                                        <select
                                            id="edit_course_year"
                                            name="course_year"
                                            value={formData.course_year}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 focus:border-purple-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                            disabled={!formData.subject_id}
                                        >
                                            <option value="">{formData.subject_id ? 'Select Course & Year' : 'Select a subject first'}</option>
                                            {formData.subject_id && getCourseYearOptions().length > 0 ? (
                                                getCourseYearOptions().map(option => (
                                                    <option key={option} value={option} className="font-medium text-slate-800">
                                                        {option}
                                                    </option>
                                                ))
                                            ) : formData.subject_id ? (
                                                <option value="" disabled className="font-medium text-slate-500 italic">
                                                    No students found for this subject
                                                </option>
                                            ) : null}
                                        </select>
                                    </div>

                                    {/* Schedule Button */}
                                    <div className="group">
                                        <label className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <Clock className="w-3 h-3 text-orange-500" />
                                            <span>Schedule</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowScheduleModal(true)}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-left flex items-center justify-between group"
                                        >
                                            <span className="text-sm text-slate-700">
                                                {formatScheduleString() || 'Click to set schedule'}
                                            </span>
                                            <Clock className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform duration-200" />
                                        </button>
                                    </div>
                                </div>

                                {/* Row 3: Subject */}
                                <div className="group">
                                    <label htmlFor="edit_subject_id" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <BookOpen className="w-3 h-3 text-emerald-500" />
                                        <span>Subject</span>
                                    </label>
                                    <select
                                        id="edit_subject_id"
                                        name="subject_id"
                                        value={formData.subject_id}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id} className="font-medium text-slate-800">
                                                {subject.course_code} - {subject.subject_name} ({subject.department} {subject.year_level})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={closeEditModal}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Update Schedule</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Configuration Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Set Schedule</h2>
                                    <p className="text-orange-100 text-sm">Configure class days and time</p>
                                </div>
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Day Selector */}
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-3">Select Days:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${scheduleData.days.includes(day)
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Start Time:</p>
                                    <input
                                        type="time"
                                        value={scheduleData.startTime}
                                        onChange={(e) => setScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">End Time:</p>
                                    <input
                                        type="time"
                                        value={scheduleData.endTime}
                                        onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            {formatScheduleString() && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Preview:</strong> {formatScheduleString()}
                                    </p>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                                >
                                    Apply Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Delete Class Schedule"
                message="Are you sure you want to delete this class schedule? This action cannot be undone and will permanently remove the schedule from the system."
                itemName={scheduleToDelete ? `${scheduleToDelete.teacher_name} - ${scheduleToDelete.subject_name}` : undefined}
                isLoading={isDeleting}
                confirmText="Delete Schedule"
                cancelText="Cancel"
            />
        </div>
    );
}
