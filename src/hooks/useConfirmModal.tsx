import { useState } from 'react';

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export function useConfirmModal() {
    const [modalState, setModalState] = useState<ConfirmModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });

    const showConfirmation = (
        title: string,
        message: string,
        onConfirm: () => void,
        type: 'danger' | 'warning' | 'success' | 'info' = 'warning',
        confirmText = 'Confirm',
        cancelText = 'Cancel'
    ) => {
        setModalState({
            isOpen: true,
            title,
            message,
            onConfirm,
            type,
            confirmText,
            cancelText
        });
    };

    const closeModal = () => {
        setModalState({
            ...modalState,
            isOpen: false
        });
    };

    return {
        modalState,
        showConfirmation,
        closeModal
    };
}

