# Self-Training Link Integration Guide

## Overview
This guide shows you how to add a "Self Training" button next to each student/teacher in the Face Training page. When clicked, it copies a unique training link that students can use to train their own faces.

## Files Modified
- ✅ `/src/app/face-training-public/page.tsx` - **ALREADY CREATED** (Self-training page)
- ⏳ `/src/app/dashboard/face-training/page.tsx` - **NEEDS 4 SMALL EDITS**

---

## Changes Needed in `/src/app/dashboard/face-training/page.tsx`

### Change 1: Update Imports (Lines 6-20)

**Find this:**
```typescript
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
    UserCircle
} from 'lucide-react';
```

**Replace with:**
```typescript
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
    Copy,
    Check
} from 'lucide-react';
```

---

### Change 2: Add State Variable (After Line 42)

**Find this section:**
```typescript
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
```

**Add this line after `availableCameras` and before `videoRef`:**
```typescript
    const [copiedId, setCopiedId] = useState<string | null>(null);
```

---

### Change 3: Add Copy Function (After Line 371 - after `getInitials` function)

**Add this complete function:**
```typescript
    const copyTrainingLink = async (person: Person) => {
        const baseUrl = window.location.origin;
        const trainingUrl = `${baseUrl}/face-training-public?id=${person.id}&type=${person.type}`;
        
        try {
            await navigator.clipboard.writeText(trainingUrl);
            setCopiedId(person.id!);
            success(`Self-training link copied to clipboard!`);
            setTimeout(() => setCopiedId(null), 3000);
        } catch (err) {
            console.error('Failed to copy:', err);
            showError('Failed to copy link. Please try again.');
        }
    };
```

---

### Change 4: Update Actions Column (Lines 631-644)

**Find this:**
```typescript
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right">
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
                                            </td>
```

**Replace with:**
```typescript
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => copyTrainingLink(person)}
                                                        className={`inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs sm:text-sm space-x-1 sm:space-x-2 ${
                                                            copiedId === person.id
                                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                                        }`}
                                                        title="Copy self-training link"
                                                    >
                                                        {copiedId === person.id ? (
                                                            <>
                                                                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="hidden lg:inline">Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="hidden lg:inline">Self Train</span>
                                                            </>
                                                        )}
                                                    </button>
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
                                                </div>
                                            </td>
```

---

## How It Works

1. **Admin View**: Each student row now has TWO buttons:
   - 🔗 **"Self Train"** (blue) - Copies a unique training link
   - 📸 **"Train/Retrain"** (purple) - Opens the admin training modal

2. **Student Experience**:
   - Admin copies the link by clicking "Self Train"
   - Admin shares link with student (email, chat, etc.)
   - Student opens link: `http://localhost:3000/face-training-public?id=abc123&type=student`
   - Student trains their face independently
   - Training saves directly to database

3. **Link Format**: 
   ```
   http://localhost:3000/face-training-public?id={personId}&type={student|teacher}
   ```

## Testing

1. Make the 4 changes above
2. Go to Face Training page
3. Click "Self Train" on any student
4. Link copied message should appear
5. Paste the link in a new tab
6. You should see the self-training page with that student's info

---

**Status**: 
- ✅ Self-training page created and ready
- ⏳ 4 manual edits needed in face-training page
- ⏳ Test after making the changes
