import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
    StatusBadge,
    QuickDrawer,
    ConfirmModal,
    SearchIcon,
    EditIcon,
    TrashIcon,
    CheckIcon,
    XIcon,
    Pagination,
    usePagination
} from '../components/admin/AdminCommon';
import RecycleBinModal from '../components/admin/RecycleBinModal';

export default function JobManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Selected job for quick inspector drawer
    const [inspectorJob, setInspectorJob] = useState(null);

    // Edit modal
    const [editJob, setEditJob] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        categoryId: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        jobType: 'FullTime',
        status: 'Active',
        description: '',
        requirements: ''
    });

    // Delete confirm modal & Recycle Bin
    const [deleteJobId, setDeleteJobId] = useState(null);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [trashJobs, setTrashJobs] = useState([]);
    const [trashLoading, setTrashLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [jobsRes, catRes] = await Promise.all([
                axiosClient.get('/Admin/jobs'),
                axiosClient.get('/Admin/categories')
            ]);
            setJobs(jobsRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error('Lỗi tải danh sách việc làm:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load jobs from server.' : 'Không thể kết nối máy chủ để tải việc làm.'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadTrash = async () => {
        setTrashLoading(true);
        try {
            const res = await axiosClient.get('/Admin/jobs/trash');
            setTrashJobs(res.data);
        } catch (err) {
            console.error('Lỗi tải thùng rác:', err);
        } finally {
            setTrashLoading(false);
        }
    };

    const handleRestoreJob = async (job) => {
        try {
            await axiosClient.post(`/Admin/jobs/${job.id}/restore`);
            toast.success(
                language === 'en' ? 'Restored Successfully' : 'Khôi phục thành công',
                language === 'en' ? `Job "${job.title}" has been restored.` : `Tin tuyển dụng "${job.title}" đã được khôi phục thành công.`
            );
            await loadData();
            await loadTrash();
        } catch (err) {
            toast.error(
                language === 'en' ? 'Restore Failed' : 'Khôi phục thất bại',
                language === 'en' ? 'Could not restore this job.' : 'Không thể khôi phục tin tuyển dụng này.'
            );
        }
    };

    const handlePermanentDeleteJob = async (job) => {
        try {
            await axiosClient.delete(`/Admin/jobs/${job.id}/permanent`);
            toast.success(
                language === 'en' ? 'Permanently Deleted' : 'Đã xóa vĩnh viễn',
                language === 'en' ? `Job #${job.id} was permanently removed.` : `Tin tuyển dụng #${job.id} đã bị xóa vĩnh viễn khỏi hệ thống.`
            );
            await loadTrash();
        } catch (err) {
            toast.error(
                language === 'en' ? 'Action Failed' : 'Thất bại',
                language === 'en' ? 'Could not permanently delete job.' : 'Không thể xóa vĩnh viễn tin tuyển dụng này.'
            );
        }
    };

    useEffect(() => {
        loadData();
        loadTrash();
    }, []);

    useEffect(() => {
        const q = searchParams.get('search') || searchParams.get('q');
        if (q !== null) {
            setSearch(q);
        }
    }, [searchParams]);

    // Lọc danh sách việc làm
    const filteredJobs = useMemo(() => {
        return jobs.filter((j) => {
            const matchSearch =
                !search.trim() ||
                j.title?.toLowerCase().includes(search.toLowerCase()) ||
                j.companyName?.toLowerCase().includes(search.toLowerCase()) ||
                j.location?.toLowerCase().includes(search.toLowerCase());

            const matchCat = !categoryFilter || j.categoryId.toString() === categoryFilter;
            const matchStatus = !statusFilter || j.status === statusFilter;

            return matchSearch && matchCat && matchStatus;
        });
    }, [jobs, search, categoryFilter, statusFilter]);

    // Phân trang tự động
    const {
        paginatedItems: pagedJobs,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredJobs, 10);

    // 1. Duyệt / Thay đổi trạng thái
    const handleUpdateStatus = async (id, newStatus) => {
        const targetJob = jobs.find((j) => j.id === id);
        const oldStatus = targetJob?.status;
        try {
            await axiosClient.patch(`/Admin/jobs/${id}/status`, { status: newStatus });
            setJobs((prev) =>
                prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
            );
            if (inspectorJob && inspectorJob.id === id) {
                setInspectorJob({ ...inspectorJob, status: newStatus });
            }

            // Toast hiện đại thông báo cập nhật trạng thái kèm Undo
            toast.statusUpdate({
                entity: targetJob?.title || `Job #${id}`,
                oldStatus,
                newStatus,
                onUndo: () => handleUpdateStatus(id, oldStatus)
            });
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Failed' : 'Cập nhật thất bại',
                language === 'en' ? 'Could not update job posting status.' : 'Không thể cập nhật trạng thái tin tuyển dụng.'
            );
        }
    };

    // 2. Mở modal sửa việc làm
    const handleOpenEdit = (job) => {
        setEditJob(job);
        setEditForm({
            title: job.title || '',
            categoryId: job.categoryId || (categories[0]?.id || ''),
            location: job.location || '',
            salaryMin: job.salaryMin || 0,
            salaryMax: job.salaryMax || 0,
            jobType: job.jobType || 'FullTime',
            status: job.status || 'Active',
            description: job.description || '',
            requirements: job.requirements || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put(`/Admin/jobs/${editJob.id}`, {
                ...editForm,
                categoryId: Number(editForm.categoryId),
                salaryMin: Number(editForm.salaryMin),
                salaryMax: Number(editForm.salaryMax)
            });
            await loadData();
            setEditJob(null);
            toast.success(
                language === 'en' ? 'Job Updated' : 'Cập nhật thành công',
                language === 'en' ? `Job #${editJob.id} has been saved.` : `Tin tuyển dụng #${editJob.id} đã được lưu thành công.`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Error' : 'Lỗi cập nhật',
                language === 'en' ? 'Error updating job posting.' : 'Không thể lưu thông tin tin tuyển dụng.'
            );
        }
    };

    // 3. Xóa việc làm (chuyển vào thùng rác)
    const handleConfirmDelete = async () => {
        if (!deleteJobId) return;
        const targetId = deleteJobId;
        try {
            await axiosClient.delete(`/Admin/jobs/${targetId}`);
            setJobs((prev) => prev.filter((j) => j.id !== targetId));
            if (inspectorJob && inspectorJob.id === targetId) {
                setInspectorJob(null);
            }
            loadTrash();
            toast.success(
                language === 'en' ? 'Moved to Recycle Bin' : 'Đã chuyển vào thùng rác',
                language === 'en' ? `Job #${targetId} moved to trash. You can restore it anytime.` : `Tin tuyển dụng #${targetId} đã được chuyển vào thùng rác. Bạn có thể khôi phục lại bất kỳ lúc nào.`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Delete Failed' : 'Xóa thất bại',
                language === 'en' ? 'Failed to delete job posting.' : 'Không thể xóa tin tuyển dụng này.'
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ TRANG */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title_jobs')}</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {t('sub_jobs')}
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
                    {trashJobs.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                            {trashJobs.length}
                        </span>
                    )}
                </button>
            </div>

            {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-1 items-center space-x-3 min-w-0">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_job_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-8 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                title={t('reset')}
                            >
                                <XIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Lọc danh mục */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded text-slate-700 focus:outline-none focus:border-[#2563EB] flex-1 sm:flex-none"
                    >
                        <option value="">{t('filter_all_categories')} ({categories.length})</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.jobsCount || 0})
                            </option>
                        ))}
                    </select>

                    {/* Lọc trạng thái */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded text-slate-700 focus:outline-none focus:border-[#2563EB] flex-1 sm:flex-none"
                    >
                        <option value="">{t('filter_all_statuses')}</option>
                        <option value="Approved">{t('status_approved')} (Approved)</option>
                        <option value="Pending">{t('status_pending')} (Pending)</option>
                        <option value="Rejected">{t('status_rejected')} (Rejected)</option>
                        <option value="Closed">{t('status_closed')} (Closed)</option>
                    </select>

                    {(search || categoryFilter || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setCategoryFilter('');
                                setStatusFilter('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
                        >
                            {t('clear_filter')}
                        </button>
                    )}
                </div>
            </div>

            {/* BẢNG DỮ LIỆU VIỆC LÀM */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 bg-white">
                    <div className="text-xs font-semibold text-slate-600">
                        {t('showing')} <strong>{filteredJobs.length}</strong> {t('of_label')} <strong>{jobs.length}</strong> {t('jobs_unit')}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>{t('click_to_inspect')}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[720px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-10">
                            <tr>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_job_company')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_enterprise')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_location')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_salary')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_applied_count')}</th>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        {t('no_matching_records')}
                                    </td>
                                </tr>
                            ) : (
                                pagedJobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-slate-50 transition cursor-pointer h-14"
                                        onClick={() => setInspectorJob(job)}
                                    >
                                        <td className="px-4 py-2.5 font-medium text-slate-900">
                                            <div className="font-semibold text-slate-900 line-clamp-1 hover:text-[#1E40AF]">
                                                {job.title}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                #{job.id} • {job.categoryName} • {job.jobType || 'FullTime'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                                            {job.companyName}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500">
                                            {job.location || (language === 'en' ? 'Nationwide' : 'Toàn quốc')}
                                        </td>
                                        <td className="px-3 py-2.5 font-semibold text-slate-900 tabular-nums">
                                            {job.salaryMin || job.salaryMax
                                                ? `${(job.salaryMin / 1000000).toFixed(0)} - ${(job.salaryMax / 1000000).toFixed(0)} ${t('million_vnd')}`
                                                : t('salary_negotiable')}
                                        </td>
                                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center space-x-1.5">
                                                <StatusBadge status={job.status} />
                                                <select
                                                    value={job.status}
                                                    onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                                                    className="bg-transparent text-[11px] text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-300 rounded px-1 py-0.5 cursor-pointer"
                                                >
                                                    <option value="Approved">{t('status_approved')}</option>
                                                    <option value="Pending">{t('status_pending')}</option>
                                                    <option value="Rejected">{t('status_rejected')}</option>
                                                    <option value="Closed">{t('status_closed')}</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 font-medium tabular-nums">
                                            {job.applicationsCount || 0} {t('applications_unit')}
                                        </td>
                                        <td className="px-4 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            {job.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(job.id, 'Approved')}
                                                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition"
                                                    title={t('approve')}
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleOpenEdit(job)}
                                                className="p-1 rounded text-slate-600 hover:text-[#1E40AF] hover:bg-slate-100 transition cursor-pointer"
                                                title={t('edit')}
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => setDeleteJobId(job.id)}
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
                    itemName={t('jobs_unit')}
                />
            </div>

            {/* QUICK INSPECTOR DRAWER XEM CHI TIẾT VIỆC LÀM */}
            <QuickDrawer
                isOpen={!!inspectorJob}
                onClose={() => setInspectorJob(null)}
                title={inspectorJob?.title || t('drawer_title')}
                subtitle={`#${inspectorJob?.id} • ${inspectorJob?.companyName}`}
                badge={<StatusBadge status={inspectorJob?.status} />}
                actions={
                    inspectorJob && (
                        <>
                            {inspectorJob.status !== 'Approved' && (
                                <button
                                    onClick={() => handleUpdateStatus(inspectorJob.id, 'Approved')}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer"
                                >
                                    {t('approve')}
                                </button>
                            )}
                            <button
                                onClick={() => handleOpenEdit(inspectorJob)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
                            >
                                {t('edit_profile')}
                            </button>
                        </>
                    )
                }
            >
                {inspectorJob && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('drawer_title')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_salary')}:</span>
                                <span className="font-bold text-[#1E40AF]">
                                    {inspectorJob.salaryMin || inspectorJob.salaryMax
                                        ? `${(inspectorJob.salaryMin / 1000000).toFixed(0)} - ${(inspectorJob.salaryMax / 1000000).toFixed(0)} ${t('million_vnd')}`
                                        : t('salary_negotiable')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_location')}:</span>
                                <span className="font-medium text-slate-800">{inspectorJob.location || (language === 'en' ? 'Nationwide' : 'Toàn quốc')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_category')}:</span>
                                <span className="font-medium text-slate-800">{inspectorJob.categoryName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_job_type')}:</span>
                                <span className="font-medium text-slate-800">{inspectorJob.jobType || 'Full-time'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_employer_name')}:</span>
                                <span className="font-medium text-slate-800">{inspectorJob.employerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_created_at')}:</span>
                                <span className="font-medium text-slate-800">{new Date(inspectorJob.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}</span>
                            </div>
                        </div>

                        {inspectorJob.description && (
                            <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">{t('field_description')}</div>
                                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{inspectorJob.description}</p>
                            </div>
                        )}

                        {inspectorJob.requirements && (
                            <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">{t('field_requirements')}</div>
                                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{inspectorJob.requirements}</p>
                            </div>
                        )}
                    </div>
                )}
            </QuickDrawer>

            {/* MODAL CHỈNH SỬA VIỆC LÀM */}
            {editJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">{t('modal_edit_job_title')} #{editJob.id}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{editJob.companyName}</p>
                            </div>
                            <button
                                onClick={() => setEditJob(null)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_job_title')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('field_category')}</label>
                                    <select
                                        value={editForm.categoryId}
                                        onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('field_location')}</label>
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('field_salary_min')}</label>
                                    <input
                                        type="number"
                                        value={editForm.salaryMin}
                                        onChange={(e) => setEditForm({ ...editForm, salaryMin: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('field_salary_max')}</label>
                                    <input
                                        type="number"
                                        value={editForm.salaryMax}
                                        onChange={(e) => setEditForm({ ...editForm, salaryMax: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('field_job_type')}</label>
                                    <select
                                        value={editForm.jobType}
                                        onChange={(e) => setEditForm({ ...editForm, jobType: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    >
                                        <option value="FullTime">FullTime</option>
                                        <option value="PartTime">PartTime</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('col_status')}</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    >
                                        <option value="Approved">{t('status_approved')}</option>
                                        <option value="Pending">{t('status_pending')}</option>
                                        <option value="Rejected">{t('status_rejected')}</option>
                                        <option value="Closed">{t('status_closed')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_description')}</label>
                                <textarea
                                    rows={4}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_requirements')}</label>
                                <textarea
                                    rows={3}
                                    value={editForm.requirements}
                                    onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2.5">
                                <button
                                    type="button"
                                    onClick={() => setEditJob(null)}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded cursor-pointer transition shadow-xs"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL */}
            <ConfirmModal
                isOpen={!!deleteJobId}
                onClose={() => setDeleteJobId(null)}
                onConfirm={handleConfirmDelete}
                title={t('modal_delete_job_title')}
                message={t('modal_delete_job_msg')}
                confirmText={t('modal_delete_job_confirm')}
                isDanger={true}
            />
            {/* RECYCLE BIN MODAL */}
            <RecycleBinModal
                isOpen={isTrashOpen}
                onClose={() => setIsTrashOpen(false)}
                title={language === 'en' ? 'Jobs Recycle Bin' : 'Thùng rác việc làm'}
                items={trashJobs}
                loading={trashLoading}
                onRestore={handleRestoreJob}
                onPermanentDelete={handlePermanentDeleteJob}
            />
        </div>
    );
}
