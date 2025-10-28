'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-white border-l-4 border-green-500 shadow-lg';
            case 'error':
                return 'bg-white border-l-4 border-red-500 shadow-lg';
            case 'warning':
                return 'bg-white border-l-4 border-yellow-500 shadow-lg';
            case 'info':
                return 'bg-white border-l-4 border-blue-500 shadow-lg';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${getToastStyles(toast.type)} rounded-lg p-4 flex items-start gap-3 animate-slide-in pointer-events-auto transform transition-all duration-300 ease-in-out`}
                        style={{
                            animation: 'slideIn 0.3s ease-out'
                        }}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getToastIcon(toast.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 whitespace-pre-line break-words">
                                {toast.message}
                            </p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

