import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrashIcon, XIcon, CheckIcon } from './AdminCommon';

export const RestoreIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

export default function RecycleBinModal({
    isOpen,
    onClose,
    title,
    items = [],
    loading = false,
    onRestore,
    onPermanentDelete,
    renderItem
}) {
    const { t, language } = useLanguage();
    const isEn = language === 'en';
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [itemToPermanentDelete, setItemToPermanentDelete] = useState(null);

    if (!isOpen) return null;

    const handleRestoreClick = async (item) => {
        setActionLoadingId(item.id || item.Name || 'action');
        try {
            await onRestore(item);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden transition-all">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <TrashIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{title || t('recycle_bin')}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
                                    {items.length}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {t('trash_modal_desc')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <RestoreIcon className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                            <span className="text-xs">{t('loading')}</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-3 text-slate-400">
                                <TrashIcon className="w-7 h-7" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('empty_trash')}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {isEn ? 'No deleted items found.' : 'Không có mục nào trong thùng rác.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                            {items.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                                >
                                    <div className="min-w-0 flex-1">
                                        {renderItem ? (
                                            renderItem(item)
                                        ) : (
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                    {item.title || item.name || item.Title || item.Name || `#${item.id}`}
                                                </h4>
                                                {(item.companyName || item.categoryName || item.targetType) && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {item.companyName && <span>{item.companyName} • </span>}
                                                        {item.categoryName && <span>{item.categoryName} • </span>}
                                                        {item.targetType && <span>{item.targetType}</span>}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreClick(item)}
                                            disabled={actionLoadingId === (item.id || item.Name)}
                                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer active:scale-95 disabled:opacity-50"
                                        >
                                            <RestoreIcon className={`w-3.5 h-3.5 ${actionLoadingId === (item.id || item.Name) ? 'animate-spin' : ''}`} />
                                            <span>{t('restore')}</span>
                                        </button>

                                        {onPermanentDelete && (
                                            <button
                                                type="button"
                                                onClick={() => setItemToPermanentDelete(item)}
                                                disabled={actionLoadingId === (item.id || item.Name)}
                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition cursor-pointer active:scale-95 disabled:opacity-50"
                                                title={t('permanent_delete')}
                                            >
                                                <TrashIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                                <span>{t('permanent_delete')}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                        {isEn ? `${items.length} items in recycle bin` : `${items.length} mục trong thùng rác`}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer transition shadow-xs"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>

            {/* THIẾT KẾ LẠI THÔNG BÁO XÁC NHẬN XÓA VĨNH VIỄN HIỆN ĐẠI */}
            {itemToPermanentDelete && (
                <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/80 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all">
                        {/* Warning Icon with layered glow */}
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 ring-8 ring-rose-50 dark:ring-rose-950/40 shadow-xs">
                            <TrashIcon className="w-7 h-7" />
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {t('modal_permanent_delete_title')}
                        </h3>

                        {/* Item Card Box */}
                        <div className="mt-3.5 p-3.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-left">
                            <p className="text-xs font-semibold text-rose-900 dark:text-rose-200 line-clamp-2">
                                {itemToPermanentDelete.title || itemToPermanentDelete.name || itemToPermanentDelete.Title || itemToPermanentDelete.Name || `#${itemToPermanentDelete.id}`}
                            </p>
                            {(itemToPermanentDelete.companyName || itemToPermanentDelete.categoryName || itemToPermanentDelete.targetType) && (
                                <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-1">
                                    {itemToPermanentDelete.companyName && <span>{itemToPermanentDelete.companyName} • </span>}
                                    {itemToPermanentDelete.categoryName && <span>{itemToPermanentDelete.categoryName} • </span>}
                                    {itemToPermanentDelete.targetType && <span>{itemToPermanentDelete.targetType}</span>}
                                </p>
                            )}
                        </div>

                        {/* Warning message */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3.5 leading-relaxed">
                            {t('modal_permanent_delete_msg')}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-6 flex items-center justify-center space-x-3">
                            <button
                                type="button"
                                onClick={() => setItemToPermanentDelete(null)}
                                disabled={actionLoadingId !== null}
                                className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition cursor-pointer"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const target = itemToPermanentDelete;
                                    setActionLoadingId(target.id || target.Name || 'permanent');
                                    try {
                                        await onPermanentDelete(target);
                                        setItemToPermanentDelete(null);
                                    } finally {
                                        setActionLoadingId(null);
                                    }
                                }}
                                disabled={actionLoadingId !== null}
                                className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 rounded-xl shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                                {actionLoadingId ? (
                                    <RestoreIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                    <TrashIcon className="w-4 h-4" />
                                )}
                                <span>{t('modal_permanent_delete_confirm')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
