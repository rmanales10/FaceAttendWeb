'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    classScheduleService,
    ClassSchedule,
    studentService,
    Student,
    classAttendanceService,
    ClassAttendance,
    AttendanceRecord as FirestoreAttendanceRecord
} from '@/lib/firestore';
import * as faceapi from 'face-api.js';
import {
    ScanFace,
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle,
    XCircle,
    Play,
    Square,
    Camera,
    Loader2,
    Save
} from 'lucide-react';

interface AttendanceRecord {
    student_id: string;
    student_name: string;
    status: 'present' | 'absent' | 'late';
    timestamp: Date;
    confidence?: number;
}

export default function FaceRecognitionPage() {
    const searchParams = useSearchParams();
    const attendanceIdFromUrl = searchParams.get('attendanceId');
    const autoStart = searchParams.get('autostart') === 'true'; // Optional: auto-start scanning

    const [attendanceId, setAttendanceId] = useState<string | null>(null);
    const [attendanceData, setAttendanceData] = useState<ClassAttendance | null>(null);
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [streamActive, setStreamActive] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' = front, 'environment' = rear
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [isLandscape, setIsLandscape] = useState(false);
    const [fromUrl, setFromUrl] = useState(false); // Track if attendance is from URL
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const detectionInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const init = async () => {
            await loadModels();
            await fetchSchedules();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps

        // Check initial orientation
        const checkOrientation = () => {
            if (typeof window !== 'undefined') {
                const landscape = window.innerWidth > window.innerHeight;
                setIsLandscape(landscape);
            }
        };

        checkOrientation();

        // Listen for orientation changes
        const handleOrientationChange = () => {
            checkOrientation();
        };

        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            if (detectionInterval.current) {
                clearInterval(detectionInterval.current);
            }
            stopCamera();
            window.removeEventListener('resize', handleOrientationChange);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    useEffect(() => {
        if (selectedSchedule) {
            fetchStudentsForSchedule();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchedule]);

    // Auto-start scanning if autostart parameter is true and schedule is loaded
    useEffect(() => {
        if (autoStart && selectedSchedule && modelsLoaded && !isScanning && students.length > 0) {
            // Small delay to ensure everything is ready
            const timer = setTimeout(() => {
                handleStartScanning();
            }, 1000);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart, selectedSchedule, modelsLoaded, isScanning, students.length]);

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
            alert('Failed to load face recognition models. Please ensure models are in /public/models folder.');
        }
    };

    const fetchSchedules = async () => {
        try {
            const data = await classScheduleService.getClassSchedules();
            setSchedules(data);

            // Load attendance data if attendanceId is provided in URL
            if (attendanceIdFromUrl) {
                const attendance = await classAttendanceService.getClassAttendanceById(attendanceIdFromUrl);
                if (attendance) {
                    setAttendanceId(attendanceIdFromUrl);
                    setAttendanceData(attendance);
                    setFromUrl(true);

                    // Create a mock schedule object from attendance data
                    const scheduleFromAttendance: ClassSchedule = {
                        id: attendanceIdFromUrl,
                        teacher_id: attendance.class_schedule.teacher_id,
                        teacher_name: attendance.class_schedule.teacher_name,
                        subject_id: attendance.class_schedule.subject_id,
                        subject_name: attendance.class_schedule.subject_name,
                        course_code: attendance.class_schedule.course_code,
                        department: attendance.class_schedule.department,
                        year_level: attendance.class_schedule.year_level,
                        course_year: attendance.class_schedule.course_year,
                        schedule: attendance.class_schedule.schedule,
                        building_room: attendance.class_schedule.building_room,
                    };

                    setSelectedSchedule(scheduleFromAttendance);
                    console.log('Auto-selected schedule from attendance:', scheduleFromAttendance.subject_name);
                } else {
                    console.warn('Attendance ID from URL not found:', attendanceIdFromUrl);
                }
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsForSchedule = useCallback(async () => {
        if (!selectedSchedule) return;

        try {
            const allStudents = await studentService.getAllStudents();
            // Filter students based on department and year level who have been trained
            const filteredStudents = allStudents.filter(
                student =>
                    student.department === selectedSchedule.department &&
                    student.year_level === selectedSchedule.year_level &&
                    student.face_trained &&
                    student.face_descriptors
            );
            setStudents(filteredStudents);

            // Create labeled face descriptors for recognition
            const labeled = filteredStudents.map(student => {
                const descriptors = new Float32Array(student.face_descriptors as number[]);
                return new faceapi.LabeledFaceDescriptors(
                    student.full_name,
                    [descriptors]
                );
            });
            setLabeledDescriptors(labeled);

            // Initialize attendance records
            const initialRecords: AttendanceRecord[] = filteredStudents.map(student => ({
                student_id: student.id || '',
                student_name: student.full_name,
                status: 'absent',
                timestamp: new Date()
            }));
            setAttendanceRecords(initialRecords);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [selectedSchedule]);

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
                setStreamActive(true);
            }

            // Get available cameras after stream is active
            await getCameras();
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please check permissions.');
        }
    };

    const switchCamera = async () => {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);

        // Stop current scanning
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
            detectionInterval.current = null;
        }

        stopCamera();

        // Restart camera with new facing mode
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
                    setStreamActive(true);

                    // Restart detection if was scanning
                    if (isScanning) {
                        setTimeout(() => {
                            detectionInterval.current = setInterval(() => {
                                detectFaces();
                            }, 100);
                        }, 1000);
                    }
                }
            } catch (error) {
                console.error('Error switching camera:', error);
                alert('Could not switch camera.');
            }
        }, 100);
    };

    const stopCamera = () => {
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
            detectionInterval.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setStreamActive(false);
        }

        // Clear canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };

    const detectFaces = async () => {
        if (!videoRef.current || !canvasRef.current || labeledDescriptors.length === 0) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match canvas dimensions to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Create face matcher with threshold
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        // Detect faces
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        // Clear canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (detections.length > 0) {
            // Resize detections to match display size
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Draw detections with bounding boxes and labels
            resizedDetections.forEach(detection => {
                const box = detection.detection.box;

                // Match face
                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

                // Draw bounding box
                if (ctx) {
                    const boxColor = bestMatch.label !== 'unknown' ? '#10b981' : '#f59e0b';
                    ctx.strokeStyle = boxColor;
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);

                    // Draw label background
                    ctx.fillStyle = boxColor;
                    ctx.fillRect(box.x, box.y - 30, box.width, 30);

                    // Draw label text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 16px Arial';
                    const label = bestMatch.label !== 'unknown'
                        ? `${bestMatch.label} (${(1 - bestMatch.distance).toFixed(2)})`
                        : 'Unknown';
                    ctx.fillText(label, box.x + 5, box.y - 10);
                }

                // Mark attendance if match found
                if (bestMatch.label !== 'unknown') {
                    const confidence = 1 - bestMatch.distance;
                    markAttendance(bestMatch.label, 'present', confidence);
                }
            });
        }
    };

    const handleStartScanning = useCallback(async () => {
        if (!selectedSchedule) {
            alert('Please select a class schedule first');
            return;
        }

        if (!modelsLoaded) {
            alert('Face recognition models are still loading. Please wait...');
            return;
        }

        if (labeledDescriptors.length === 0) {
            alert('No trained students found for this class. Please train students first.');
            return;
        }

        setIsScanning(true);
        await startCamera();

        // Wait for video to be ready
        setTimeout(() => {
            // Start detection loop
            detectionInterval.current = setInterval(() => {
                detectFaces();
            }, 100); // Detect every 100ms
        }, 1000);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchedule, modelsLoaded, labeledDescriptors.length]);

    const handleStopScanning = () => {
        setIsScanning(false);
        stopCamera();
    };

    const markAttendance = (studentName: string, status: 'present' | 'absent' | 'late', confidence?: number) => {
        setAttendanceRecords(prev =>
            prev.map(record =>
                record.student_name === studentName && record.status === 'absent'
                    ? { ...record, status, timestamp: new Date(), confidence }
                    : record
            )
        );
    };

    const saveAttendance = async () => {
        if (!selectedSchedule) {
            alert('Please select a class schedule first.');
            return;
        }

        if (attendanceRecords.length === 0) {
            alert('No attendance records to save. Please start scanning first.');
            return;
        }

        try {
            // Get current date in YYYY-MM-DD format
            const today = new Date();
            const attendanceDate = today.toISOString().split('T')[0];

            // Calculate statistics
            const stats = getAttendanceStats();

            // Convert attendance records to Firestore format with 'face' type
            const formattedRecords: FirestoreAttendanceRecord[] = attendanceRecords.map(record => ({
                student_id: record.student_id,
                student_name: record.student_name,
                status: record.status,
                timestamp: record.timestamp,
                attendance_type: 'face' as const, // Mark as face recognition attendance
                confidence: record.confidence
            }));

            // Check if we're updating an existing attendance record
            if (attendanceId && attendanceData) {
                // Update existing attendance record
                await classAttendanceService.updateClassAttendance(attendanceId, {
                    attendance_records: formattedRecords,
                    absent_count: stats.absent,
                    present_count: stats.present,
                    late_count: stats.late,
                    total_students: stats.total,
                });

                alert('Attendance updated successfully via face recognition!');
                console.log('Attendance updated for ID:', attendanceId);
                return;
            }

            // Otherwise, create a new attendance document
            // Prepare class attendance document
            const classAttendanceData: Omit<ClassAttendance, 'id'> = {
                class_schedule: {
                    building_room: selectedSchedule.building_room,
                    course_code: selectedSchedule.course_code,
                    course_year: selectedSchedule.course_year,
                    department: selectedSchedule.department,
                    schedule: selectedSchedule.schedule,
                    subject_id: selectedSchedule.subject_id || selectedSchedule.id || '',
                    subject_name: selectedSchedule.subject_name,
                    teacher_id: selectedSchedule.teacher_id,
                    teacher_name: selectedSchedule.teacher_name,
                    year_level: selectedSchedule.year_level
                },
                attendance_records: formattedRecords,
                absent_count: stats.absent,
                present_count: stats.present,
                late_count: stats.late,
                total_students: stats.total,
                attendance_date: attendanceDate,
                created_by: selectedSchedule.teacher_id // You can update this with actual logged-in user ID
            };

            // Save to Firestore
            const docId = await classAttendanceService.addClassAttendance(classAttendanceData);

            alert(
                `✅ Attendance saved successfully!\n\n` +
                `📅 Date: ${attendanceDate}\n` +
                `📚 Subject: ${selectedSchedule.subject_name}\n` +
                `✓ Present: ${stats.present}\n` +
                `✗ Absent: ${stats.absent}\n` +
                `⏰ Late: ${stats.late}\n` +
                `👥 Total: ${stats.total}\n` +
                `🤖 Type: Face Recognition\n` +
                `📄 Document ID: ${docId}`
            );

            console.log('Attendance saved to Firestore:', {
                documentId: docId,
                data: classAttendanceData
            });

            // Optionally, clear attendance records after saving
            // setAttendanceRecords([]);
            // handleStopScanning();

        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('❌ Failed to save attendance. Please try again.\n\nError: ' + (error as Error).message);
        }
    };

    const getAttendanceStats = () => {
        const present = attendanceRecords.filter(r => r.status === 'present').length;
        const absent = attendanceRecords.filter(r => r.status === 'absent').length;
        const late = attendanceRecords.filter(r => r.status === 'late').length;
        return { present, absent, late, total: attendanceRecords.length };
    };

    const stats = getAttendanceStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            {/* Header - Hide in landscape scanning mode on mobile */}
            {!(isLandscape && isScanning && window.innerWidth < 1024) && (
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <ScanFace className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-slate-800">Face Recognition</h1>
                            <p className="text-slate-500 text-xs sm:text-sm lg:text-lg mt-1">Automated attendance tracking</p>
                        </div>
                    </div>
                    {!modelsLoaded && (
                        <div className="bg-orange-100 border border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center space-x-3">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 animate-spin flex-shrink-0" />
                            <span className="text-orange-800 font-medium text-sm sm:text-base">Loading face recognition models...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Adaptive Layout based on orientation and scanning state */}
            <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${isLandscape && isScanning && window.innerWidth < 1024
                ? 'grid-cols-1 md:grid-cols-[1fr,320px]' // Landscape: camera left, attendance right
                : 'grid-cols-1 lg:grid-cols-3' // Portrait/Desktop: standard 3-column
                }`}>
                {/* Left Column - Schedule Selection & Camera */}
                <div className={`space-y-4 sm:space-y-6 ${isLandscape && isScanning && window.innerWidth < 1024
                    ? '' // Full width in landscape scanning
                    : 'lg:col-span-2' // 2/3 width in normal mode
                    }`}>
                    {/* Schedule Selection - Hide in landscape scanning mode */}
                    {!(isLandscape && isScanning && window.innerWidth < 1024) && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                                    Select Class Schedule
                                </h2>
                                {fromUrl && selectedSchedule && (
                                    <span className="text-xs sm:text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium flex items-center space-x-1">
                                        <span>🔗</span>
                                        <span>Auto-loaded</span>
                                    </span>
                                )}
                            </div>
                            {schedules.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No class schedules found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {schedules.map((schedule) => (
                                        <button
                                            key={schedule.id}
                                            onClick={() => setSelectedSchedule(schedule)}
                                            disabled={isScanning}
                                            className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${selectedSchedule?.id === schedule.id
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <h3 className="font-bold text-slate-800 mb-2">{schedule.subject_name}</h3>
                                            <div className="space-y-1 text-sm text-slate-600">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="w-4 h-4 text-indigo-500" />
                                                    <span>{schedule.teacher_name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-green-500" />
                                                    <span>{schedule.schedule}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-orange-500" />
                                                    <span className="text-xs">{schedule.building_room}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Camera Feed */}
                    <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 ${isLandscape && isScanning && window.innerWidth < 1024
                        ? 'h-[calc(100vh-8rem)]' // Full height in landscape
                        : ''
                        }`}>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <Camera className="w-5 h-5 mr-2 text-indigo-500" />
                                    Live Camera Feed
                                </h2>
                                <div className="flex space-x-2">
                                    {!isScanning ? (
                                        <button
                                            onClick={handleStartScanning}
                                            disabled={!selectedSchedule || !modelsLoaded}
                                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all duration-200 ${selectedSchedule && modelsLoaded
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Play className="w-4 h-4" />
                                            <span>Start</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStopScanning}
                                            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs sm:text-sm flex items-center space-x-2"
                                        >
                                            <Square className="w-4 h-4" />
                                            <span>Stop</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {availableCameras.length > 1 && streamActive && (
                                <button
                                    onClick={switchCamera}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold text-sm flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Switch to {facingMode === 'user' ? 'Rear' : 'Front'} Camera</span>
                                </button>
                            )}
                        </div>
                        <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full"
                                style={{ display: streamActive ? 'block' : 'none' }}
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full"
                            />
                            {!streamActive && (
                                <div className="aspect-video flex items-center justify-center">
                                    <div className="text-center text-slate-400">
                                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Camera is off</p>
                                        <p className="text-sm">Select a schedule and click &quot;Start Scanning&quot;</p>
                                    </div>
                                </div>
                            )}
                            {isScanning && streamActive && (
                                <div className="absolute top-4 right-4">
                                    <div className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        <span className="font-semibold text-sm">LIVE</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {selectedSchedule && (
                            <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-800">
                                <p className="font-semibold">📌 {selectedSchedule.subject_name}</p>
                                <p className="text-indigo-600">{students.length} trained student(s) in this class</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Attendance Records */}
                <div className={`space-y-4 sm:space-y-6 ${isLandscape && isScanning && window.innerWidth < 1024
                    ? 'h-[calc(100vh-8rem)] overflow-y-auto' // Fixed height with scroll in landscape
                    : ''
                    }`}>
                    {/* Statistics - Compact in landscape */}
                    <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'sticky top-0 z-10' : ''
                        }`}>
                        <h2 className={`font-bold text-slate-800 mb-3 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-base' : 'text-lg sm:text-xl'
                            }`}>Statistics</h2>
                        <div className={`space-y-2 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'grid grid-cols-2 gap-2' : 'space-y-3'
                            }`}>
                            <div className={`flex items-center justify-between rounded-xl border ${isLandscape && isScanning && window.innerWidth < 1024 ? 'p-2 bg-green-50 border-green-200' : 'p-3 bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className={`text-green-600 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'w-4 h-4' : 'w-5 h-5'
                                        }`} />
                                    <span className={`font-semibold text-slate-700 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-xs' : 'text-sm'
                                        }`}>Present</span>
                                </div>
                                <span className={`font-bold text-green-600 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-lg' : 'text-2xl'
                                    }`}>{stats.present}</span>
                            </div>
                            <div className={`flex items-center justify-between rounded-xl border ${isLandscape && isScanning && window.innerWidth < 1024 ? 'p-2 bg-red-50 border-red-200' : 'p-3 bg-red-50 border-red-200'
                                }`}>
                                <div className="flex items-center space-x-2">
                                    <XCircle className={`text-red-600 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'w-4 h-4' : 'w-5 h-5'
                                        }`} />
                                    <span className={`font-semibold text-slate-700 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-xs' : 'text-sm'
                                        }`}>Absent</span>
                                </div>
                                <span className={`font-bold text-red-600 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-lg' : 'text-2xl'
                                    }`}>{stats.absent}</span>
                            </div>
                            <div className={`flex items-center justify-between rounded-xl border ${isLandscape && isScanning && window.innerWidth < 1024 ? 'p-2 bg-orange-50 border-orange-200 col-span-2' : 'p-3 bg-orange-50 border-orange-200'
                                }`}>
                                <div className="flex items-center space-x-2">
                                    <Users className={`text-slate-600 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'w-4 h-4' : 'w-5 h-5'
                                        }`} />
                                    <span className={`font-semibold text-slate-700 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-xs' : 'text-sm'
                                        }`}>Total: {stats.total}</span>
                                </div>
                                <span className={`font-bold text-slate-800 ${isLandscape && isScanning && window.innerWidth < 1024 ? 'text-lg' : 'text-2xl'
                                    }`}>👥 {stats.total}</span>
                            </div>
                        </div>
                        {selectedSchedule && stats.present > 0 && (
                            <button
                                onClick={saveAttendance}
                                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold flex items-center justify-center space-x-2"
                            >
                                <Save className="w-5 h-5" />
                                <span>Save Attendance</span>
                            </button>
                        )}
                    </div>

                    {/* Attendance List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Attendance Records</h2>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {attendanceRecords.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No students found</p>
                                    <p className="text-sm">Select a class schedule</p>
                                </div>
                            ) : (
                                attendanceRecords.map((record) => (
                                    <div
                                        key={record.student_id}
                                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${record.status === 'present'
                                            ? 'border-green-200 bg-green-50'
                                            : record.status === 'late'
                                                ? 'border-orange-200 bg-orange-50'
                                                : 'border-slate-200 bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800 text-sm">
                                                    {record.student_name}
                                                </p>
                                                {record.confidence && (
                                                    <p className="text-xs text-slate-500">
                                                        Confidence: {(record.confidence * 100).toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                {record.status === 'present' && (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                )}
                                                {record.status === 'absent' && (
                                                    <XCircle className="w-5 h-5 text-slate-400" />
                                                )}
                                                {record.status === 'late' && (
                                                    <Clock className="w-5 h-5 text-orange-600" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

