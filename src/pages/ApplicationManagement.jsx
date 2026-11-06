import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
    StatusBadge,
    QuickDrawer,
    SearchIcon,
    ExternalLinkIcon,
    Pagination,
    usePagination
} from '../components/admin/AdminCommon';

export default function ApplicationManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Quick Inspector Drawer
    const [inspectorApp, setInspectorApp] = useState(null);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/applications');
            setApplications(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách hồ sơ ứng tuyển:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load applications.' : 'Không thể kết nối máy chủ để tải hồ sơ ứng tuyển.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const filteredApplications = useMemo(() => {
        return applications.filter((a) => {
            const matchSearch =
                !search.trim() ||
                a.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
                a.candidateEmail?.toLowerCase().includes(search.toLowerCase()) ||
                a.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
                a.companyName?.toLowerCase().includes(search.toLowerCase());

            const matchStatus = !statusFilter || a.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [applications, search, statusFilter]);

    // Phân trang tự động
    const {
        paginatedItems: pagedApplications,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredApplications, 10);

    // Cập nhật trạng thái ứng tuyển
    const handleUpdateStatus = async (id, newStatus) => {
        const targetApp = applications.find((a) => a.id === id);
        const oldStatus = targetApp?.status;
        try {
            await axiosClient.patch(`/Admin/applications/${id}/status`, { status: newStatus });
            setApplications((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
            );
            if (inspectorApp && inspectorApp.id === id) {
                setInspectorApp({ ...inspectorApp, status: newStatus });
            }

            toast.statusUpdate({
                entity: `${targetApp?.candidateName || 'Candidate'} - ${targetApp?.jobTitle || 'Job'}`,
                oldStatus,
                newStatus,
                onUndo: () => handleUpdateStatus(id, oldStatus)
            });
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Failed' : 'Cập nhật thất bại',
                language === 'en' ? 'Failed to update application status.' : 'Cập nhật trạng thái hồ sơ thất bại.'
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('title_applications')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_applications')}
                    </p>
                </div>
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
                            placeholder={t('search_application_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded text-slate-700 focus:outline-none focus:border-[#2563EB] flex-1 sm:flex-none"
                    >
                        <option value="">{t('filter_all_statuses')}</option>
                        <option value="Pending">{t('status_pending')} (Pending)</option>
                        <option value="Shortlisted">{t('status_shortlisted')} (Shortlisted)</option>
                        <option value="Accepted">{t('status_accepted')} (Accepted)</option>
                        <option value="Rejected">{t('status_rejected')} (Rejected)</option>
                    </select>

                    {(search || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
                        >
                            {t('clear_filter')}
                        </button>
                    )}
                </div>
            </div>

            {/* BẢNG DỮ LIỆU HỒ SƠ ỨNG TUYỂN */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 bg-white">
                    <div className="text-xs font-semibold text-slate-600">
                        {t('showing')} <strong>{filteredApplications.length}</strong> {t('of_label')} <strong>{applications.length}</strong> {t('applications_unit')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {t('click_to_inspect')}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[780px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-10">
                            <tr>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px]">hồ sơ ứng tuyển</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_applied_position')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_enterprise')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_applied_at')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_cv')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        {t('no_matching_records')}
                                    </td>
                                </tr>
                            ) : (
                                pagedApplications.map((app) => (
                                    <tr
                                        key={app.id}
                                        onClick={() => setInspectorApp(app)}
                                        className="hover:bg-slate-50 transition cursor-pointer h-14"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="font-semibold text-slate-900 line-clamp-1 hover:text-[#1E40AF]">
                                                {app.candidateName}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{app.candidateEmail}</div>
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-800">
                                            <div className="line-clamp-1">{app.jobTitle}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">Job #{app.jobId}</div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 font-medium">
                                            {app.companyName}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 tabular-nums">
                                            {new Date(app.appliedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                                        </td>
                                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            {app.cvFileUrl ? (
                                                <a
                                                    href={`https://nato-feat-petersburg-runtime.trycloudflare.com${app.cvFileUrl}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-[#1E40AF] hover:text-white text-slate-700 font-semibold text-[11px] transition"
                                                >
                                                    <span>{t('view_cv')}</span>
                                                    <ExternalLinkIcon className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">{t('no_cv')}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                className="bg-white border border-slate-300 text-slate-700 text-[11px] font-medium px-2 py-1 rounded cursor-pointer focus:outline-none focus:border-[#2563EB]"
                                            >
                                                <option value="Pending">{t('status_pending')}</option>
                                                <option value="Shortlisted">{t('status_shortlisted')}</option>
                                                <option value="Accepted">{t('status_accepted')}</option>
                                                <option value="Rejected">{t('status_rejected')}</option>
                                            </select>
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
                    itemName={t('applications_unit')}
                />
            </div>

            {/* QUICK INSPECTOR DRAWER CHO HỒ SƠ ỨNG TUYỂN */}
            <QuickDrawer
                isOpen={!!inspectorApp}
                onClose={() => setInspectorApp(null)}
                title={t('nav_applications')}
                subtitle={`#${inspectorApp?.id}`}
                badge={<StatusBadge status={inspectorApp?.status} />}
                actions={
                    inspectorApp && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleUpdateStatus(inspectorApp.id, 'Shortlisted')}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition cursor-pointer"
                            >
                                {t('status_shortlisted')}
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(inspectorApp.id, 'Accepted')}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer"
                            >
                                {t('status_accepted')}
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(inspectorApp.id, 'Rejected')}
                                className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer"
                            >
                                {t('status_rejected')}
                            </button>
                        </div>
                    )
                }
            >
                {inspectorApp && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_candidate')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_full_name')}:</span>
                                <span className="font-bold text-slate-900">{inspectorApp.candidateName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_email')}:</span>
                                <span className="font-semibold text-slate-900">{inspectorApp.candidateEmail}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_phone')}:</span>
                                <span className="font-medium text-slate-800">{inspectorApp.candidatePhone || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_applied_position')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_job_title')}:</span>
                                <span className="font-bold text-[#1E40AF]">{inspectorApp.jobTitle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_enterprise')}:</span>
                                <span className="font-medium text-slate-800">{inspectorApp.companyName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_applied_at')}:</span>
                                <span className="font-medium text-slate-800">
                                    {new Date(inspectorApp.appliedAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-3">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_cv')}</div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div>
                                    <div className="font-bold text-slate-800">{inspectorApp.cvTitle || (language === 'en' ? 'Attached Resume' : 'Bản CV chuẩn')}</div>
                                    <div className="text-[10px] text-slate-400">PDF / DOCX</div>
                                </div>
                                {inspectorApp.cvFileUrl ? (
                                    <a
                                        href={`https://nato-feat-petersburg-runtime.trycloudflare.com${inspectorApp.cvFileUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition inline-flex items-center space-x-1"
                                    >
                                        <span>{t('view_cv')}</span>
                                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                                    </a>
                                ) : (
                                    <span className="text-slate-400">{t('no_cv')}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </QuickDrawer>
        </div>
    );
}
