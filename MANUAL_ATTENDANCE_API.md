# Manual Attendance API Documentation

This document explains how to create manual attendance records from your Flutter app, which will be stored in the same `classAttendance` collection with the type `manual`.

## 📊 Data Structure

### ClassAttendance Document Structure

```typescript
{
  id: "attendance-7964069",
  class_schedule: {
    building_room: "MS07",
    course_code: "IT412",
    course_year: "BSIT 4D",
    department: "BSIT",
    schedule: "MONDAY (1:00PM - 2:00PM) FRIDAY (1:00PM - 3:00PM)",
    subject_id: "TYd2VXuuCO4NjeTiAA0f",
    subject_name: "System Administration and Maintenance",
    teacher_id: "YWlFjmt0cYZ6xarn1mlm2mTbiMfE2",
    teacher_name: "James Gwapo",
    year_level: "4th Year"
  },
  attendance_records: [
    {
      student_id: "abc123",
      student_name: "Rolan Manales",
      status: "present",
      timestamp: "2025-10-28T14:30:00Z",
      attendance_type: "manual", // or "face"
      confidence: null // Only for face recognition
    },
    {
      student_id: "def456",
      student_name: "John Doe",
      status: "absent",
      timestamp: "2025-10-28T14:30:00Z",
      attendance_type: "manual"
    }
  ],
  absent_count: 1,
  present_count: 1,
  late_count: 0,
  total_students: 2,
  created_at: Timestamp,
  created_by: "teacher_user_id",
  attendance_date: "2025-10-28"
}
```

## 🔥 Flutter Firebase Integration

### 1. Add Firebase Dependencies

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  cloud_firestore: ^4.13.6
```

### 2. Attendance Models (Dart)

```dart
// lib/models/attendance_models.dart

class AttendanceRecord {
  final String studentId;
  final String studentName;
  final String status; // 'present', 'absent', 'late'
  final DateTime timestamp;
  final String attendanceType; // 'manual' or 'face'
  final double? confidence; // Only for face recognition

  AttendanceRecord({
    required this.studentId,
    required this.studentName,
    required this.status,
    required this.timestamp,
    required this.attendanceType,
    this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'student_id': studentId,
    'student_name': studentName,
    'status': status,
    'timestamp': timestamp.toIso8601String(),
    'attendance_type': attendanceType,
    'confidence': confidence,
  };

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      studentId: json['student_id'] ?? '',
      studentName: json['student_name'] ?? '',
      status: json['status'] ?? 'absent',
      timestamp: DateTime.parse(json['timestamp']),
      attendanceType: json['attendance_type'] ?? 'manual',
      confidence: json['confidence']?.toDouble(),
    );
  }
}

class ClassScheduleData {
  final String buildingRoom;
  final String courseCode;
  final String courseYear;
  final String department;
  final String schedule;
  final String subjectId;
  final String subjectName;
  final String teacherId;
  final String teacherName;
  final String yearLevel;

  ClassScheduleData({
    required this.buildingRoom,
    required this.courseCode,
    required this.courseYear,
    required this.department,
    required this.schedule,
    required this.subjectId,
    required this.subjectName,
    required this.teacherId,
    required this.teacherName,
    required this.yearLevel,
  });

  Map<String, dynamic> toJson() => {
    'building_room': buildingRoom,
    'course_code': courseCode,
    'course_year': courseYear,
    'department': department,
    'schedule': schedule,
    'subject_id': subjectId,
    'subject_name': subjectName,
    'teacher_id': teacherId,
    'teacher_name': teacherName,
    'year_level': yearLevel,
  };

  factory ClassScheduleData.fromJson(Map<String, dynamic> json) {
    return ClassScheduleData(
      buildingRoom: json['building_room'] ?? '',
      courseCode: json['course_code'] ?? '',
      courseYear: json['course_year'] ?? '',
      department: json['department'] ?? '',
      schedule: json['schedule'] ?? '',
      subjectId: json['subject_id'] ?? '',
      subjectName: json['subject_name'] ?? '',
      teacherId: json['teacher_id'] ?? '',
      teacherName: json['teacher_name'] ?? '',
      yearLevel: json['year_level'] ?? '',
    );
  }
}

