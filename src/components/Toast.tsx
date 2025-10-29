'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast, onClose]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-orange-600" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    const getBackgroundColor = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-orange-50 border-orange-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = () => {
        switch (toast.type) {
            case 'success':
                return 'text-green-800';
            case 'error':
                return 'text-red-800';
            case 'warning':
                return 'text-orange-800';
            case 'info':
                return 'text-blue-800';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`${getBackgroundColor()} border-2 rounded-xl shadow-lg p-4 mb-3 flex items-start space-x-3 max-w-md w-full`}
        >
            <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
            </div>
            <div className={`flex-1 ${getTextColor()} text-sm font-medium leading-relaxed whitespace-pre-line`}>
                {toast.message}
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className={`flex-shrink-0 ${getTextColor()} hover:opacity-70 transition-opacity`}
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

