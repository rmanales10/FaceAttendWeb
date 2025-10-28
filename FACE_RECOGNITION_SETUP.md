# Face Recognition Setup Guide

## Overview
Your Next.js attendance system now includes two powerful face recognition features:

1. **Face Training** - Capture/upload student photos and create face embeddings
2. **Face Recognition** - Real-time attendance tracking with live face detection and bounding boxes

## 📋 Prerequisites

### 1. Install face-api.js Models

The face-api.js library requires model files to function. You need to download them manually.

#### Download Models:

Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Download these 7 files and place them in `public/models/`:

1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1`
3. `face_landmark_68_model-weights_manifest.json`
4. `face_landmark_68_model-shard1`
5. `face_recognition_model-weights_manifest.json`
6. `face_recognition_model-shard1`
7. `face_recognition_model-shard2`

#### Quick Download (Using Command Line):

```bash
cd public/models

# Download using curl (Git Bash or WSL on Windows, or Terminal on Mac/Linux)
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-weights_manifest.json
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard1
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard2
```

#### Alternative - Manual Download:

1. Go to https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Click on each file listed above
3. Click "Download" or "Raw" and save the file
4. Place all files in `public/models/` folder

### 2. Verify Installation

After downloading the models, your `public/models/` folder should contain:

```
public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
├── face_recognition_model-shard2
└── README.md
```

## 🎯 Features Implemented

### 1. Face Training Page (`/dashboard/face-training`)

**Purpose**: Train students' faces by capturing/uploading multiple images to create face embeddings.

**Features**:
- ✅ Real-time camera capture
- ✅ Multiple image upload
- ✅ Face detection validation (only accepts images with detected faces)
- ✅ Minimum 5 images required for training
- ✅ Face descriptor extraction and averaging
- ✅ Training data saved to Firestore
- ✅ Beautiful modern UI with preview grid
- ✅ Live face detection feedback

**How to Use**:
1. Navigate to "Face Training" in sidebar
2. Click "Train Face" button for any student
3. Choose to:
   - **Capture from Camera**: Click "Start Camera" → Click "Capture" multiple times (min 5 photos)
   - **Upload Images**: Click upload area and select multiple face photos
4. System automatically validates each image for face detection
5. Once you have 5+ images, click "Save Training Data"
6. Face embeddings are stored in Firestore for that student

**Technical Details**:
- Uses `TinyFaceDetector` for fast face detection
- Extracts 128-dimensional face descriptors using `FaceRecognitionNet`
- Averages multiple descriptors for better accuracy
- Stores in Firestore as `face_descriptors` array

### 2. Face Recognition Page (`/dashboard/face-recognition`)

**Purpose**: Real-time attendance tracking using facial recognition.

**Features**:
- ✅ Live camera feed with real-time face detection
- ✅ Green bounding boxes for recognized students
- ✅ Orange bounding boxes for unknown faces
- ✅ Name labels with confidence scores
- ✅ Automatic attendance marking
- ✅ Real-time statistics (Present, Absent, Late, Total)
- ✅ Class schedule selection
- ✅ Filtered student list per schedule
- ✅ Save attendance to Firestore
- ✅ Live scanning indicator

**How to Use**:
1. Navigate to "Face Recognition" in sidebar
2. Select a class schedule from the list
3. System loads all trained students for that class
4. Click "Start Scanning" to activate camera
5. System automatically:
   - Detects faces in video stream (every 100ms)
   - Draws bounding boxes around faces
   - Matches faces against trained students
   - Marks attendance when match found
   - Shows confidence score
6. Monitor real-time statistics on right panel
7. Click "Save Attendance" when done

**Technical Details**:
- Uses `FaceMatcher` with 0.6 threshold for matching
- Continuous detection loop (10 FPS)
- Real-time canvas overlay for bounding boxes
- Confidence = (1 - euclidean distance)
- Only marks "absent" students as "present" once

## 🎨 UI/UX Features

### Modern Design Elements:
- Gradient backgrounds and cards
- Smooth animations and transitions
- Color-coded status indicators
- Responsive layout (mobile-friendly)
- Loading states and feedback
- Error handling with user-friendly messages

### Color Scheme:
- **Face Training**: Purple theme (`from-purple-500 to-purple-600`)
- **Face Recognition**: Indigo theme (`from-indigo-500 to-indigo-600`)
- **Present**: Green (`text-green-600`)
- **Absent**: Red/Gray (`text-red-600`)
- **Pending**: Orange (`text-orange-600`)

## 📊 Data Flow

### Training Flow:
```
1. Select Student → 2. Capture/Upload Images → 3. Validate Faces →
4. Extract Descriptors → 5. Average Descriptors → 6. Save to Firestore
```

### Recognition Flow:
```
1. Select Schedule → 2. Load Trained Students → 3. Start Camera →
4. Detect Faces → 5. Extract Descriptors → 6. Match Against Database →
7. Draw Bounding Boxes → 8. Mark Attendance → 9. Save Records
```

## 🔧 Troubleshooting

### Models Not Loading:
- **Error**: "Failed to load face recognition models"
- **Solution**: Ensure all 7 model files are in `public/models/`
- **Check**: Open browser DevTools → Network tab → Look for 404 errors

### Camera Not Working:
- **Error**: "Could not access camera"
- **Solution**: 
  - Grant camera permissions in browser
  - Use HTTPS (required for camera access)
  - Close other apps using camera

### No Face Detected:
- **Issue**: "No face detected" message when capturing
- **Solution**:
  - Ensure good lighting
  - Face camera directly
  - Remove glasses/masks if possible
  - Move closer to camera

### Low Recognition Accuracy:
- **Issue**: Students not being recognized
- **Solution**:
  - Train with more images (10+ recommended)
  - Use different angles and expressions
  - Ensure consistent lighting
  - Retrain if appearance changes significantly

### Slow Performance:
- **Issue**: Lag during recognition
- **Solution**:
  - Use `TinyFaceDetector` (already implemented)
  - Reduce detection frequency (increase interval)
  - Close unnecessary browser tabs
  - Use modern browser (Chrome/Edge recommended)

## 🚀 API Reference

### Face-API.js Integration

```typescript
// Load Models
await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

