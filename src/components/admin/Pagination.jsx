import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Custom hook quản lý phân trang đồng bộ và mượt mà cho mọi danh sách dữ liệu.
 * Tự động điều chỉnh trang hiện tại khi dữ liệu tìm kiếm hoặc bộ lọc thay đổi.
 */
export function usePagination(items = [], initialPageSize = 10) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const totalItems = items?.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Đặt lại về trang 1 khi danh sách dữ liệu thay đổi số lượng hoặc lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [totalItems]);

    // Đảm bảo currentPage không vượt quá totalPages nếu dữ liệu bị co lại
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const paginatedItems = useMemo(() => {
        if (!items || items.length === 0) return [];
        return items.slice(startIndex, endIndex);
    }, [items, startIndex, endIndex]);

    const handleSetPageSize = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    return {
        currentPage: safePage,
        pageSize,
        totalPages,
        totalItems,
        startIndex,
        endIndex,
        paginatedItems,
        setCurrentPage,
        setPageSize: handleSetPageSize,
        goToPage: (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages)),
        nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
        prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1))
    };
}

/**
 * Component Phân trang chuẩn TalentOS Enterprise
 * Hỗ trợ song ngữ (VI / EN), Dark/Light theme, tùy chọn số dòng/trang, responsive trên mobile/tablet.
 */
export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    itemName = ''
}) {
    const { t, language } = useLanguage();

    if (totalItems === 0) return null;

    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    // Tính toán dải số trang cần hiển thị (ví dụ: 1 ... 4 5 6 ... 12)
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const showLeftEllipsis = currentPage > 4;
        const showRightEllipsis = currentPage < totalPages - 3;

        pages.push(1);

        if (showLeftEllipsis) {
            pages.push('left-ellipsis');
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        if (showRightEllipsis) {
            pages.push('right-ellipsis');
        }

        if (!pages.includes(totalPages)) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none transition-colors">
            {/* THỐNG KÊ SỐ LƯỢNG & SỐ DÒNG/TRANG */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-600 dark:text-slate-400">
                <span className="font-normal">
                    {t('pagination_showing')}{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {startIndex}
                    </strong>{' '}
                    {t('pagination_to')}{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {endIndex}
                    </strong>{' '}
                    {t('pagination_of')}{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {totalItems}
                    </strong>{' '}
                    {itemName || t('pagination_items')}
                </span>

                {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 1 && (
                    <div className="inline-flex items-center space-x-1.5 ml-1 pl-2.5 border-l border-slate-200 dark:border-slate-700">
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {t('pagination_per_page')}
                        </label>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / {language === 'en' ? 'page' : 'trang'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* BỘ NÚT ĐIỀU HƯỚNG TRANG */}
            <div className="flex items-center space-x-1">
                {/* Trang đầu */}
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage <= 1}
                    title={language === 'en' ? 'First page' : 'Trang đầu'}
                    className={`h-7 w-7 flex items-center justify-center rounded border text-xs transition cursor-pointer ${
                        currentPage <= 1
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>

                {/* Trang trước */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    title={t('pagination_prev')}
                    className={`h-7 px-2 flex items-center space-x-1 rounded border text-xs font-medium transition cursor-pointer ${
                        currentPage <= 1
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">{t('pagination_prev')}</span>
                </button>

                {/* Các số trang */}
                <div className="flex items-center space-x-1">
                    {pages.map((p, idx) => {
                        if (p === 'left-ellipsis' || p === 'right-ellipsis') {
                            return (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="h-7 w-7 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold"
                                >
                                    …
                                </span>
                            );
                        }

                        const isActive = p === currentPage;
                        return (
                            <button
                                key={`page-${p}`}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`h-7 min-w-[28px] px-2 flex items-center justify-center rounded text-xs font-medium tabular-nums transition cursor-pointer ${
                                    isActive
                                        ? 'bg-[#1e40af] dark:bg-blue-600 text-white font-semibold shadow-xs border border-transparent'
                                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Trang sau */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    title={t('pagination_next')}
                    className={`h-7 px-2 flex items-center space-x-1 rounded border text-xs font-medium transition cursor-pointer ${
                        currentPage >= totalPages
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                    }`}
                >
                    <span className="hidden sm:inline">{t('pagination_next')}</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Trang cuối */}
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                    title={language === 'en' ? 'Last page' : 'Trang cuối'}
                    className={`h-7 w-7 flex items-center justify-center rounded border text-xs transition cursor-pointer ${
                        currentPage >= totalPages
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
