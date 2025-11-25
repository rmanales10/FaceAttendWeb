'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { studentService, Student, userService, User } from '@/lib/firestore';
import * as faceapi from 'face-api.js';
import {
    Search,
    Camera,
    CheckCircle,
    Clock,
    GraduationCap,
    Users,
    BookOpen,
    Upload,
    X,
    Loader2,
    Video,
    ImagePlus,
    UserCircle,
    QrCode,
    Copy
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { QRCodeSVG } from 'qrcode.react';

type PersonType = 'student' | 'teacher';
type Person = (Student | User) & { type: PersonType };

export default function FaceTrainingPage() {
    const { toasts, removeToast, success, error: showError, warning } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<PersonType>('student');
    const [loading, setLoading] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [showTrainingModal, setShowTrainingModal] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [trainingImages, setTrainingImages] = useState<string[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCapturingContinuously, setIsCapturingContinuously] = useState(false);
    const [captureInterval, setCaptureInterval] = useState<NodeJS.Timeout | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' = front, 'environment' = rear
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrPerson, setQrPerson] = useState<Person | null>(null);
    const [qrCodeSize, setQrCodeSize] = useState(200);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadModels();
        fetchData();
    }, []);

    useEffect(() => {
        const updateQrCodeSize = () => {
            setQrCodeSize(window.innerWidth < 640 ? 160 : 200);
        };

        updateQrCodeSize();
        window.addEventListener('resize', updateQrCodeSize);
        return () => window.removeEventListener('resize', updateQrCodeSize);
    }, []);

    useEffect(() => {
        filterPersons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, teachers, searchQuery, activeFilter]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
            console.log('Face-api.js models loaded successfully');
        } catch (error) {
            console.error('Error loading models:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [studentsData, usersData] = await Promise.all([
                studentService.getAllStudents(),
                userService.getAllUsers()
            ]);
            setStudents(studentsData);
            // Filter only users with role 'teacher' if role field exists
            const teachersData = usersData.filter(user =>
                user.role === 'teacher' || !user.role // Include users without role for backwards compatibility
            );
            setTeachers(teachersData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPersons = useCallback(() => {
        const allPersons: Person[] = activeFilter === 'student'
            ? students.map(s => ({ ...s, type: 'student' as PersonType }))
            : teachers.map(t => ({ ...t, type: 'teacher' as PersonType }));

        if (!searchQuery.trim()) {
            setFilteredPersons(allPersons);
            return;
        }

        const filtered = allPersons.filter(person => {
            const query = searchQuery.toLowerCase();

            if (person.type === 'student') {
                const student = person as Student;
                const name = student.full_name?.toLowerCase() || '';
                const department = student.department?.toLowerCase() || '';
                return (
                    name.includes(query) ||
                    student.year_level?.toLowerCase().includes(query) ||
                    department.includes(query) ||
                    student.block?.toLowerCase().includes(query)
                );
            } else {
                const teacher = person as User;
                const name = teacher.fullname?.toLowerCase() || '';
                const department = teacher.department?.toLowerCase() || '';
                const email = teacher.email?.toLowerCase() || '';
                return (
                    name.includes(query) ||
                    department.includes(query) ||
                    email.includes(query)
                );
            }
        });
        setFilteredPersons(filtered);
    }, [students, teachers, searchQuery, activeFilter]);

    const handleTrainPerson = (person: Person) => {
        if (!modelsLoaded) {
            warning('Face recognition models are still loading. Please wait...');
            return;
        }
        setSelectedPerson(person);
        setShowTrainingModal(true);
    };

    const getCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            setAvailableCameras(cameras);
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    };

    const startCamera = async () => {
        try {
            // Stop any existing stream
            stopCamera();

            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: facingMode
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCapturing(true);
            }

            // Get available cameras after stream is active
            await getCameras();
        } catch (err) {
            console.error('Error accessing camera:', err);
            showError('Could not access camera. Please check permissions.');
        }
    };

    const switchCamera = async () => {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);

        if (isCapturing) {
            // Restart camera with new facing mode
            stopCamera();
            setTimeout(async () => {
                try {
                    const constraints = {
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: newFacingMode
                        }
                    };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setIsCapturing(true);
                    }
                } catch (err) {
                    console.error('Error switching camera:', err);
                    showError('Could not switch camera.');
                }
            }, 100);
        }
    };

    const stopCamera = () => {
        stopContinuousCapture();
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCapturing(false);
        }
    };

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Save context state
        ctx.save();

        // Mirror the image if using front camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);

        // Restore context state
        ctx.restore();

        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        try {
            // Detect face in captured image
            const img = await faceapi.fetchImage(imageData);
            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                if (!isCapturingContinuously) {
                    warning('No face detected. Please position your face clearly in the camera.');
                }
                return;
            }

            setTrainingImages(prev => [...prev, imageData]);
        } catch (err) {
            console.error('Error detecting face:', err);
            if (!isCapturingContinuously) {
                showError('Error detecting face. Please try again.');
            }
        }
    };

    const toggleContinuousCapture = () => {
        if (!modelsLoaded) return;

        if (isCapturingContinuously) {
            // Stop capturing
            setIsCapturingContinuously(false);
            if (captureInterval) {
                clearInterval(captureInterval);
                setCaptureInterval(null);
            }
        } else {
            // Start capturing
            setIsCapturingContinuously(true);
            // Capture immediately
            captureImage();
            // Then capture every 100ms
            const interval = setInterval(() => {
                captureImage();
            }, 100);
            setCaptureInterval(interval);
        }
    };

    const stopContinuousCapture = () => {
        setIsCapturingContinuously(false);
        if (captureInterval) {
            clearInterval(captureInterval);
            setCaptureInterval(null);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const imageData = event.target?.result as string;

                try {
                    // Detect face in uploaded image
                    const img = await faceapi.fetchImage(imageData);
                    const detection = await faceapi
                        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (detection) {
                        setTrainingImages(prev => [...prev, imageData]);
                    } else {
                        warning(`No face detected in ${file.name}. Please upload a clear face image.`);
                    }
                } catch (error) {
                    console.error('Error processing image:', error);
                }

                if (i === files.length - 1) {
                    setIsProcessing(false);
                }
            };

            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        setTrainingImages(prev => prev.filter((_, i) => i !== index));
    };

    const saveFaceTraining = async () => {
        if (trainingImages.length < 5) {
            warning('Please capture or upload at least 5 images for better accuracy.');
            return;
        }

        if (!selectedPerson) return;

        setIsProcessing(true);
        try {
            // Extract face descriptors from all images
            const descriptors: Float32Array[] = [];

            for (const imageData of trainingImages) {
                const img = await faceapi.fetchImage(imageData);
                const detection = await faceapi
                    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    descriptors.push(detection.descriptor);
                }
            }

            if (descriptors.length === 0) {
                showError('Failed to extract face descriptors. Please try again with clearer images.');
                setIsProcessing(false);
                return;
            }

            // Average the descriptors for better recognition
            const avgDescriptor = new Float32Array(128);
            for (let i = 0; i < 128; i++) {
                let sum = 0;
                descriptors.forEach(desc => sum += desc[i]);
                avgDescriptor[i] = sum / descriptors.length;
            }

            // Save to Firestore based on person type
            const updateData = {
                face_descriptors: Array.from(avgDescriptor),
                face_trained: true,
                training_date: new Date().toISOString(),
                training_images_count: trainingImages.length
            };

            if (selectedPerson.type === 'student') {
                await studentService.updateStudent(selectedPerson.id!, updateData);
            } else {
                await userService.updateUser(selectedPerson.id!, updateData);
            }

            const personName = selectedPerson.type === 'student'
                ? (selectedPerson as Student).full_name
                : (selectedPerson as User).fullname;
            success(`Face training completed successfully for ${personName}!\n${trainingImages.length} images processed.`);
            closeTrainingModal();
            fetchData();
        } catch (err) {
            console.error('Error saving face training:', err);
            showError('Failed to save face training. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const closeTrainingModal = () => {
        stopContinuousCapture();
        stopCamera();
        setShowTrainingModal(false);
        setSelectedPerson(null);
        setTrainingImages([]);
        setIsCapturing(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const showQRCode = (person: Person) => {
        setQrPerson(person);
        setShowQRModal(true);
    };

    const closeQRModal = () => {
        setShowQRModal(false);
        setQrPerson(null);
    };

    const copyTrainingLink = async () => {
        if (!qrPerson) return;
        const link = `${window.location.origin}/face-training-public?id=${qrPerson.id}&type=${qrPerson.type}`;
        try {
            await navigator.clipboard.writeText(link);
            success('Training link copied to clipboard!');
        } catch {
            showError('Failed to copy link. Please copy manually.');
        }
    };

    const getTrainingStats = () => {
        const activeData = activeFilter === 'student' ? students : teachers;
        const total = activeData.length;
        const trained = activeData.filter(p => p.face_trained === true).length;
        const untrained = total - trained;
        return { total, trained, untrained };
    };

    const stats = getTrainingStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">Face Training</h1>
                        <p className="text-slate-500 text-sm sm:text-base lg:text-lg mt-1">
                            Train and manage {activeFilter === 'student' ? 'student' : 'teacher'} face recognition data
                        </p>
                    </div>
                </div>
                {!modelsLoaded && (
                    <div className="mt-4 bg-orange-100 border border-orange-200 rounded-2xl p-3 sm:p-4 flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 text-orange-600 animate-spin flex-shrink-0" />
                        <span className="text-orange-800 font-medium text-sm sm:text-base">Loading face recognition models...</span>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 sm:mb-8">
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 inline-flex space-x-2">
                    <button
                        onClick={() => setActiveFilter('student')}
                        className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${activeFilter === 'student'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Students</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeFilter === 'student' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {students.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveFilter('teacher')}
                        className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${activeFilter === 'teacher'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Teachers</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeFilter === 'teacher' ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-700'
                            }`}>
                            {teachers.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Total</p>
                            <p className="text-3xl sm:text-4xl font-bold text-slate-800">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Trained</p>
                            <p className="text-3xl sm:text-4xl font-bold text-green-600">{stats.trained}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Pending</p>
                            <p className="text-3xl sm:text-4xl font-bold text-orange-600">{stats.untrained}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 sm:mb-8">
                <div className="relative w-full sm:max-w-lg">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        type="text"
                        placeholder={`Search ${activeFilter === 'student' ? 'students' : 'teachers'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Table View */}
            {filteredPersons.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                        No {activeFilter === 'student' ? 'Students' : 'Teachers'} Found
                    </h3>
                    <p className="text-sm sm:text-base text-slate-500">Try adjusting your search query</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <tr>
                                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        {activeFilter === 'student' ? 'Student' : 'Teacher'} Info
                                    </th>
                                    {activeFilter === 'student' && (
                                        <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                                            Year Level
                                        </th>
                                    )}
                                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                                        Department
                                    </th>
                                    {activeFilter === 'student' && (
                                        <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                                            Block
                                        </th>
                                    )}
                                    {activeFilter === 'teacher' && (
                                        <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                                            Email
                                        </th>
                                    )}
                                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPersons.map((person, index) => {
                                    const isStudent = person.type === 'student';
                                    const student = isStudent ? (person as Student) : null;
                                    const teacher = !isStudent ? (person as User) : null;
                                    const personName = isStudent
                                        ? (person as Student).full_name
                                        : (person as User).fullname;
                                    const isTrained = (isStudent ? student?.face_trained : teacher?.face_trained) || false;

                                    return (
                                        <tr
                                            key={person.id}
                                            className="hover:bg-slate-50 transition-colors duration-150"
                                        >
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                                                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${isStudent
                                                        ? 'from-blue-500 to-blue-600'
                                                        : 'from-purple-500 to-purple-600'
                                                        } rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                                                        {getInitials(personName || '')}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{personName}</p>
                                                        <p className="text-xs sm:text-sm text-slate-500">
                                                            {isStudent && student && (
                                                                <span className="md:hidden">{student.year_level} • {student.department}</span>
                                                            )}
                                                            {!isStudent && teacher && (
                                                                <span className="md:hidden">{teacher.department || 'N/A'}</span>
                                                            )}
                                                            <span className="hidden md:inline">#{index + 1}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {isStudent && student && (
                                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 hidden md:table-cell">
                                                    <div className="flex items-center space-x-2">
                                                        <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                        <span className="text-slate-700 font-medium text-sm">{student.year_level}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 hidden lg:table-cell">
                                                <div className="flex items-center space-x-2">
                                                    <BookOpen className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    <span className="text-slate-700 font-medium text-sm">{person.department}</span>
                                                </div>
                                            </td>
                                            {isStudent && student && (
                                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 hidden lg:table-cell">
                                                    <span className="text-slate-700 font-medium text-sm">{student.block}</span>
                                                </td>
                                            )}
                                            {!isStudent && teacher && (
                                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 hidden lg:table-cell">
                                                    <span className="text-slate-700 font-medium text-sm">{teacher.email || 'N/A'}</span>
                                                </td>
                                            )}
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                                                <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold ${isTrained
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                                                    }`}>
                                                    {isTrained ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                                            <span className="hidden sm:inline">Trained</span>
                                                            <span className="sm:hidden">✓</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                                            <span className="hidden sm:inline">Pending</span>
                                                            <span className="sm:hidden">⏳</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleTrainPerson(person)}
                                                        disabled={!modelsLoaded}
                                                        className={`inline-flex items-center px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs sm:text-sm space-x-1 sm:space-x-2 ${modelsLoaded
                                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="hidden sm:inline">{isTrained ? 'Retrain' : 'Train'}</span>
                                                        <span className="sm:hidden">Train</span>
                                                    </button>
                                                    <button
                                                        onClick={() => showQRCode(person)}
                                                        className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs sm:text-sm space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                                                        title="Show QR Code for self-training"
                                                    >
                                                        <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="hidden lg:inline">QR</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Training Modal */}
            {showTrainingModal && selectedPerson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className={`sticky top-0 bg-gradient-to-r ${selectedPerson.type === 'student'
                            ? 'from-blue-500 to-blue-600'
                            : 'from-purple-500 to-purple-600'
                            } p-6 rounded-t-3xl flex items-center justify-between`}>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                    {selectedPerson.type === 'student' ? (
                                        <GraduationCap className="w-6 h-6 text-white" />
                                    ) : (
                                        <UserCircle className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Train Face Recognition</h2>
                                    <p className={`${selectedPerson.type === 'student' ? 'text-blue-100' : 'text-purple-100'
                                        }`}>
                                        {selectedPerson.type === 'student'
                                            ? (selectedPerson as Student).full_name
                                            : (selectedPerson as User).fullname
                                        } • {selectedPerson.type === 'student' ? 'Student' : 'Teacher'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeTrainingModal}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-2 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Camera/Upload Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Camera Feed */}
                                <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                                        <Video className="w-5 h-5 mr-2 text-purple-500" />
                                        Camera Capture
                                    </h3>
                                    <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video mb-3">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                        />
                                        {!isCapturing && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                                <div className="text-center text-slate-400">
                                                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p className="font-medium">Camera is off</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="space-y-2">
                                        <div className="flex space-x-2">
                                            {!isCapturing ? (
                                                <button
                                                    onClick={startCamera}
                                                    className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold text-sm flex items-center justify-center space-x-2"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    <span>Start Camera</span>
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={toggleContinuousCapture}
                                                        disabled={isProcessing || !modelsLoaded}
                                                        className={`flex-1 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm flex items-center justify-center space-x-2 ${isCapturingContinuously
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : 'bg-purple-500 text-white hover:bg-purple-600'
                                                            } ${isProcessing || !modelsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                        <span>{isCapturingContinuously ? 'Stop Training' : 'Start Training'}</span>
                                                    </button>
                                                    <button
                                                        onClick={stopCamera}
                                                        className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold text-sm"
                                                    >
                                                        Stop
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {availableCameras.length > 1 && (
                                            <button
                                                onClick={switchCamera}
                                                className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold text-sm flex items-center justify-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Switch to {facingMode === 'user' ? 'Rear' : 'Front'} Camera</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Section */}
                                <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                                        <ImagePlus className="w-5 h-5 mr-2 text-purple-500" />
                                        Upload Images
                                    </h3>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all aspect-video flex items-center justify-center"
                                    >
                                        <div>
                                            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                            <p className="font-semibold text-slate-700">Click to upload images</p>
                                            <p className="text-sm text-slate-500 mt-1">JPG, PNG up to 10MB</p>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Captured Images Grid */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-800">
                                        Captured Images ({trainingImages.length})
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {trainingImages.length < 5 ? (
                                            <span className="text-orange-600 font-medium">
                                                Capture at least 5 images (Need {5 - trainingImages.length} more)
                                            </span>
                                        ) : (
                                            <span className="text-green-600 font-medium">
                                                ✓ Ready to train
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {trainingImages.length === 0 ? (
                                    <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-slate-200">
                                        <Camera className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500">No images captured yet</p>
                                        <p className="text-sm text-slate-400 mt-1">Use camera or upload images to begin</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                        {trainingImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={image}
                                                    alt={`Training ${index + 1}`}
                                                    className="w-full aspect-square object-cover rounded-xl border-2 border-slate-200"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={closeTrainingModal}
                                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveFaceTraining}
                                    disabled={trainingImages.length < 5 || isProcessing}
                                    className={`flex-1 px-6 py-3 rounded-xl transition-all font-semibold flex items-center justify-center space-x-2 ${trainingImages.length >= 5 && !isProcessing
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Save Training Data</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && qrPerson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={closeQRModal}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 my-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Self-Training QR Code</h2>
                            <button
                                onClick={closeQRModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Person Info - Compact */}
                        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl">
                            <div className="flex items-center space-x-2 sm:space-x-2.5">
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r ${qrPerson.type === 'student'
                                    ? 'from-blue-500 to-blue-600'
                                    : 'from-purple-500 to-purple-600'
                                    } rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                                    {getInitials(qrPerson.type === 'student'
                                        ? (qrPerson as Student).full_name
                                        : (qrPerson as User).fullname)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                                        {qrPerson.type === 'student'
                                            ? (qrPerson as Student).full_name
                                            : (qrPerson as User).fullname}
                                    </p>
                                    <p className="text-xs text-slate-600 capitalize">{qrPerson.type}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code and Link - Side by Side on larger screens */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                            {/* QR Code */}
                            <div className="flex justify-center items-center p-2 sm:p-3 bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl min-h-[180px] sm:min-h-[220px] md:min-h-[220px]">
                                <QRCodeSVG
                                    value={`${window.location.origin}/face-training-public?id=${qrPerson.id}&type=${qrPerson.type}`}
                                    size={qrCodeSize}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            {/* Training Link and Instructions - Stacked */}
                            <div className="flex flex-col justify-between space-y-2.5 sm:space-y-3 min-h-[180px] sm:min-h-[220px] md:min-h-[220px]">
                                {/* Training Link */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 sm:mb-1.5">
                                        Training Link:
                                    </label>
                                    <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1.5 sm:p-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/face-training-public?id=${qrPerson.id}&type=${qrPerson.type}`}
                                            className="flex-1 bg-transparent text-[10px] sm:text-xs text-slate-700 outline-none truncate"
                                        />
                                        <button
                                            onClick={copyTrainingLink}
                                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1 flex-shrink-0"
                                            title="Copy link"
                                        >
                                            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            <span className="text-[10px] sm:text-xs font-semibold">Copy</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Instructions - Compact */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5 flex-1 flex flex-col justify-center">
                                    <p className="text-[10px] sm:text-xs text-blue-800 font-semibold mb-1 sm:mb-1.5">📱 How to use:</p>
                                    <ol className="text-[10px] sm:text-xs text-blue-700 space-y-0.5 list-decimal list-inside leading-relaxed">
                                        <li>Open camera app on your phone</li>
                                        <li>Point at the QR code</li>
                                        <li>Tap the notification to open</li>
                                        <li>Complete face training</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closeQRModal}
                            className="w-full px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold text-xs sm:text-sm shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