// Detect Single Face (Training)
const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

// Detect Multiple Faces (Recognition)
const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

// Face Matching
const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
const bestMatch = faceMatcher.findBestMatch(descriptor);
```

## 📝 Database Schema Updates

### Student Collection:
```typescript
{
    id: string;
    full_name: string;
    year_level: string;
    department: string;
    block: string;
    face_trained: boolean;              // New
    face_descriptors: number[];         // New (128-d array)
    training_date: string;              // New
    training_images_count: number;      // New
    // ... other fields
}
```

## 🎓 Best Practices

### Training:
1. **Capture 10-15 images per student** for best accuracy
2. **Vary angles**: front, left profile, right profile
3. **Vary expressions**: neutral, smiling
4. **Consistent lighting**: avoid backlighting
5. **Remove obstructions**: glasses, masks (if possible)
6. **Update regularly**: retrain if appearance changes

### Recognition:
1. **Good lighting**: ensure classroom is well-lit
2. **Camera position**: place at students' eye level
3. **Distance**: 1-3 meters from camera ideal
4. **Attendance window**: give students time to be recognized
5. **Manual backup**: have manual attendance option

## 📚 Resources

- [face-api.js Documentation](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
- [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js)
- [Model Weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

## 🆘 Support

For issues or questions:
1. Check browser console for error messages
2. Verify all model files are downloaded
3. Ensure camera permissions are granted
4. Test with good lighting conditions

## ✅ Checklist

Before using the system:
- [ ] All 7 model files downloaded to `public/models/`
- [ ] Models loading successfully (no orange warning)
- [ ] Camera permissions granted in browser
- [ ] At least one student trained with 5+ images
- [ ] Class schedule created
- [ ] Students assigned to correct department/year level

---

**Note**: This system uses client-side face recognition for privacy. All face matching happens in the browser - no images are sent to external servers.

