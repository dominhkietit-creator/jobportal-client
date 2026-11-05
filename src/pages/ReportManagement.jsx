import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
    StatusBadge,
    QuickDrawer,
    ConfirmModal,
    SearchIcon,
    TrashIcon,
    Pagination,
    usePagination
} from '../components/admin/AdminCommon';
import RecycleBinModal from '../components/admin/RecycleBinModal';

export default function ReportManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Quick Inspector Drawer
    const [inspectorReport, setInspectorReport] = useState(null);

    // Modals & Recycle Bin
    const [deleteReportId, setDeleteReportId] = useState(null);
    const [removeContentReport, setRemoveContentReport] = useState(null);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [trashReports, setTrashReports] = useState([]);
    const [trashLoading, setTrashLoading] = useState(false);

    const loadReports = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/reports');
            setReports(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách báo cáo:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load reports.' : 'Không thể kết nối máy chủ để tải báo cáo.'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadTrash = async () => {
        setTrashLoading(true);
        try {
            const res = await axiosClient.get('/Admin/reports/trash');
            setTrashReports(res.data);
        } catch (err) {
            console.error('Lỗi tải thùng rác báo cáo:', err);
        } finally {
            setTrashLoading(false);
        }
    };

    const handleRestoreReport = async (rep) => {
        try {
            await axiosClient.post(`/Admin/reports/${rep.id}/restore`);
            toast.success(
                language === 'en' ? 'Restored Successfully' : 'Khôi phục thành công',
                language === 'en' ? `Report #${rep.id} has been restored.` : `Bản ghi báo cáo #${rep.id} đã được khôi phục.`
            );
            await loadReports();
            await loadTrash();
        } catch (err) {
            toast.error(
                language === 'en' ? 'Restore Failed' : 'Khôi phục thất bại',
                language === 'en' ? 'Could not restore this report.' : 'Không thể khôi phục báo cáo này.'
            );
        }
    };

    const handlePermanentDeleteReport = async (rep) => {
        try {
            await axiosClient.delete(`/Admin/reports/${rep.id}/permanent`);
            toast.success(
                language === 'en' ? 'Permanently Deleted' : 'Đã xóa vĩnh viễn',
                language === 'en' ? `Report #${rep.id} was permanently removed.` : `Báo cáo #${rep.id} đã bị xóa vĩnh viễn khỏi thùng rác.`
            );
            await loadTrash();
        } catch (err) {
            toast.error(
                language === 'en' ? 'Action Failed' : 'Thất bại',
                language === 'en' ? 'Could not delete report from trash.' : 'Không thể xóa báo cáo khỏi thùng rác.'
            );
        }
    };

    useEffect(() => {
        loadReports();
        loadTrash();
    }, []);

    const filteredReports = useMemo(() => {
        return reports.filter((r) => {
            const matchSearch =
                !search.trim() ||
                r.targetTitle?.toLowerCase().includes(search.toLowerCase()) ||
                r.reason?.toLowerCase().includes(search.toLowerCase()) ||
                r.details?.toLowerCase().includes(search.toLowerCase()) ||
                r.reporterName?.toLowerCase().includes(search.toLowerCase());

            const matchSeverity = !severityFilter || r.severity === severityFilter;
            const matchStatus = !statusFilter || r.status === statusFilter;

            return matchSearch && matchSeverity && matchStatus;
        });
    }, [reports, search, severityFilter, statusFilter]);

    // Phân trang tự động
    const {
        paginatedItems: pagedReports,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredReports, 10);

    // 1. Cập nhật trạng thái báo cáo (Resolved, Dismissed, Pending)
    const handleUpdateStatus = async (id, newStatus) => {
        const targetReport = reports.find((r) => r.id === id);
        const oldStatus = targetReport?.status;
        try {
            await axiosClient.patch(`/Admin/reports/${id}/status`, { status: newStatus });
            setReports((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
            );
            if (inspectorReport && inspectorReport.id === id) {
                setInspectorReport({ ...inspectorReport, status: newStatus });
            }

            toast.statusUpdate({
                entity: targetReport?.targetTitle || `Report #${id}`,
                oldStatus,
                newStatus,
                onUndo: () => handleUpdateStatus(id, oldStatus)
            });
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Failed' : 'Cập nhật thất bại',
                language === 'en' ? 'Failed to update report status.' : 'Cập nhật trạng thái báo cáo thất bại.'
            );
        }
    };

    // 2. Xóa nội dung không phù hợp liên quan đến báo cáo
    const handleConfirmRemoveContent = async () => {
        if (!removeContentReport) return;
        const rep = removeContentReport;
        try {
            await axiosClient.delete(`/Admin/reports/${rep.id}/content`);
            await loadReports();
            if (inspectorReport && inspectorReport.id === rep.id) {
                setInspectorReport({ ...inspectorReport, status: 'Resolved' });
            }
            toast.success(
                language === 'en' ? 'Content Removed' : 'Đã gỡ bỏ nội dung',
                language === 'en' ? `Offending content for "${rep.targetTitle}" was removed.` : `Đã gỡ bỏ nội dung vi phạm "${rep.targetTitle}" và chuyển trạng thái Đã giải quyết.`
            );
            setRemoveContentReport(null);
        } catch (err) {
            toast.error(
                language === 'en' ? 'Action Error' : 'Lỗi xử lý',
                language === 'en' ? 'Error handling report content.' : 'Lỗi xử lý gỡ nội dung báo cáo.'
            );
        }
    };

    // 3. Xóa báo cáo (chuyển vào thùng rác)
    const handleConfirmDelete = async () => {
        if (!deleteReportId) return;
        const targetId = deleteReportId;
        try {
            await axiosClient.delete(`/Admin/reports/${targetId}`);
            setReports((prev) => prev.filter((r) => r.id !== targetId));
            if (inspectorReport && inspectorReport.id === targetId) {
                setInspectorReport(null);
            }
            loadTrash();
            toast.success(
                language === 'en' ? 'Moved to Recycle Bin' : 'Đã chuyển vào thùng rác',
                language === 'en' ? `Report record #${targetId} moved to trash.` : `Bản ghi báo cáo #${targetId} đã được chuyển vào thùng rác.`
            );
            setDeleteReportId(null);
        } catch (err) {
            toast.error(
                language === 'en' ? 'Delete Error' : 'Lỗi xóa',
                language === 'en' ? 'Error deleting report.' : 'Lỗi xóa bản ghi báo cáo.'
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('title_reports')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_reports')}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsTrashOpen(true);
                        loadTrash();
                    }}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition shadow-xs w-fit active:scale-95"
                    title={t('recycle_bin')}
                >
                    <TrashIcon className="w-4 h-4 text-rose-600" />
                    <span>{t('recycle_bin')}</span>
                    {trashReports.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                            {trashReports.length}
                        </span>
                    )}
                </button>
            </div>

            {/* THANH TÌM KIẾM & BỘ LỌC */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-1 items-center space-x-3 min-w-0">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_report_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Lọc Mức độ */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded text-slate-700 focus:outline-none focus:border-[#2563EB] flex-1 sm:flex-none"
                    >
                        <option value="">{t('col_severity')} ({t('all')})</option>
                        <option value="High">{t('severity_high')} (High)</option>
                        <option value="Medium">{t('severity_medium')} (Medium)</option>
                        <option value="Low">{t('severity_low')} (Low)</option>
                    </select>

                    {/* Lọc Trạng thái */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded text-slate-700 focus:outline-none focus:border-[#2563EB] flex-1 sm:flex-none"
                    >
                        <option value="">{t('filter_all_statuses')}</option>
                        <option value="Pending">{t('status_pending')} (Pending)</option>
                        <option value="Resolved">{t('status_resolved')} (Resolved)</option>
                        <option value="Dismissed">{t('status_dismissed')} (Dismissed)</option>
                    </select>

                    {(search || severityFilter || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setSeverityFilter('');
                                setStatusFilter('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
                        >
                            {t('clear_filter')}
                        </button>
                    )}
                </div>
            </div>

            {/* BẢNG DỮ LIỆU BÁO CÁO */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 bg-white">
                    <div className="text-xs font-semibold text-slate-600">
                        {t('showing')} <strong>{filteredReports.length}</strong> {t('of_label')} <strong>{reports.length}</strong> {t('reports_unit')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {t('click_to_inspect')}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[780px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-10">
                            <tr>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_reported_target')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_reason')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_reporter')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_severity')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_report_date')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        {t('no_matching_records')}
                                    </td>
                                </tr>
                            ) : (
                                pagedReports.map((r) => (
                                    <tr
                                        key={r.id}
                                        onClick={() => setInspectorReport(r)}
                                        className="hover:bg-slate-50 transition cursor-pointer h-14"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="font-semibold text-slate-900 line-clamp-1 hover:text-[#1E40AF]">
                                                {r.targetTitle}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {r.targetType} • ID #{r.targetId}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-800">
                                            <div className="line-clamp-1">{r.reason}</div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-slate-800 font-medium">{r.reporterName}</div>
                                            <div className="text-[10px] text-slate-400">{r.reporterEmail}</div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={r.severity} />
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 tabular-nums">
                                            {new Date(r.reportedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="px-4 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            {/* Nút Xóa nội dung không phù hợp */}
                                            {r.status === 'Pending' && (
                                                <button
                                                    onClick={() => setRemoveContentReport(r)}
                                                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer"
                                                    title={t('remove_content')}
                                                >
                                                    {t('remove_content')}
                                                </button>
                                            )}

                                            {/* Đổi trạng thái */}
                                            <select
                                                value={r.status}
                                                onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                                                className="bg-white border border-slate-300 text-slate-700 text-[11px] font-medium px-2 py-1 rounded cursor-pointer focus:outline-none focus:border-[#2563EB]"
                                            >
                                                <option value="Pending">{t('status_pending')}</option>
                                                <option value="Resolved">{t('status_resolved')}</option>
                                                <option value="Dismissed">{t('status_dismissed')}</option>
                                            </select>

                                            {/* Xóa báo cáo */}
                                            <button
                                                onClick={() => setDeleteReportId(r.id)}
                                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                title={t('delete')}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* THANH PHÂN TRANG */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[10, 20, 50, 100]}
                    itemName={t('reports_unit')}
                />
            </div>

            {/* QUICK INSPECTOR DRAWER */}
            <QuickDrawer
                isOpen={!!inspectorReport}
                onClose={() => setInspectorReport(null)}
                title={`${t('title_reports')} #${inspectorReport?.id}`}
                subtitle={`${t('col_severity')}: ${inspectorReport?.severity} • ${inspectorReport?.targetType}`}
                badge={<StatusBadge status={inspectorReport?.status} />}
                actions={
                    inspectorReport && (
                        <div className="flex items-center space-x-2">
                            {inspectorReport.status === 'Pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setRemoveContentReport(inspectorReport);
                                            setInspectorReport(null);
                                        }}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#e11d48] hover:bg-[#be123c] rounded transition cursor-pointer"
                                    >
                                        {t('remove_content')}
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(inspectorReport.id, 'Resolved')}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer"
                                    >
                                        {t('mark_resolved')}
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(inspectorReport.id, 'Dismissed')}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        {t('dismiss_report')}
                                    </button>
                                </>
                            )}
                        </div>
                    )
                }
            >
                {inspectorReport && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_reported_target')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_job_title')}:</span>
                                <span className="font-bold text-[#1E40AF] text-right">{inspectorReport.targetTitle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_category')}:</span>
                                <span className="font-medium text-slate-800">{inspectorReport.targetType} (ID: #{inspectorReport.targetId})</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_reason_details')}</div>
                            <div className="font-bold text-rose-700 text-sm">{inspectorReport.reason}</div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded border border-slate-200">
                                {inspectorReport.details}
                            </p>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_reporter')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_full_name')}:</span>
                                <span className="font-medium text-slate-800">{inspectorReport.reporterName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_email')}:</span>
                                <span className="font-medium text-slate-800">{inspectorReport.reporterEmail}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_report_date')}:</span>
                                <span className="font-medium text-slate-800">{new Date(inspectorReport.reportedAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </QuickDrawer>

            {/* CONFIRM XÓA NỘI DUNG KHÔNG PHÙ HỢP */}
            <ConfirmModal
                isOpen={!!removeContentReport}
                onClose={() => setRemoveContentReport(null)}
                onConfirm={handleConfirmRemoveContent}
                title={t('modal_remove_report_title')}
                message={`"${removeContentReport?.targetTitle}"`}
                confirmText={t('confirm')}
                isDanger={true}
            />

            {/* CONFIRM XÓA BẢN GHI BÁO CÁO */}
            <ConfirmModal
                isOpen={!!deleteReportId}
                onClose={() => setDeleteReportId(null)}
                onConfirm={handleConfirmDelete}
                title={t('delete')}
                message={t('modal_confirm_title')}
                confirmText={t('delete')}
                isDanger={true}
            />

            {/* RECYCLE BIN MODAL */}
            <RecycleBinModal
                isOpen={isTrashOpen}
                onClose={() => setIsTrashOpen(false)}
                title={language === 'en' ? 'Reports Recycle Bin' : 'Thùng rác báo cáo'}
                items={trashReports}
                loading={trashLoading}
                onRestore={handleRestoreReport}
                onPermanentDelete={handlePermanentDeleteReport}
            />
        </div>
    );
}
