'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { userService, Teacher } from '@/lib/firestore';
import DeleteConfirmationModal from '@/components/Modals/DeleteConfirmationModal';
import {
    Search,
    Edit,
    Trash2,
    Eye,
    Users,
    Mail,
    BookOpen,
    X,
    Save
} from 'lucide-react';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [teacherToView, setTeacherToView] = useState<Teacher | null>(null);
    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        department: ''
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        filterTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teachers, searchQuery]);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const data = await userService.getTeachers();
            setTeachers(data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTeachers = useCallback(() => {
        if (!searchQuery.trim()) {
            setFilteredTeachers(teachers);
            return;
        }

        const filtered = teachers.filter(teacher =>
            teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTeachers(filtered);
    }, [teachers, searchQuery]);

    const handleDeleteTeacher = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!teacherToDelete?.id) return;

        setIsDeleting(true);
        try {
            // Note: This would need to be implemented in userService
            // For now, we'll just show an alert
            alert('Delete functionality will be implemented in userService');
            // await userService.deleteUser(teacherToDelete.id);
            // await fetchTeachers();
            setShowDeleteModal(false);
            setTeacherToDelete(null);
        } catch (error) {
            console.error('Error deleting teacher:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setTeacherToDelete(null);
    };

    const handleViewTeacher = (teacher: Teacher) => {
        setTeacherToView(teacher);
        setShowViewModal(true);
    };

    const handleEditTeacher = (teacher: Teacher) => {
        setTeacherToEdit(teacher);
        setFormData({
            full_name: teacher.full_name,
            email: teacher.email,
            department: teacher.department
        });
        setShowEditModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setTeacherToView(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setTeacherToEdit(null);
        setFormData({
            full_name: '',
            email: '',
            department: ''
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherToEdit?.id) return;

        setIsUpdating(true);
        try {
            // Note: This would need to be implemented in userService
            // For now, we'll just show an alert
            alert('Update functionality will be implemented in userService');
            // await userService.updateUser(teacherToEdit.id, formData);
            // await fetchTeachers();
            closeEditModal();
        } catch (error) {
            console.error('Error updating teacher:', error);
            alert('Error updating teacher. Please try again.');
        } finally {
            setIsUpdating(false);
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Teachers Management</h1>
                        <p className="text-sm sm:text-base text-slate-600">Track and manage teacher records from users collection</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-green-100 text-center sm:text-left">
                        <span className="text-slate-700 font-semibold text-sm sm:text-base">
                            Total Teachers: {teachers.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 sm:mb-8">
                <div className="relative max-w-full sm:max-w-lg">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Teachers Table */}
            {filteredTeachers.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No teachers found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No teachers available in the system'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Teacher
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredTeachers.map((teacher, index) => (
                                    <tr key={teacher.id} className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
                                                    {teacher.base64image ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={`data:image/jpeg;base64,${teacher.base64image}`}
                                                            alt={teacher.full_name}
                                                            className="w-full h-full object-cover rounded-xl"
                                                            onError={(e) => {
                                                                // Fallback to initials if image fails to load
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = getInitials(teacher.full_name);
                                                                    parent.className = 'w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm';
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                                            {getInitials(teacher.full_name)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{teacher.full_name}</div>
                                                    <div className="text-xs text-slate-500">Teacher #{teachers.indexOf(teacher) + 1}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <Mail className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700">{teacher.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <BookOpen className="w-4 h-4 text-green-500" />
                                                <span className="text-sm font-medium text-slate-700">{teacher.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => handleViewTeacher(teacher)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="View Teacher"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditTeacher(teacher)}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Edit Teacher"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeacher(teacher)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Delete Teacher"
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

            {/* View Teacher Modal */}
            {showViewModal && teacherToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Teacher Details</h2>
                                <button
                                    onClick={closeViewModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Teacher Info */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
                                        {teacherToView.base64image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={`data:image/jpeg;base64,${teacherToView.base64image}`}
                                                alt={teacherToView.full_name}
                                                className="w-full h-full object-cover rounded-xl"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = getInitials(teacherToView.full_name);
                                                        parent.className = 'w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm';
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                                {getInitials(teacherToView.full_name)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{teacherToView.full_name}</h3>
                                        <p className="text-slate-500 text-sm">{teacherToView.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Mail className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-medium text-slate-600">Email</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{teacherToView.email}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-medium text-slate-600">Department</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{teacherToView.department}</p>
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
                                        handleEditTeacher(teacherToView);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
                                >
                                    Edit Teacher
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Teacher</h2>
                                    <p className="text-emerald-100 text-sm">Update teacher information</p>
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
                            <form onSubmit={handleUpdateTeacher} className="space-y-4">
                                {/* Full Name */}
                                <div className="group">
                                    <label htmlFor="edit_full_name" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <Users className="w-3 h-3 text-blue-500" />
                                        <span>Full Name</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="edit_full_name"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                            placeholder="Enter teacher's full name"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="group">
                                    <label htmlFor="edit_email" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <Mail className="w-3 h-3 text-emerald-500" />
                                        <span>Email</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="edit_email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm"
                                            placeholder="Enter teacher's email"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Department */}
                                <div className="group">
                                    <label htmlFor="edit_department" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <BookOpen className="w-3 h-3 text-purple-500" />
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
                                            <option value="General">General</option>
                                        </select>
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
                                                <span>Update Teacher</span>
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
                title="Delete Teacher"
                message="Are you sure you want to delete this teacher? This action cannot be undone and will permanently remove the teacher from the system."
                itemName={teacherToDelete ? `${teacherToDelete.full_name} (${teacherToDelete.email})` : undefined}
                isLoading={isDeleting}
                confirmText="Delete Teacher"
                cancelText="Cancel"
            />
        </div>
    );
}
