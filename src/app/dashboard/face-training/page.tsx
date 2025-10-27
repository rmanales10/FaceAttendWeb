'use client';

import React, { useState, useEffect } from 'react';
import { studentService, Student } from '@/lib/firestore';
import {
    Search,
    Camera,
    CheckCircle,
    Clock,
    GraduationCap,
    Users,
    BookOpen
} from 'lucide-react';

export default function FaceTrainingPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchQuery]);

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

    const filterStudents = () => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
            return;
        }

        const filtered = students.filter(student =>
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.year_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.block.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const handleTrainStudent = (student: Student) => {
        // Simulate face training process
        alert(`Starting face training for ${student.full_name}. This would open the camera for face capture.`);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTrainingStats = () => {
        const total = students.length;
        const trained = students.filter(s => s.face_trained).length;
        const untrained = total - trained;
        return { total, trained, untrained };
    };

    const stats = getTrainingStats();

    if (loading) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-2xl w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-slate-200 rounded-xl w-1/3 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded-xl w-1/2"></div>
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
        <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Student Face Training</h1>
                        <p className="text-slate-600">Train and manage student face recognition data</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-3 rounded-2xl border border-purple-100">
                        <span className="text-slate-700 font-semibold">
                            Total Students: {students.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div className="p-4 rounded-2xl bg-blue-50">
                            <Users className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-slate-600 font-medium">Total</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div className="p-4 rounded-2xl bg-green-50">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-green-600">{stats.trained}</div>
                            <div className="text-sm text-slate-600 font-medium">Trained</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div className="p-4 rounded-2xl bg-orange-50">
                            <Clock className="w-7 h-7 text-orange-600" />
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-orange-600">{stats.untrained}</div>
                            <div className="text-sm text-slate-600 font-medium">Pending</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-8">
                <div className="relative max-w-lg">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search students by name, year, department, or block..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-slate-800 placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Table View */}
            {filteredStudents.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Students Found</h3>
                    <p className="text-slate-500">Try adjusting your search query</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <tr>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Student Info
                                    </th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Year Level
                                    </th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Block
                                    </th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student, index) => {
                                    const isTrained = student.face_trained || false;
                                    const getInitials = (name: string) => {
                                        const names = name.split(' ');
                                        return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                    };

                                    return (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-slate-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {getInitials(student.full_name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{student.full_name}</p>
                                                        <p className="text-sm text-slate-500">Student #{index + 1}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center space-x-2">
                                                    <GraduationCap className="w-4 h-4 text-blue-500" />
                                                    <span className="text-slate-700 font-medium">{student.year_level}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center space-x-2">
                                                    <BookOpen className="w-4 h-4 text-green-500" />
                                                    <span className="text-slate-700 font-medium">{student.department}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-slate-700 font-medium">{student.block}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${isTrained
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                                                    }`}>
                                                    {isTrained ? (
                                                        <>
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                            Trained
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                            Pending
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleTrainStudent(student)}
                                                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm space-x-2"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    <span>Train Face</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
