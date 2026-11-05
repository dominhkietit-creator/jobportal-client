import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// --- BỘ ICON SVG CHUẨN TALENTOS ENTERPRISE ---
export const SearchIcon = ({ className = "w-4 h-4 text-slate-400" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const PlusIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

export const EditIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

export const TrashIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const CheckIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const XIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const EyeIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const LockIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export const UnlockIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
);

export const RefreshIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

export const AlertTriangleIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export const BuildingIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const ExternalLinkIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

// --- STATUS BADGE CHUẨN DESIGN.MD ---
// - Success: Soft surface #ECFDF5, text #059669, border #A7F3D0
// - Warning: Soft surface #FFFBEB, text #D97706, border #FDE68A
// - Danger: Soft surface #FFF1F2, text #E11D48, border #FECDD3
// - Info: Soft surface #F0F9FF, text #0284C7, border #BAE6FD
export function StatusBadge({ status, customLabel }) {
    const { t } = useLanguage();
    let bg = 'bg-slate-100';
    let text = 'text-slate-700';
    let border = 'border-slate-200';
    let label = customLabel || status;

    switch (status) {
        case 'Approved':
        case 'Active':
        case 'Accepted':
        case 'Hired':
            bg = 'bg-[#ecfdf5]';
            text = 'text-[#059669]';
            border = 'border-[#a7f3d0]';
            label = customLabel || (status === 'Approved' ? t('status_approved') : status === 'Active' ? t('status_active') : t('status_accepted'));
            break;

        case 'Pending':
        case 'UnderReview':
        case 'Shortlisted':
            bg = 'bg-[#fffbeb]';
            text = 'text-[#d97706]';
            border = 'border-[#fde68a]';
            label = customLabel || (status === 'Pending' ? t('status_pending') : status === 'Shortlisted' ? t('status_shortlisted') : t('under_review'));
            break;

        case 'Rejected':
        case 'Closed':
        case 'Blocked':
        case 'Disabled':
            bg = 'bg-[#fff1f2]';
            text = 'text-[#e11d48]';
            border = 'border-[#fecdd3]';
            label = customLabel || (status === 'Rejected' ? t('status_rejected') : status === 'Closed' ? t('status_closed') : t('status_locked'));
            break;

        case 'Resolved':
            bg = 'bg-[#ecfdf5]';
            text = 'text-[#059669]';
            border = 'border-[#a7f3d0]';
            label = customLabel || t('status_resolved');
            break;

        case 'Dismissed':
            bg = 'bg-slate-100';
            text = 'text-slate-600';
            border = 'border-slate-200';
            label = customLabel || t('status_dismissed');
            break;

        case 'High':
            bg = 'bg-[#fff1f2]';
            text = 'text-[#e11d48]';
            border = 'border-[#fecdd3]';
            label = customLabel || t('severity_high');
            break;

        case 'Medium':
            bg = 'bg-[#fffbeb]';
            text = 'text-[#d97706]';
            border = 'border-[#fde68a]';
            label = customLabel || t('severity_medium');
            break;

        case 'Low':
            bg = 'bg-[#f0f9ff]';
            text = 'text-[#0284c7]';
            border = 'border-[#bae6fd]';
            label = customLabel || t('severity_low');
            break;

        default:
            bg = 'bg-slate-100';
            text = 'text-slate-600';
            border = 'border-slate-200';
            label = customLabel || status;
            break;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${bg} ${text} ${border} whitespace-nowrap`}>
            {label}
        </span>
    );
}

// --- QUICK INSPECTOR DRAWER (420px SLIDE-OUT DOCKED RIGHT) ---
// Tiêu chuẩn DESIGN.md: Candidate Quick Inspector Drawer (420px, docked right, level 3 elevation, responsive reflow)
export function QuickDrawer({ isOpen, onClose, title, subtitle, badge, children, actions }) {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Scrim */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
                <div className="w-screen max-w-full sm:max-w-[440px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transform transition ease-in-out duration-300">
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">{title}</h3>
                                {badge}
                            </div>
                            {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                            title={t('close_esc')}
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/50">
                        {children}
                    </div>

                    {/* Footer Actions */}
                    {actions && (
                        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- CONFIRM MODAL POPUP ---
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isDanger = false }) {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 transform transition-all mx-auto">
                <div className="flex items-start space-x-3.5">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-[#1e40af]'}`}>
                        <AlertTriangleIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm">{title || t('modal_confirm_title')}</h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="mt-5 sm:mt-6 flex items-center justify-end space-x-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition"
                    >
                        {cancelText || t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded cursor-pointer text-white transition ${isDanger
                            ? 'bg-[#e11d48] hover:bg-[#be123c]'
                            : 'bg-[#1e40af] hover:bg-[#1e3a8a]'
                            }`}
                    >
                        {confirmText || t('confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- EXPORT PHÂN TRANG CHUẨN TALENTOS ---
export { default as Pagination, usePagination } from './Pagination';
