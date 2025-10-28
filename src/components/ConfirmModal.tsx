import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertCircle className="w-6 h-6 text-red-600" />;
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            case 'info':
                return <AlertCircle className="w-6 h-6 text-blue-600" />;
            default:
                return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
        }
    };

    const getHeaderStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-50 border-red-100';
            case 'success':
                return 'bg-green-50 border-green-100';
            case 'info':
                return 'bg-blue-50 border-blue-100';
            default:
                return 'bg-yellow-50 border-yellow-100';
        }
    };

    const getIconBgStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-100';
            case 'success':
                return 'bg-green-100';
            case 'info':
                return 'bg-blue-100';
            default:
                return 'bg-yellow-100';
        }
    };

    const getButtonStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
            case 'success':
                return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
            case 'info':
                return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
            default:
                return 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
                {/* Modal Header */}
                <div className={`p-6 border-b ${getHeaderStyle()}`}>
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${getIconBgStyle()}`}>
                            {getIcon()}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <p className="text-slate-600 leading-relaxed">{message}</p>
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-slate-50 rounded-b-2xl flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all duration-300 font-semibold"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-white rounded-lg transition-all duration-300 font-semibold ${getButtonStyle()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

