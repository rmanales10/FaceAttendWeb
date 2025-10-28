# Flutter WebView Integration Guide

This document explains how to integrate the Face Recognition page with your Flutter mobile app for attendance tracking.

## 🔗 API Endpoints

### Face Recognition Page with Schedule Selection

#### Basic URL
```
https://yourdomain.com/dashboard/face-recognition
```

#### URL with Schedule ID (Recommended for Flutter)
```
https://yourdomain.com/dashboard/face-recognition?id=SCHEDULE_ID
```

#### URL with Auto-Start (Optional)
```
https://yourdomain.com/dashboard/face-recognition?id=SCHEDULE_ID&autostart=true
```

## 📱 Flutter WebView Implementation

### Example 1: Basic WebView with Schedule ID

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class AttendanceCamera extends StatefulWidget {
  final String scheduleId;
  
  const AttendanceCamera({Key? key, required this.scheduleId}) : super(key: key);

  @override
  State<AttendanceCamera> createState() => _AttendanceCameraState();
}

class _AttendanceCameraState extends State<AttendanceCamera> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {},
          onPageFinished: (String url) {},
          onWebResourceError: (WebResourceError error) {},
        ),
      )
      ..loadRequest(Uri.parse(
        'https://yourdomain.com/dashboard/face-recognition?id=${widget.scheduleId}'
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Face Recognition'),
      ),
      body: WebViewWidget(controller: controller),
    );
  }
}
```

### Example 2: WebView with Auto-Start

```dart
class AttendanceCameraAutoStart extends StatefulWidget {
  final String scheduleId;
  final bool autoStart;
  
  const AttendanceCameraAutoStart({
    Key? key, 
    required this.scheduleId,
    this.autoStart = false,
  }) : super(key: key);

  @override
  State<AttendanceCameraAutoStart> createState() => _AttendanceCameraAutoStartState();
}

class _AttendanceCameraAutoStartState extends State<AttendanceCameraAutoStart> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    
    String url = 'https://yourdomain.com/dashboard/face-recognition?id=${widget.scheduleId}';
    
    if (widget.autoStart) {
      url += '&autostart=true';
    }
    
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebViewWidget(controller: controller),
      ),
    );
  }
}
```

### Example 3: Full-Screen WebView for Attendance

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

class FullScreenAttendance extends StatefulWidget {
  final String scheduleId;
  
  const FullScreenAttendance({Key? key, required this.scheduleId}) : super(key: key);

  @override
  State<FullScreenAttendance> createState() => _FullScreenAttendanceState();
}

class _FullScreenAttendanceState extends State<FullScreenAttendance> {
  late final WebViewController controller;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    
    // Enable full-screen mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            setState(() {
              isLoading = false;
            });
          },
        ),
      )
      ..loadRequest(Uri.parse(
        'https://yourdomain.com/dashboard/face-recognition?id=${widget.scheduleId}&autostart=true'
      ));
  }

  @override
  void dispose() {
    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          WebViewWidget(controller: controller),
          if (isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
```

## 🎯 URL Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | The schedule ID from Firestore | `fNPJW41ErqEMTrl6OcFy` |

### Optional Parameters

| Parameter | Type | Description | Example | Default |
|-----------|------|-------------|---------|---------|
| `autostart` | boolean | Automatically start scanning when page loads | `true` or `false` | `false` |

## 📋 Usage Examples

### Example 1: Manual Start
User manually clicks "Start Scanning" button:
```
https://yourdomain.com/dashboard/face-recognition?id=fNPJW41ErqEMTrl6OcFy
```

### Example 2: Auto-Start Scanning
Camera starts automatically after page loads:
```
https://yourdomain.com/dashboard/face-recognition?id=fNPJW41ErqEMTrl6OcFy&autostart=true
```

### Example 3: From Flutter with Variable
```dart
String scheduleId = 'fNPJW41ErqEMTrl6OcFy';
String url = 'https://yourdomain.com/dashboard/face-recognition?id=$scheduleId';
```

## 🔄 Features Enabled

### ✅ Automatic Schedule Selection
- When `id` parameter is provided, the schedule is automatically selected
- No need for user to manually choose from the list
- Visual indicator shows "Auto-loaded" badge

### ✅ Auto-Start Scanning (Optional)
- When `autostart=true` is provided, scanning begins automatically
- Waits for:
  - Face recognition models to load
  - Schedule to be selected
  - Students to be fetched
  - Camera permissions granted

### ✅ Mobile Camera Support
- Automatically uses device cameras (front/rear)
- Camera switch button for toggling between cameras
- Optimized for mobile viewport

### ✅ Orientation Support
- **Portrait Mode**: Standard layout with schedule, camera, and attendance list
- **Landscape Mode**: Optimized layout with camera on left and attendance on right
- Automatically adapts when device is rotated

## 📱 Flutter App Flow

### Recommended Flow for Attendance App

1. **Teacher Login** (Flutter App)
   ```dart
   // User logs in and selects their class schedule
   String selectedScheduleId = await showSchedulePicker();
   ```

2. **Navigate to Attendance Camera** (Flutter App)
   ```dart
   Navigator.push(
     context,
     MaterialPageRoute(
       builder: (context) => AttendanceCamera(
         scheduleId: selectedScheduleId,
       ),
     ),
   );
   ```

3. **WebView Opens Face Recognition** (WebView)
   ```
   URL: /dashboard/face-recognition?id=fNPJW41ErqEMTrl6OcFy&autostart=true
   ```

