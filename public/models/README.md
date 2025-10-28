# Face-API.js Models

This folder should contain the face-api.js model files for face detection and recognition.

## Required Models

Download the following model files from the face-api.js repository:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### Required Files:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_recognition_model-shard2**

## Quick Download

You can download all models at once:

```bash
cd public/models
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-weights_manifest.json
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard1
curl -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard2
```

Or manually download from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Place all downloaded files in this directory (`public/models/`).

