'use client';

import React, { useState, useEffect, useRef } from 'react';
import { studentService, Student, userService, User } from '@/lib/firestore';
import * as faceapi from 'face-api.js';
import {
    Camera,
    CheckCircle,
    Upload,
    X,
    Loader2,
    Video,
    ImagePlus,
    GraduationCap,
    UserCircle,
    AlertCircle
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

type PersonType = 'student' | 'teacher';

export default function FaceTrainingSelfPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const personId = searchParams?.get('id');
    const personType = searchParams?.get('type') as PersonType | null;

    const [person, setPerson] = useState<Student | User | null>(null);
    const [loading, setLoading] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [trainingImages, setTrainingImages] = useState<string[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCapturingContinuously, setIsCapturingContinuously] = useState(false);
    const [captureInterval, setCaptureInterval] = useState<NodeJS.Timeout | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadModels();
        if (personId && personType) {
            fetchPerson();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            showMessage('error', 'Failed to load face recognition models');
        }
    };

    const fetchPerson = async () => {
        try {
            if (!personId || !personType) return;

            if (personType === 'student') {
                const studentData = await studentService.getStudentById(personId);
                setPerson(studentData);
            } else if (personType === 'teacher') {
                const userData = await userService.getUserById(personId);
                setPerson(userData);
            }
        } catch (error) {
            console.error('Error fetching person:', error);
            showMessage('error', 'Failed to load your information');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
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

            await getCameras();
        } catch (err) {
            console.error('Error accessing camera:', err);
            showMessage('error', 'Could not access camera. Please check permissions.');
        }
    };

    const switchCamera = async () => {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);

        if (isCapturing) {
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
                    showMessage('error', 'Could not switch camera.');
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
            const img = await faceapi.fetchImage(imageData);
            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                if (!isCapturingContinuously) {
                    showMessage('warning', 'No face detected. Please position your face clearly in the camera.');
                }
                return;
            }

            setTrainingImages(prev => [...prev, imageData]);
            if (!isCapturingContinuously) {
                showMessage('success', 'Image captured successfully!');
            }
        } catch (err) {
            console.error('Error detecting face:', err);
            if (!isCapturingContinuously) {
                showMessage('error', 'Error detecting face. Please try again.');
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
                    const img = await faceapi.fetchImage(imageData);
                    const detection = await faceapi
                        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (detection) {
                        setTrainingImages(prev => [...prev, imageData]);
                    } else {
                        showMessage('warning', `No face detected in ${file.name}. Please upload a clear face image.`);
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
            showMessage('warning', 'Please capture or upload at least 5 images for better accuracy.');
            return;
        }

        if (!person || !personId || !personType) return;

        setIsProcessing(true);
        try {
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
                showMessage('error', 'Failed to extract face descriptors. Please try again with clearer images.');
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

            const updateData = {
                face_descriptors: Array.from(avgDescriptor),
                face_trained: true,
                training_date: new Date().toISOString(),
                training_images_count: trainingImages.length
            };

            if (personType === 'student') {
                await studentService.updateStudent(personId, updateData);
            } else {
                await userService.updateUser(personId, updateData);
            }

            setTrainingImages([]);
            stopCamera();

            // Redirect to success page
            const personName = personType === 'student'
                ? (person as Student).full_name
                : (person as User).fullname;
            router.push(`/face-training-success?type=${personType}&name=${encodeURIComponent(personName || '')}`);
        } catch (err) {
            console.error('Error saving face training:', err);
            showMessage('error', 'Failed to save face training. Please try again.');
        } finally {
            setIsProcessing(false);
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
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!personId || !personType || !person) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Link</h1>
                    <p className="text-slate-600">
                        This training link is invalid or has expired. Please contact your administrator for a new link.
                    </p>
                </div>
            </div>
        );
    }

    const personName = personType === 'student'
        ? (person as Student).full_name
        : (person as User).fullname;
    const isTrained = person.face_trained || false;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-r ${personType === 'student' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'
                            } rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-800 truncate">Self Face Training</h1>
                            <p className="text-slate-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
                                Train your face recognition data
                            </p>
                        </div>
                    </div>
                    {!modelsLoaded && (
                        <div className="bg-orange-100 border border-orange-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 flex items-center space-x-2 sm:space-x-3">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 animate-spin flex-shrink-0" />
                            <span className="text-orange-800 font-medium text-xs sm:text-sm lg:text-base">Loading face recognition models...</span>
                        </div>
                    )}
                </div>

                {/* Message Banner */}
                {message && (
                    <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 flex items-start sm:items-center space-x-2 sm:space-x-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' :
                        message.type === 'error' ? 'bg-red-50 border-red-200' :
                            'bg-orange-50 border-orange-200'
                        }`}>
                        {message.type === 'success' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />}
                        {message.type === 'error' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />}
                        {message.type === 'warning' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5 sm:mt-0" />}
                        <p className={`font-medium text-xs sm:text-sm lg:text-base flex-1 ${message.type === 'success' ? 'text-green-800' :
                            message.type === 'error' ? 'text-red-800' :
                                'text-orange-800'
                            }`}>{message.text}</p>
                    </div>
                )}

                {/* Person Info Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r ${personType === 'student' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'
                            } rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl lg:text-2xl flex-shrink-0 shadow-md`}>
                            {getInitials(personName || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 truncate">{personName}</h2>
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                                <div className="flex items-center space-x-1.5">
                                    {personType === 'student' ? (
                                        <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                                    ) : (
                                        <UserCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                                    )}
                                    <span className="text-slate-600 text-xs sm:text-sm capitalize">{personType}</span>
                                </div>
                                {isTrained && (
                                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Already Trained</span>
                                        <span className="sm:hidden">Trained</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {isTrained && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl">
                            <p className="text-xs sm:text-sm text-blue-800">
                                You have already completed face training. You can retrain to update your face data if needed.
                            </p>
                        </div>
                    )}
                </div>

                {/* Training Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-5 lg:p-6">
                    {/* Camera/Upload Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-4 sm:mb-6">
                        {/* Camera Feed */}
                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-purple-500" />
                                Camera Capture
                            </h3>
                            <div className="relative bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden aspect-video mb-2 sm:mb-3">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                />
                                {!isCapturing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                        <div className="text-center text-slate-400">
                                            <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                                            <p className="font-medium text-xs sm:text-sm">Camera is off</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {!isCapturing ? (
                                        <button
                                            onClick={startCamera}
                                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                        >
                                            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            <span>Start Camera</span>
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={toggleContinuousCapture}
                                                disabled={isProcessing || !modelsLoaded}
                                                className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg ${isCapturingContinuously
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'bg-purple-500 text-white hover:bg-purple-600'
                                                    } ${isProcessing || !modelsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">{isCapturingContinuously ? 'Stop Training' : 'Start Training'}</span>
                                                <span className="sm:hidden">{isCapturingContinuously ? 'Stop' : 'Train'}</span>
                                            </button>
                                            <button
                                                onClick={stopCamera}
                                                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 transition-all font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg"
                                            >
                                                <span className="hidden sm:inline">Stop</span>
                                                <span className="sm:hidden">X</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {availableCameras.length > 1 && (
                                    <button
                                        onClick={switchCamera}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span className="hidden sm:inline">Switch to {facingMode === 'user' ? 'Rear' : 'Front'} Camera</span>
                                        <span className="sm:hidden">Switch Camera</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-purple-500" />
                                Upload Images
                            </h3>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all aspect-video flex items-center justify-center"
                            >
                                <div>
                                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-slate-400 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700 text-xs sm:text-sm lg:text-base">Click to upload images</p>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">JPG, PNG up to 10MB</p>
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
                    <div className="mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base lg:text-lg">
                                Captured Images ({trainingImages.length})
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500">
                                {trainingImages.length < 5 ? (
                                    <span className="text-orange-600 font-medium">
                                        Need {5 - trainingImages.length} more image{5 - trainingImages.length > 1 ? 's' : ''}
                                    </span>
                                ) : (
                                    <span className="text-green-600 font-medium">
                                        ✓ Ready to train
                                    </span>
                                )}
                            </p>
                        </div>
                        {trainingImages.length === 0 ? (
                            <div className="bg-slate-50 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center border-2 border-slate-200">
                                <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm sm:text-base">No images captured yet</p>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">Use camera or upload images to begin</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
                                {trainingImages.map((image, index) => (
                                    <div key={index} className="relative group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image}
                                            alt={`Training ${index + 1}`}
                                            className="w-full aspect-square object-cover rounded-lg sm:rounded-xl border-2 border-slate-200"
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-md sm:rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={saveFaceTraining}
                            disabled={trainingImages.length < 5 || isProcessing || !modelsLoaded}
                            className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-bold text-sm sm:text-base lg:text-lg flex items-center justify-center space-x-2 sm:space-x-3 ${trainingImages.length >= 5 && !isProcessing && modelsLoaded
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                    <span>Complete Training</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