4. **Automatic Process** (Web Page)
   - Schedule auto-selected ✅
   - Camera auto-starts ✅
   - Face detection begins ✅
   - Attendance recorded ✅

5. **Save Attendance** (Web Page)
   - Teacher clicks "Save Attendance"
   - Records saved to Firestore
   - Can close WebView and return to Flutter app

## 🎨 UI Behavior

### Portrait Mode
```
┌─────────────────────────┐
│ Header: Face Recognition│
│ "Auto-loaded" Badge     │
├─────────────────────────┤
│ Selected Schedule Info  │
├─────────────────────────┤
│ Camera Feed (Large)     │
│ [Switch Camera] [Stop]  │
├─────────────────────────┤
│ Statistics              │
│ Present: 5 | Absent: 2  │
├─────────────────────────┤
│ Attendance List         │
│ • Student 1 ✓ Present   │
│ • Student 2 ✓ Present   │
│ • Student 3 ✗ Absent    │
└─────────────────────────┘
```

### Landscape Mode (When Scanning)
```
┌────────────────────────┬──────────────┐
│                        │ Stats        │
│                        │ P:5 | A:2    │
│   Camera Feed          ├──────────────┤
│   (Full Height)        │ Attendance   │
│                        │ • Student 1 ✓│
│   [📷] [⏹]            │ • Student 2 ✓│
│                        │ • Student 3 ✗│
│                        │ (Scrollable) │
└────────────────────────┴──────────────┘
```

## 🔐 Security Considerations

### Authentication
- WebView must maintain authentication session
- Consider using JWT or session cookies
- Implement proper CORS policies

### Camera Permissions
- WebView must request camera permissions
- Handle permission denials gracefully
- Test on both Android and iOS

### Example: Camera Permission (Flutter)
```dart
// Add to pubspec.yaml
// permission_handler: ^10.0.0

import 'package:permission_handler/permission_handler.dart';

Future<bool> requestCameraPermission() async {
  final status = await Permission.camera.request();
  return status.isGranted;
}

// Before opening WebView
if (await requestCameraPermission()) {
  // Open WebView
} else {
  // Show permission denied message
}
```

## 🧪 Testing

### Test Cases

1. **Test with Valid Schedule ID**
   ```
   /dashboard/face-recognition?id=VALID_SCHEDULE_ID
   Expected: Schedule auto-selected, ready to scan
   ```

2. **Test with Invalid Schedule ID**
   ```
   /dashboard/face-recognition?id=INVALID_ID
   Expected: Console warning, show all schedules
   ```

3. **Test Auto-Start**
   ```
   /dashboard/face-recognition?id=VALID_ID&autostart=true
   Expected: Camera starts automatically after 1 second
   ```

4. **Test Orientation Change**
   ```
   Action: Rotate device while scanning
   Expected: Layout adapts to landscape/portrait
   ```

5. **Test Camera Switch**
   ```
   Action: Click camera switch button
   Expected: Toggles between front/rear camera
   ```

## 📊 Data Flow

```
Flutter App
    ↓
[Select Schedule ID]
    ↓
WebView with URL Parameter
    ↓
Face Recognition Page
    ↓
[Auto-select Schedule from URL]
    ↓
[Fetch Students for Schedule]
    ↓
[Load Face Descriptors]
    ↓
[Start Camera & Detection]
    ↓
[Real-time Face Recognition]
    ↓
[Record Attendance]
    ↓
[Save to Firestore]
    ↓
Return to Flutter App
```

## 🛠️ Troubleshooting

### Issue: Schedule Not Auto-Selected
**Solution**: Verify the schedule ID exists in Firestore
```javascript
// Check console logs
console.log('Schedule ID from URL:', scheduleIdFromUrl);
console.log('Found schedule:', scheduleFromUrl);
```

### Issue: Camera Not Starting
**Solution**: Check browser/WebView permissions
- Ensure camera permission is granted
- Check HTTPS requirement (camera API requires secure context)
- Verify `navigator.mediaDevices` is available

### Issue: Auto-Start Not Working
**Solution**: Check dependencies
- Models must be loaded first
- Schedule must be selected
- Students must be fetched
- All three conditions must be true

### Issue: Orientation Not Changing
**Solution**: Check screen rotation settings
- Ensure device auto-rotate is enabled
- Test `window.innerWidth` vs `window.innerHeight`
- Verify event listeners are registered

## 📝 Notes

1. **HTTPS Required**: Camera access requires HTTPS in production
2. **CORS**: Configure CORS if Flutter app and web app are on different domains
3. **Session Management**: Maintain user authentication across WebView
4. **Error Handling**: Implement proper error handling for network issues
5. **Loading States**: Show loading indicators while models load
6. **Offline Support**: Consider offline mode for attendance if needed

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_FIREBASE_CONFIG=...
```

### Flutter App Configuration
```dart
const String ATTENDANCE_BASE_URL = 'https://yourdomain.com/dashboard/face-recognition';

String getAttendanceUrl(String scheduleId, {bool autoStart = false}) {
  String url = '$ATTENDANCE_BASE_URL?id=$scheduleId';
  if (autoStart) {
    url += '&autostart=true';
  }
  return url;
}
```

## 📞 Support

For issues or questions:
- Check console logs in WebView
- Verify Firestore schedule IDs
- Test camera permissions
- Review network requests