class ClassAttendance {
  final String? id;
  final ClassScheduleData classSchedule;
  final List<AttendanceRecord> attendanceRecords;
  final int absentCount;
  final int presentCount;
  final int lateCount;
  final int totalStudents;
  final DateTime? createdAt;
  final String? createdBy;
  final String attendanceDate;

  ClassAttendance({
    this.id,
    required this.classSchedule,
    required this.attendanceRecords,
    required this.absentCount,
    required this.presentCount,
    required this.lateCount,
    required this.totalStudents,
    this.createdAt,
    this.createdBy,
    required this.attendanceDate,
  });

  Map<String, dynamic> toJson() => {
    'class_schedule': classSchedule.toJson(),
    'attendance_records': attendanceRecords.map((r) => r.toJson()).toList(),
    'absent_count': absentCount,
    'present_count': presentCount,
    'late_count': lateCount,
    'total_students': totalStudents,
    'created_at': FieldValue.serverTimestamp(),
    'created_by': createdBy,
    'attendance_date': attendanceDate,
  };

  factory ClassAttendance.fromJson(String id, Map<String, dynamic> json) {
    return ClassAttendance(
      id: id,
      classSchedule: ClassScheduleData.fromJson(json['class_schedule'] ?? {}),
      attendanceRecords: (json['attendance_records'] as List?)
          ?.map((r) => AttendanceRecord.fromJson(r))
          .toList() ?? [],
      absentCount: json['absent_count'] ?? 0,
      presentCount: json['present_count'] ?? 0,
      lateCount: json['late_count'] ?? 0,
      totalStudents: json['total_students'] ?? 0,
      createdAt: (json['created_at'] as Timestamp?)?.toDate(),
      createdBy: json['created_by'],
      attendanceDate: json['attendance_date'] ?? '',
    );
  }
}
```

### 3. Attendance Service (Dart)

```dart
// lib/services/attendance_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/attendance_models.dart';

class AttendanceService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final String collectionName = 'classAttendance';

  /// Save manual attendance from Flutter app
  Future<String> saveManualAttendance({
    required ClassScheduleData classSchedule,
    required List<AttendanceRecord> attendanceRecords,
    required String teacherId,
  }) async {
    try {
      // Calculate statistics
      final presentCount = attendanceRecords.where((r) => r.status == 'present').length;
      final absentCount = attendanceRecords.where((r) => r.status == 'absent').length;
      final lateCount = attendanceRecords.where((r) => r.status == 'late').length;
      
      // Get current date
      final now = DateTime.now();
      final attendanceDate = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

      // Create ClassAttendance object
      final attendance = ClassAttendance(
        classSchedule: classSchedule,
        attendanceRecords: attendanceRecords,
        absentCount: absentCount,
        presentCount: presentCount,
        lateCount: lateCount,
        totalStudents: attendanceRecords.length,
        createdBy: teacherId,
        attendanceDate: attendanceDate,
      );

      // Save to Firestore
      final docRef = await _firestore
          .collection(collectionName)
          .add(attendance.toJson());

      print('✅ Manual attendance saved: ${docRef.id}');
      return docRef.id;
    } catch (e) {
      print('❌ Error saving manual attendance: $e');
      rethrow;
    }
  }

  /// Get all attendance records
  Future<List<ClassAttendance>> getAllAttendance() async {
    try {
      final snapshot = await _firestore
          .collection(collectionName)
          .orderBy('created_at', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ClassAttendance.fromJson(doc.id, doc.data()))
          .toList();
    } catch (e) {
      print('❌ Error fetching attendance: $e');
      return [];
    }
  }

  /// Get attendance by schedule ID
  Future<List<ClassAttendance>> getAttendanceBySchedule(String scheduleId) async {
    try {
      final snapshot = await _firestore
          .collection(collectionName)
          .where('class_schedule.subject_id', isEqualTo: scheduleId)
          .orderBy('created_at', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ClassAttendance.fromJson(doc.id, doc.data()))
          .toList();
    } catch (e) {
      print('❌ Error fetching attendance by schedule: $e');
      return [];
    }
  }

  /// Get attendance by date
  Future<List<ClassAttendance>> getAttendanceByDate(String date) async {
    try {
      final snapshot = await _firestore
          .collection(collectionName)
          .where('attendance_date', isEqualTo: date)
          .orderBy('created_at', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ClassAttendance.fromJson(doc.id, doc.data()))
          .toList();
    } catch (e) {
      print('❌ Error fetching attendance by date: $e');
      return [];
    }
  }

  /// Update attendance record
  Future<void> updateAttendance(String id, Map<String, dynamic> data) async {
    try {
      await _firestore.collection(collectionName).doc(id).update(data);
      print('✅ Attendance updated: $id');
    } catch (e) {
      print('❌ Error updating attendance: $e');
      rethrow;
    }
  }

  /// Delete attendance record
  Future<void> deleteAttendance(String id) async {
    try {
      await _firestore.collection(collectionName).doc(id).delete();
      print('✅ Attendance deleted: $id');
    } catch (e) {
      print('❌ Error deleting attendance: $e');
      rethrow;
    }
  }
}
```

### 4. Example Usage in Flutter

```dart
// lib/screens/manual_attendance_screen.dart

