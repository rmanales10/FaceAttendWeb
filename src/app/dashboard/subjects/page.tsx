'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { subjectService, Subject } from '@/lib/firestore';
import DeleteConfirmationModal from '@/components/Modals/DeleteConfirmationModal';
import { useToast } from '@/components/Toast/Toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    BookOpen,
    Hash,
    GraduationCap,
    X,
    Save
} from 'lucide-react';

export default function SubjectsPage() {
    const { showToast } = useToast();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [yearLevelFilter, setYearLevelFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
    const [subjectToView, setSubjectToView] = useState<Subject | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        course_code: '',
        department: '',
        subject_name: '',
        year_level: ''
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        filterSubjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjects, searchQuery, departmentFilter, yearLevelFilter]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const data = await subjectService.getAllSubjects();
            setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDepartmentFilter('');
        setYearLevelFilter('');
    };

    const filterSubjects = useCallback(() => {
        let filtered = subjects;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(subject =>
                subject.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (subject.year_level && subject.year_level.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply department filter
        if (departmentFilter) {
            filtered = filtered.filter(subject => subject.department === departmentFilter);
        }

        // Apply year level filter
        if (yearLevelFilter) {
            filtered = filtered.filter(subject => subject.year_level === yearLevelFilter);
        }

        setFilteredSubjects(filtered);
    }, [subjects, searchQuery, departmentFilter, yearLevelFilter]);

    const handleViewSubject = (subject: Subject) => {
        setSubjectToView(subject);
        setShowViewModal(true);
    };

    const handleEditSubject = (subject: Subject) => {
        setSubjectToEdit(subject);
        setFormData({
            course_code: subject.course_code,
            department: subject.department,
            subject_name: subject.subject_name,
            year_level: subject.year_level
        });
        setShowEditModal(true);
    };

    const handleDeleteSubject = (subject: Subject) => {
        setSubjectToDelete(subject);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!subjectToDelete?.id) return;

        setIsDeleting(true);
        try {
            await subjectService.deleteSubject(subjectToDelete.id);
            await fetchSubjects();
            setShowDeleteModal(false);
            setSubjectToDelete(null);
        } catch (error) {
            console.error('Error deleting subject:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setSubjectToDelete(null);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSubjectToView(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSubjectToEdit(null);
        setFormData({
            course_code: '',
            department: '',
            subject_name: '',
            year_level: ''
        });
    };

    const handleUpdateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectToEdit?.id) return;

        setIsUpdating(true);
        try {
            const subjectData = {
                course_code: formData.course_code,
                department: formData.department,
                subject_name: formData.subject_name,
                year_level: formData.year_level
            };

            await subjectService.updateSubject(subjectToEdit.id, subjectData);
            await fetchSubjects();
            closeEditModal();
        } catch (error) {
            console.error('Error updating subject:', error);
            showToast('Error updating subject. Please try again.', 'error', 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const subjectData = {
                course_code: formData.course_code,
                department: formData.department,
                subject_name: formData.subject_name,
                year_level: formData.year_level
            };

            await subjectService.addSubject(subjectData);
            await fetchSubjects();
            setShowAddModal(false);
            setFormData({
                course_code: '',
                department: '',
                subject_name: '',
                year_level: ''
            });
        } catch (error) {
            console.error('Error adding subject:', error);
            showToast('Error adding subject. Please try again.', 'error', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setFormData({
            course_code: '',
            department: '',
            subject_name: '',
            year_level: ''
        });
    };

    const getDepartmentLogo = (department: string) => {
        switch (department.toLowerCase()) {
            case 'bsit':
                return '/logo/bsit.png';
            case 'bfpt':
                return '/logo/bfpt.png';
            case 'btled':
                return '/logo/btled.png';
            default:
                return '/images/logo.png';
        }
    };

    const getDepartmentColor = (department: string) => {
        switch (department.toLowerCase()) {
            case 'bsit':
                return 'from-blue-500 to-indigo-600';
            case 'bfpt':
                return 'from-green-500 to-emerald-600';
            case 'btled':
                return 'from-purple-500 to-violet-600';
            default:
                return 'from-slate-500 to-slate-600';
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-6 sm:h-8 bg-slate-200 rounded-2xl w-2/3 sm:w-1/4 mb-4 sm:mb-6"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                                <div className="text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6"></div>
                                    <div className="h-5 sm:h-6 bg-slate-200 rounded-xl w-3/4 mx-auto mb-3 sm:mb-4"></div>
                                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                        <div className="h-3 sm:h-4 bg-slate-200 rounded-xl w-1/2 mx-auto"></div>
                                        <div className="h-3 sm:h-4 bg-slate-200 rounded-xl w-2/3 mx-auto"></div>
                                        <div className="h-3 sm:h-4 bg-slate-200 rounded-xl w-1/3 mx-auto"></div>
                                    </div>
                                    <div className="flex justify-center space-x-2 sm:space-x-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-lg sm:rounded-xl"></div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-lg sm:rounded-xl"></div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-lg sm:rounded-xl"></div>
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Subjects Management</h1>
                        <p className="text-sm sm:text-base text-slate-600">Track and manage subject records</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-blue-100 text-center sm:text-left">
                            <span className="text-slate-700 font-semibold text-sm sm:text-base">
                                Total Subjects: {subjects.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium text-sm sm:text-base">Add New Subject</span>
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
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm shadow-sm hover:shadow-md"
                            />
                        </div>

                        {/* Filter Controls */}
                        <div className="flex items-center gap-2">
                            {/* Department Filter */}
                            <div className="relative group">
                                <GraduationCap className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none z-10" />
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

                            {/* Year Level Filter */}
                            <div className="relative group">
                                <BookOpen className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none z-10" />
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
                                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
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

            {/* Subjects Table */}
            {filteredSubjects.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No subjects found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first subject'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Course Code
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Year Level
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredSubjects.map((subject, index) => (
                                    <tr key={subject.id} className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                                                    <Image
                                                        src={getDepartmentLogo(subject.department)}
                                                        alt={`${subject.department} Logo`}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{subject.subject_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <Hash className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700">{subject.course_code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${getDepartmentColor(subject.department)}`}>
                                                <GraduationCap className="w-4 h-4" />
                                                <span>{subject.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <BookOpen className="w-4 h-4 text-slate-500" />
                                                <span className="text-sm text-slate-600">{subject.year_level || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => handleViewSubject(subject)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="View Subject"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSubject(subject)}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Edit Subject"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSubject(subject)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Delete Subject"
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

            {/* Add Subject Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New Subject</h2>
                                    <p className="text-blue-100 text-sm">Create a new subject record</p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Row 1: Course Code and Subject Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="group">
                                        <label htmlFor="course_code" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <Hash className="w-3 h-3 text-blue-500" />
                                            <span>Course Code</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="course_code"
                                                name="course_code"
                                                value={formData.course_code}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                                placeholder="e.g., IT-112"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="subject_name" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <BookOpen className="w-3 h-3 text-emerald-500" />
                                            <span>Subject Name</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="subject_name"
                                                name="subject_name"
                                                value={formData.subject_name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                                placeholder="e.g., Mobile Programming"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Department and Year Level */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="group">
                                        <label htmlFor="department" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <GraduationCap className="w-3 h-3 text-purple-500" />
                                            <span>Department</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="department"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 focus:border-purple-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                                                <option value="BFPT">BFPT - Bachelor of Food Processing Technology</option>
                                                <option value="BTLED">BTLED - Bachelor of Technology and Livelihood Education</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="year_level" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <BookOpen className="w-3 h-3 text-orange-500" />
                                            <span>Year Level</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="year_level"
                                                name="year_level"
                                                value={formData.year_level}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 focus:border-orange-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Select Year Level</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>
                                    </div>
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
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Add Subject</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Subject Modal */}
            {showViewModal && subjectToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Subject Details</h2>
                                <button
                                    onClick={closeViewModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Subject Info */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                                        <Image
                                            src={getDepartmentLogo(subjectToView.department)}
                                            alt={`${subjectToView.department} Logo`}
                                            width={48}
                                            height={48}
                                            className="object-contain rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{subjectToView.subject_name}</h3>
                                        <p className="text-slate-500 text-sm">{subjectToView.course_code}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Hash className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-medium text-slate-600">Course Code</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{subjectToView.course_code}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <GraduationCap className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-medium text-slate-600">Department</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{subjectToView.department}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-orange-500" />
                                            <span className="text-xs font-medium text-slate-600">Year Level</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{subjectToView.year_level || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs font-medium text-slate-600">Subject Name</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{subjectToView.subject_name}</p>
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
                                        handleEditSubject(subjectToView);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
                                >
                                    Edit Subject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Subject Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Subject</h2>
                                    <p className="text-emerald-100 text-sm">Update subject information</p>
                                </div>
                                <button
                                    onClick={closeEditModal}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">

                            {/* Form */}
                            <form onSubmit={handleUpdateSubject} className="space-y-4">
                                {/* Row 1: Course Code and Subject Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="group">
                                        <label htmlFor="edit_course_code" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <Hash className="w-3 h-3 text-blue-500" />
                                            <span>Course Code</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="edit_course_code"
                                                name="course_code"
                                                value={formData.course_code}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                                placeholder="e.g., IT-112"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="edit_subject_name" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <BookOpen className="w-3 h-3 text-emerald-500" />
                                            <span>Subject Name</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="edit_subject_name"
                                                name="subject_name"
                                                value={formData.subject_name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                                placeholder="e.g., Mobile Programming"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Department and Year Level */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="group">
                                        <label htmlFor="edit_department" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <GraduationCap className="w-3 h-3 text-purple-500" />
                                            <span>Department</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="edit_department"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 focus:border-purple-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                                                <option value="BFPT">BFPT - Bachelor of Food Processing Technology</option>
                                                <option value="BTLED">BTLED - Bachelor of Technology and Livelihood Education</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="edit_year_level" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                            <BookOpen className="w-3 h-3 text-orange-500" />
                                            <span>Year Level</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="edit_year_level"
                                                name="year_level"
                                                value={formData.year_level}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 focus:border-orange-500 focus:bg-white transition-all duration-200 text-slate-800 text-sm appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Select Year Level</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>
                                    </div>
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
                                                <span>Update Subject</span>
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
                title="Delete Subject"
                message="Are you sure you want to delete this subject? This action cannot be undone and will permanently remove the subject from the system."
                itemName={subjectToDelete ? `${subjectToDelete.subject_name} (${subjectToDelete.course_code})` : undefined}
                isLoading={isDeleting}
                confirmText="Delete Subject"
                cancelText="Cancel"
            />
        </div>
    );
}
