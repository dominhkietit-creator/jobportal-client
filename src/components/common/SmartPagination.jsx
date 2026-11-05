import { useState } from 'react';

/**
 * Component Phân Trang Thông Minh (Smart Pagination)
 * Tối ưu hóa trải nghiệm người dùng khi dữ liệu lớn (hàng trăm/nghìn bản ghi):
 * - Rút gọn số trang thông minh bằng dấu ba chấm (...) khi có nhiều trang
 * - Nút Về trang đầu (<<) và Đến trang cuối (>>)
 * - Lựa chọn số lượng hiển thị mỗi trang (Page Size Selector: 8, 16, 24, 50...)
 * - Ô "Nhảy đến trang" nhanh chóng khi danh sách quá dài
 * - Hiển thị dải số lượng chi tiết "Hiển thị 1 - 8 trong 250 việc làm"
 * - Hỗ trợ đầy đủ Dark mode & Light mode, Responsive trên Mobile/Desktop
 */
export default function SmartPagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'bản ghi',
  className = '',
  showQuickJumper = true,
  showSizeChanger = true
}) {
  const [jumpPageInput, setJumpPageInput] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Khi không có dữ liệu hoặc chỉ có 1 trang và không cần đổi pageSize
  if (totalItems <= 0) return null;

  const startIndex = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Sinh danh sách số trang thông minh
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

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpPageInput('');
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-xs select-none transition-colors ${className}`}
    >
      {/* 1. THỐNG KÊ PHẠM VI DỮ LIỆU & CHỌN SỐ LƯỢNG MỖI TRANG */}
      <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
        <span className="font-medium">
          Hiển thị{' '}
          <strong className="text-slate-900 dark:text-white tabular-nums font-bold">
            {startIndex} - {endIndex}
          </strong>{' '}
          trong tổng số{' '}
          <strong className="text-slate-900 dark:text-white tabular-nums font-bold">
            {totalItems}
          </strong>{' '}
          {itemName}
        </span>

        {showSizeChanger && onPageSizeChange && pageSizeOptions?.length > 1 && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Số dòng/trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. CÁC NÚT ĐIỀU HƯỚNG TRANG & Ô NHẢY TRANG */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Nút Về trang đầu (<<) */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="Trang đầu tiên"
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">first_page</span>
        </button>

        {/* Nút Trang trước (<) */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Trang trước"
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>

        {/* Danh sách các số trang thông minh */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === 'left-ellipsis' || p === 'right-ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-slate-400 font-bold select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#006A61] to-[#004D40] text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Nút Trang kế tiếp (>) */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Trang sau"
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>

        {/* Nút Đến trang cuối (>>) */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối cùng"
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">last_page</span>
        </button>

        {/* 3. Ô NHẢY NHANH ĐẾN TRANG BẤT KỲ KHI DỮ LIỆU CÓ NHIỀU TRANG */}
        {showQuickJumper && totalPages > 5 && (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Đến:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={`${currentPage}`}
              className="w-12 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!jumpPageInput}
              className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold text-[11px] disabled:opacity-30 cursor-pointer transition"
            >
              Đi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