import 'package:flutter/material.dart';
import '../models/attendance_models.dart';
import '../services/attendance_service.dart';

class ManualAttendanceScreen extends StatefulWidget {
  final ClassScheduleData schedule;
  final List<Student> students; // Your student model
  final String teacherId;

  const ManualAttendanceScreen({
    Key? key,
    required this.schedule,
    required this.students,
    required this.teacherId,
  }) : super(key: key);

  @override
  State<ManualAttendanceScreen> createState() => _ManualAttendanceScreenState();
}

class _ManualAttendanceScreenState extends State<ManualAttendanceScreen> {
  final AttendanceService _attendanceService = AttendanceService();
  final Map<String, String> _attendanceStatus = {}; // studentId -> status
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    // Initialize all students as absent
    for (var student in widget.students) {
      _attendanceStatus[student.id] = 'absent';
    }
  }

  Future<void> _saveAttendance() async {
    setState(() => _isSaving = true);

    try {
      // Create attendance records with 'manual' type
      final records = widget.students.map((student) {
        return AttendanceRecord(
          studentId: student.id,
          studentName: student.fullName,
          status: _attendanceStatus[student.id] ?? 'absent',
          timestamp: DateTime.now(),
          attendanceType: 'manual', // ← Mark as MANUAL
          confidence: null, // No confidence for manual entry
        );
      }).toList();

      // Save to Firestore
      final docId = await _attendanceService.saveManualAttendance(
        classSchedule: widget.schedule,
        attendanceRecords: records,
        teacherId: widget.teacherId,
      );

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Attendance saved successfully!\nDocument ID: $docId'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Failed to save attendance: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manual Attendance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _isSaving ? null : _saveAttendance,
          ),
        ],
      ),
      body: _isSaving
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: widget.students.length,
              itemBuilder: (context, index) {
                final student = widget.students[index];
                final status = _attendanceStatus[student.id] ?? 'absent';

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text(student.fullName[0]),
                    ),
                    title: Text(student.fullName),
                    subtitle: Text(student.department),
                    trailing: DropdownButton<String>(
                      value: status,
                      items: const [
                        DropdownMenuItem(value: 'present', child: Text('✓ Present')),
                        DropdownMenuItem(value: 'absent', child: Text('✗ Absent')),
                        DropdownMenuItem(value: 'late', child: Text('⏰ Late')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _attendanceStatus[student.id] = value!;
                        });
                      },
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isSaving ? null : _saveAttendance,
        icon: const Icon(Icons.save),
        label: const Text('Save Attendance'),
      ),
    );
  }
}
```

## 📋 Key Differences: Manual vs Face Recognition

| Field | Manual Attendance | Face Recognition Attendance |
|-------|-------------------|----------------------------|
| `attendance_type` | `"manual"` | `"face"` |
| `confidence` | `null` | `0.0 - 1.0` (e.g., 0.85) |
| Entry Method | Flutter App (Manual Selection) | Web App (Camera Detection) |
| User Action | Teacher selects each student | Automatic face detection |

## 🎯 Complete Flow Example

### Scenario: Teacher Taking Manual Attendance

```dart
// 1. Teacher selects schedule in Flutter app
final schedule = ClassScheduleData(
  subjectId: 'TYd2VXuuCO4NjeTiAA0f',
  subjectName: 'System Administration and Maintenance',
  teacherId: 'YWlFjmt0cYZ6xarn1mlm2mTbiMfE2',
  teacherName: 'James Gwapo',
  courseCode: 'IT412',
  department: 'BSIT',
  yearLevel: '4th Year',
  courseYear: 'BSIT 4D',
  schedule: 'MONDAY (1:00PM - 2:00PM) FRIDAY (1:00PM - 3:00PM)',
  buildingRoom: 'MS07',
);

