'use client';

import React, { useState, useEffect } from 'react';
import { studentService, Student } from '@/lib/firestore';
import {
    Search,
    Camera,
    Eye,
    CheckCircle,
    Clock,
    GraduationCap,
    Users,
    Grid3X3,
    List,
    MoreHorizontal
} from 'lucide-react';

type ViewMode = 'list' | 'grid' | 'compact';

export default function FaceTrainingPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
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
            student.section.toLowerCase().includes(searchQuery.toLowerCase())
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

            {/* Search and View Controls */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search students by name, year, department, or section..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-slate-800 placeholder-slate-400"
                    />
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 rounded-2xl p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'hover:bg-slate-200 text-slate-600'
                            }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'hover:bg-slate-200 text-slate-600'
                            }`}
                    >
                        <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'compact' ? 'bg-white shadow-sm text-purple-600' : 'hover:bg-slate-200 text-slate-600'
                            }`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No students found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No students available for training'}
                    </p>
                </div>
            ) : (
                <div className={
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                }>
                    {filteredStudents.map((student) => {
                        const isTrained = student.face_trained || false;
                        const accuracy = student.accuracy || 0;

                        return (
                            <div
                                key={student.id}
                                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group"
                            >
                                {viewMode === 'list' && (
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {getInitials(student.full_name)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">{student.full_name}</h3>
                                            <p className="text-slate-500 text-sm">Student #{students.indexOf(student) + 1}</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className={`px-4 py-2 rounded-2xl text-sm font-semibold ${isTrained
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                                                }`}>
                                                {isTrained ? 'Trained' : 'Pending'}
                                            </div>
                                            <button
                                                onClick={() => handleTrainStudent(student)}
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                            >
                                                <Camera className="w-5 h-5" />
                                                <span className="font-medium">{isTrained ? 'Retrain' : 'Train'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'grid' && (
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                                            {getInitials(student.full_name)}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">{student.full_name}</h3>
                                        <p className="text-slate-500 text-sm mb-6">Student #{students.indexOf(student) + 1}</p>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-center space-x-3 text-sm text-slate-600 bg-slate-50 rounded-xl py-2 px-4">
                                                <GraduationCap className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{student.year_level}</span>
                                            </div>
                                            <div className="flex items-center justify-center space-x-3 text-sm text-slate-600 bg-slate-50 rounded-xl py-2 px-4">
                                                <Users className="w-4 h-4 text-green-500" />
                                                <span className="font-medium">{student.department}</span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl text-sm font-semibold mb-6 ${isTrained
                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                                            }`}>
                                            {isTrained ? `Trained (${accuracy}%)` : 'Pending'}
                                        </div>
                                        <button
                                            onClick={() => handleTrainStudent(student)}
                                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                        >
                                            <Camera className="w-5 h-5" />
                                            <span className="font-medium">{isTrained ? 'Retrain' : 'Train'}</span>
                                        </button>
                                    </div>
                                )}

                                {viewMode === 'compact' && (
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                            {getInitials(student.full_name)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">{student.full_name}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                                                <span className="bg-slate-100 px-2 py-1 rounded-lg">{student.year_level}</span>
                                                <span className="bg-slate-100 px-2 py-1 rounded-lg">{student.department}</span>
                                                <span className="bg-slate-100 px-2 py-1 rounded-lg">{student.section}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className={`px-3 py-1 rounded-xl text-xs font-semibold ${isTrained
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                                                }`}>
                                                {isTrained ? 'Trained' : 'Pending'}
                                            </div>
                                            <button
                                                onClick={() => handleTrainStudent(student)}
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                            >
                                                <Camera className="w-4 h-4" />
                                                <span className="text-sm font-medium">{isTrained ? 'Retrain' : 'Train'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'list' && (
                                    <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center space-x-3 bg-slate-50 rounded-xl py-3 px-4">
                                            <GraduationCap className="w-4 h-4 text-blue-500" />
                                            <span className="text-slate-600 font-medium">{student.year_level}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 bg-slate-50 rounded-xl py-3 px-4">
                                            <Users className="w-4 h-4 text-green-500" />
                                            <span className="text-slate-600 font-medium">{student.department}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 bg-slate-50 rounded-xl py-3 px-4">
                                            <Users className="w-4 h-4 text-orange-500" />
                                            <span className="text-slate-600 font-medium">{student.section}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
