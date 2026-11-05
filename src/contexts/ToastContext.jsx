import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useLanguage } from './LanguageContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const { language } = useLanguage();
    const idCounter = useRef(1);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(({
        type = 'success', // 'success' | 'error' | 'warning' | 'info' | 'status'
        title,
        message,
        entity,
        oldStatus,
        newStatus,
        duration = 3500,
        onUndo
    }) => {
        const id = idCounter.current++;
        const newToast = {
            id,
            type,
            title,
            message,
            entity,
            oldStatus,
            newStatus,
            duration,
            onUndo,
            createdAt: Date.now()
        };

        setToasts((prev) => [newToast, ...prev].slice(0, 4)); // Tối đa 4 thông báo nhỏ

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    // Helpers ngắn gọn
    const toast = {
        success: (title, message, options = {}) =>
            addToast({ type: 'success', title, message, ...options }),
        error: (title, message, options = {}) =>
            addToast({ type: 'error', title, message, ...options }),
        warning: (title, message, options = {}) =>
            addToast({ type: 'warning', title, message, ...options }),
        info: (title, message, options = {}) =>
            addToast({ type: 'info', title, message, ...options }),
        // Thông báo cập nhật trạng thái siêu ngắn gọn chuẩn Linear / Vercel
        statusUpdate: ({ entity, oldStatus, newStatus, message, onUndo }) => {
            return addToast({
                type: 'status',
                entity,
                oldStatus,
                newStatus,
                message,
                duration: 4000,
                onUndo
            });
        },
        showToast: (message, type = 'info', title) =>
            addToast({
                type,
                title: title || (type === 'success' ? (language === 'en' ? 'Success' : 'Thành công') : type === 'error' ? (language === 'en' ? 'Error' : 'Lỗi') : (language === 'en' ? 'Notice' : 'Thông báo')),
                message: typeof message === 'string' ? message : JSON.stringify(message)
            }),
        dismiss: (id) => removeToast(id)
    };

    toast.showToast = toast.showToast;

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <CompactToastContainer toasts={toasts} onRemove={removeToast} language={language} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Màu sắc badge trạng thái ngắn gọn
function getStatusBadgeStyle(status) {
    switch (status) {
        case 'Approved':
        case 'Active':
        case 'Accepted':
        case 'Resolved':
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/60',
                text: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-200 dark:border-emerald-800/80',
                dot: 'bg-emerald-500'
            };
        case 'Pending':
        case 'UnderReview':
        case 'Shortlisted':
            return {
                bg: 'bg-amber-50 dark:bg-amber-950/60',
                text: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-200 dark:border-amber-800/80',
                dot: 'bg-amber-500'
            };
        case 'Rejected':
        case 'Closed':
        case 'Blocked':
        case 'Disabled':
            return {
                bg: 'bg-rose-50 dark:bg-rose-950/60',
                text: 'text-rose-700 dark:text-rose-300',
                border: 'border-rose-200 dark:border-rose-800/80',
                dot: 'bg-rose-500'
            };
        default:
            return {
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-700 dark:text-slate-300',
                border: 'border-slate-200 dark:border-slate-700',
                dot: 'bg-slate-400'
            };
    }
}

// Container danh sách Toast ngắn gọn nổi góc trên bên phải
function CompactToastContainer({ toasts, onRemove, language }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col items-end space-y-2 pointer-events-none max-w-sm sm:max-w-md w-full px-2 sm:px-0"
            role="region"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <CompactToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => onRemove(toast.id)}
                    language={language}
                />
            ))}
        </div>
    );
}

// Thẻ Toast thiết kế siêu ngắn gọn (Single-line Capsule / Pill)
function CompactToastItem({ toast, onClose, language }) {
    const isEn = language === 'en';
    const isStatus = toast.type === 'status';
    const newStyle = toast.newStatus ? getStatusBadgeStyle(toast.newStatus) : null;

    return (
        <div
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border-slate-200/90 dark:border-slate-800 text-xs transition-all duration-200 hover:shadow-xl w-auto max-w-full"
        >
            {/* 1. Icon ngắn gọn */}
            <div className="shrink-0">
                {isStatus ? (
                    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                ) : toast.type === 'success' ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                ) : toast.type === 'error' ? (
                    <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                ) : toast.type === 'warning' ? (
                    <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                        </svg>
                    </div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
                        </svg>
                    </div>
                )}
            </div>

            {/* 2. Nội dung hiển thị dạng 1 dòng ngắn gọn */}
            <div className="flex items-center gap-1.5 flex-wrap min-w-0 pr-1">
                {isStatus ? (
                    <>
                        {toast.entity && (
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[170px] sm:max-w-[220px]">
                                {toast.entity}
                            </span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500 font-bold text-[11px]">→</span>
                        {newStyle && toast.newStatus && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${newStyle.bg} ${newStyle.text} ${newStyle.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${newStyle.dot} animate-pulse`} />
                                <span>{toast.newStatus}</span>
                            </span>
                        )}
                    </>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {toast.title}
                        </span>
                        {toast.message && toast.message !== toast.title && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                    {toast.message}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Nút Hoàn tác (Undo) nhỏ gọn */}
            {toast.onUndo && (
                <button
                    type="button"
                    onClick={() => {
                        toast.onUndo();
                        onClose();
                    }}
                    className="ml-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer transition shrink-0"
                >
                    {isEn ? 'Undo' : 'Hoàn tác'}
                </button>
            )}

            {/* 4. Nút Đóng (X) */}
            <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-0.5"
                title={isEn ? 'Close' : 'Đóng'}
                aria-label="Close"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