// 2. Teacher marks students
final records = [
  AttendanceRecord(
    studentId: 'student_001',
    studentName: 'Rolan Manales',
    status: 'present',
    timestamp: DateTime.now(),
    attendanceType: 'manual', // ← MANUAL
  ),
  AttendanceRecord(
    studentId: 'student_002',
    studentName: 'John Doe',
    status: 'absent',
    timestamp: DateTime.now(),
    attendanceType: 'manual', // ← MANUAL
  ),
];

// 3. Save to Firestore
final docId = await AttendanceService().saveManualAttendance(
  classSchedule: schedule,
  attendanceRecords: records,
  teacherId: 'teacher_123',
);

// ✅ Saved to: classAttendance/attendance-7964069
```

## 🔍 Querying Attendance

### Get All Manual Attendance
```dart
final allAttendance = await AttendanceService().getAllAttendance();
final manualOnly = allAttendance.where((a) => 
  a.attendanceRecords.any((r) => r.attendanceType == 'manual')
).toList();
```

### Get All Face Recognition Attendance
```dart
final faceOnly = allAttendance.where((a) => 
  a.attendanceRecords.any((r) => r.attendanceType == 'face')
).toList();
```

### Get Today's Attendance
```dart
final today = DateTime.now();
final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
final todaysAttendance = await AttendanceService().getAttendanceByDate(dateStr);
```

## 📊 Statistics Dashboard

```dart
class AttendanceStats {
  final int totalAttendance;
  final int manualCount;
  final int faceCount;
  final int totalPresent;
  final int totalAbsent;
  final int totalLate;

  static AttendanceStats calculate(List<ClassAttendance> attendanceList) {
    int manualCount = 0;
    int faceCount = 0;
    int totalPresent = 0;
    int totalAbsent = 0;
    int totalLate = 0;

    for (var attendance in attendanceList) {
      totalPresent += attendance.presentCount;
      totalAbsent += attendance.absentCount;
      totalLate += attendance.lateCount;

      // Check type of first record (assuming all records in one attendance have same type)
      if (attendance.attendanceRecords.isNotEmpty) {
        if (attendance.attendanceRecords.first.attendanceType == 'manual') {
          manualCount++;
        } else {
          faceCount++;
        }
      }
    }

    return AttendanceStats(
      totalAttendance: attendanceList.length,
      manualCount: manualCount,
      faceCount: faceCount,
      totalPresent: totalPresent,
      totalAbsent: totalAbsent,
      totalLate: totalLate,
    );
  }
}
```

## 🔐 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /classAttendance/{attendanceId} {
      // Allow teachers to create attendance
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.created_by;
      
      // Allow teachers to read their own attendance
      allow read: if request.auth != null && 
                    resource.data.class_schedule.teacher_id == request.auth.uid;
      
      // Allow teachers to update/delete their own attendance
      allow update, delete: if request.auth != null && 
                              resource.data.created_by == request.auth.uid;
    }
  }
}
```

## ✅ Summary

- **Manual Attendance**: Created in Flutter app with `attendance_type: 'manual'`
- **Face Recognition Attendance**: Created in web app with `attendance_type: 'face'`
- Both types stored in same `classAttendance` collection
- Easily filterable and queryable by type
- Complete statistics tracking for both methods
- Secure with Firestore security rules

Your Flutter app can now create manual attendance records that coexist with face recognition records in the same database! 🎉

