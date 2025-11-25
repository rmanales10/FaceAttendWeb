# QR Code Feature Implementation Guide

## Overview
This guide shows how to add a QR code button to the Face Training page. When clicked, it displays a QR code modal that students can scan with their phones to access their self-training link.

## Changes Required

### Step 1: Add Imports (Lines 6-22)

Find this at the top of the file:
```tsx
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
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
```

**Replace with**:
```tsx
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
    QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { QRCodeSVG } from 'qrcode.react';
```

---

### Step 2: Add State Variables (After line 42)

Find this section:
```tsx
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
```

**Add these two lines after `availableCameras` and before `videoRef`**:
```tsx
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrPerson, setQrPerson] = useState<Person | null>(null);
```

---

### Step 3: Add QR Code Functions (After line 371, after the `getInitials` function)

Find:
```tsx
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTrainingStats = () => {
```

**Add these functions between `getInitials` and `getTrainingStats`**:
```tsx
    const showQRCode = (person: Person) => {
        setQrPerson(person);
        setShowQRModal(true);
    };

    const closeQRModal = () => {
        setShowQRModal(false);
        setQrPerson(null);
    };
```

---

### Step 4: Update Actions Column (Lines 631-644)

Find this table cell:
```tsx
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

**Replace with**:
```tsx
                                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => showQRCode(person)}
                                                        className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs sm:text-sm space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                                                        title="Show QR Code for self-training"
                                                    >
                                                        <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="hidden lg:inline">QR</span>
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

### Step 5: Add QR Code Modal (Before the closing tags, around line 860)

Find the end of the training modal and the toast container:
```tsx
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
```

**Add the QR Modal BEFORE `{/* Toast Notifications */}`**:
```tsx
            {/* QR Code Modal */}
            {showQRModal && qrPerson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeQRModal}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Self-Training QR Code</h2>
                            <button
                                onClick={closeQRModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Person Info */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 bg-gradient-to-r ${qrPerson.type === 'student'
                                    ? 'from-blue-500 to-blue-600'
                                    : 'from-purple-500 to-purple-600'
                                    } rounded-xl flex items-center justify-center text-white font-bold`}>
                                    {getInitials(qrPerson.type === 'student'
                                        ? (qrPerson as Student).full_name
                                        : (qrPerson as User).fullname)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">
                                        {qrPerson.type === 'student'
                                            ? (qrPerson as Student).full_name
                                            : (qrPerson as User).fullname}
                                    </p>
                                    <p className="text-sm text-slate-600 capitalize">{qrPerson.type}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center mb-6 p-6 bg-white border-4 border-slate-200 rounded-2xl">
                            <QRCodeSVG
                                value={`${window.location.origin}/face-training-public?id=${qrPerson.id}&type=${qr Person.type}`}
                                size={256}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                            <p className="text-sm text-blue-800 font-medium mb-2">📱 How to use:</p>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>Open camera app on your phone</li>
                                <li>Point at the QR code</li>
                                <li>Tap the notification to open the link</li>
                                <li>Complete face training on your device</li>
                            </ol>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closeQRModal}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
```

---

## Result

After making these changes, each student/teacher row will have:
- **Blue "QR" button** - Click to show QR code modal
- **Purple "Train/Retrain" button** - Opens the admin training modal

The QR code can be scanned by students using their phone camera to access their personal self-training page.

## Testing

1. Make all 5 changes above
2. Save the file
3. The dev server should hot-reload
4. Go to Face Training page
5. Click the blue "QR" button on any student
6. A modal with a QR code should appear
7. Scan the QR code with your phone to test the link

---

**Note**: All changes preserve the existing functionality. The QR button is an *addition* to the existing Train button, not a replacement.
