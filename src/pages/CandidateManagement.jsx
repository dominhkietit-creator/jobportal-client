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
    LockIcon,
    UnlockIcon,
    ExternalLinkIcon,
    XIcon,
    Pagination,
    usePagination
} from '../components/admin/AdminCommon';

export default function CandidateManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');

    // Quick Inspector Drawer
    const [inspectorCandidate, setInspectorCandidate] = useState(null);
    const [candidateDetail, setCandidateDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Edit modal
    const [editCandidate, setEditCandidate] = useState(null);
    const [editForm, setEditForm] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        avatarUrl: ''
    });

    // Toggle active status modal
    const [statusCandidate, setStatusCandidate] = useState(null);

    const loadCandidates = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/candidates');
            setCandidates(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách ứng viên:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load candidates.' : 'Không thể kết nối máy chủ để tải ứng viên.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCandidates();
    }, []);

    useEffect(() => {
        const q = searchParams.get('search') || searchParams.get('q');
        if (q !== null) {
            setSearch(q);
        }
    }, [searchParams]);

    const filteredCandidates = useMemo(() => {
        if (!search.trim()) return candidates;
        const q = search.toLowerCase();
        return candidates.filter(
            (c) =>
                c.fullName?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phoneNumber?.toLowerCase().includes(q) ||
                c.address?.toLowerCase().includes(q)
        );
    }, [candidates, search]);

    // Phân trang tự động
    const {
        paginatedItems: pagedCandidates,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredCandidates, 10);

    // Xem chi tiết ứng viên qua Quick Drawer
    const handleInspectCandidate = async (cand) => {
        setInspectorCandidate(cand);
        setLoadingDetail(true);
        try {
            const res = await axiosClient.get(`/Admin/candidates/${cand.id}`);
            setCandidateDetail(res.data);
        } catch (err) {
            console.error('Lỗi nạp chi tiết ứng viên:', err);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Mở form chỉnh sửa ứng viên
    const handleOpenEdit = (cand) => {
        setEditCandidate(cand);
        setEditForm({
            fullName: cand.fullName || '',
            phoneNumber: cand.phoneNumber || '',
            address: cand.address || '',
            avatarUrl: cand.avatarUrl || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put(`/Admin/candidates/${editCandidate.id}`, editForm);
            await loadCandidates();
            if (inspectorCandidate && inspectorCandidate.id === editCandidate.id) {
                setInspectorCandidate({ ...inspectorCandidate, ...editForm });
            }
            const candName = editForm.fullName;
            setEditCandidate(null);
            toast.success(
                language === 'en' ? 'Candidate Updated' : 'Cập nhật thành công',
                language === 'en' ? `Profile for "${candName}" saved.` : `Hồ sơ ứng viên "${candName}" đã được cập nhật.`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Error' : 'Lỗi cập nhật',
                language === 'en' ? 'Error updating candidate.' : 'Không thể lưu thông tin ứng viên.'
            );
        }
    };

    // Khóa / Mở khóa tài khoản ứng viên
    const handleConfirmToggleStatus = async () => {
        if (!statusCandidate) return;
        const cand = statusCandidate;
        const newStatus = cand.isActive ? 'Blocked' : 'Active';
        const oldStatus = cand.isActive ? 'Active' : 'Blocked';
        try {
            await axiosClient.patch(`/Admin/users/${cand.userId}/toggle-status`);
            await loadCandidates();
            if (inspectorCandidate && inspectorCandidate.id === cand.id) {
                setInspectorCandidate({ ...inspectorCandidate, isActive: !inspectorCandidate.isActive });
            }
            toast.statusUpdate({
                entity: cand.fullName || `Candidate #${cand.id}`,
                oldStatus,
                newStatus,
                message: cand.isActive
                    ? (language === 'en' ? `Account for "${cand.fullName}" has been locked.` : `Tài khoản của "${cand.fullName}" đã bị khóa.`)
                    : (language === 'en' ? `Account for "${cand.fullName}" has been unlocked.` : `Tài khoản của "${cand.fullName}" đã được mở khóa hoạt động.`)
            });
            setStatusCandidate(null);
        } catch (err) {
            toast.error(
                language === 'en' ? 'Status Error' : 'Lỗi trạng thái',
                language === 'en' ? 'Error updating account status.' : 'Lỗi cập nhật trạng thái tài khoản.'
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('title_candidates')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_candidates')}
                    </p>
                </div>
            </div>

            {/* THANH TÌM KIẾM */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('search_candidate_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                    />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                    {t('total_label')} <strong>{candidates.length}</strong> {t('candidates_unit')}
                </div>
            </div>

            {/* BẢNG DỮ LIỆU ỨNG VIÊN */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[750px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-10">
                            <tr>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px]">ứng viên</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('field_email')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('field_phone')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_location')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_applied_count')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_cv')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-400">
                                        {t('no_matching_records')}
                                    </td>
                                </tr>
                            ) : (
                                pagedCandidates.map((cand) => (
                                    <tr
                                        key={cand.id}
                                        onClick={() => handleInspectCandidate(cand)}
                                        className="hover:bg-slate-50 transition cursor-pointer h-14"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                    {cand.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 line-clamp-1 hover:text-[#1E40AF]">
                                                        {cand.fullName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">ID #{cand.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 font-medium">
                                            {cand.email}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 tabular-nums">
                                            {cand.phoneNumber || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500">
                                            {cand.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}
                                        </td>
                                        <td className="px-3 py-2.5 font-semibold text-slate-900 tabular-nums">
                                            {cand.totalApplications || 0} {t('applications_unit')}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 font-medium tabular-nums">
                                            {cand.totalCVs || 0} CV
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={cand.isActive ? 'Active' : 'Blocked'} />
                                        </td>
                                        <td className="px-4 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            {/* Sửa */}
                                            <button
                                                onClick={() => handleOpenEdit(cand)}
                                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-[#1E40AF] transition cursor-pointer"
                                                title={t('edit')}
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>

                                            {/* Khóa / Mở khóa */}
                                            <button
                                                onClick={() => setStatusCandidate(cand)}
                                                className={`p-1.5 rounded transition cursor-pointer ${cand.isActive
                                                    ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                                    : 'hover:bg-emerald-50 text-emerald-600'
                                                    }`}
                                                title={cand.isActive ? t('lock_account') : t('unlock_account')}
                                            >
                                                {cand.isActive ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
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
                    itemName={t('candidates_unit')}
                />
            </div>

            {/* CANDIDATE QUICK INSPECTOR DRAWER */}
            <QuickDrawer
                isOpen={!!inspectorCandidate}
                onClose={() => setInspectorCandidate(null)}
                title={inspectorCandidate?.fullName || t('drawer_title')}
                subtitle={`#${inspectorCandidate?.id} • User #${inspectorCandidate?.userId}`}
                badge={<StatusBadge status={inspectorCandidate?.isActive ? 'Active' : 'Blocked'} />}
                actions={
                    inspectorCandidate && (
                        <>
                            <button
                                onClick={() => handleOpenEdit(inspectorCandidate)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition"
                            >
                                {t('edit_profile')}
                            </button>
                            <button
                                onClick={() => {
                                    setStatusCandidate(inspectorCandidate);
                                    setInspectorCandidate(null);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer text-white transition ${inspectorCandidate.isActive
                                    ? 'bg-[#e11d48] hover:bg-[#be123c]'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                            >
                                {inspectorCandidate.isActive ? t('lock_account') : t('unlock_account')}
                            </button>
                        </>
                    )
                }
            >
                {inspectorCandidate && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_contact_info')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_email')}:</span>
                                <span className="font-semibold text-slate-900">{inspectorCandidate.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_phone')}:</span>
                                <span className="font-medium text-slate-800">{inspectorCandidate.phoneNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_address')}:</span>
                                <span className="font-medium text-slate-800 text-right">{inspectorCandidate.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_registered_at')}:</span>
                                <span className="font-medium text-slate-800">
                                    {new Date(inspectorCandidate.createdAt || Date.now()).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                                </span>
                            </div>
                        </div>

                        {loadingDetail ? (
                            <div className="p-4 text-center text-slate-400">{t('searching')}</div>
                        ) : candidateDetail && (
                            <>
                                {/* DANH SÁCH FILE CV */}
                                <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                                        {t('col_cv')} ({candidateDetail.cvs?.length || 0})
                                    </div>
                                    {candidateDetail.cvs?.length === 0 ? (
                                        <p className="text-slate-400">{t('no_cv')}</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {candidateDetail.cvs?.map((cv) => (
                                                <div key={cv.id} className="py-2 flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{cv.title}</div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {new Date(cv.uploadedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`http://localhost:5249${cv.fileUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2 py-1 rounded bg-slate-100 hover:bg-[#1E40AF] hover:text-white text-slate-700 font-semibold text-[11px] transition inline-flex items-center space-x-1"
                                                    >
                                                        <span>{t('view_cv')}</span>
                                                        <ExternalLinkIcon className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* LỊCH SỬ ỨNG TUYỂN */}
                                <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                                        {t('title_applications')} ({candidateDetail.applications?.length || 0})
                                    </div>
                                    {candidateDetail.applications?.length === 0 ? (
                                        <p className="text-slate-400">{t('no_matching_records')}</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {candidateDetail.applications?.map((app) => (
                                                <div key={app.id} className="py-2 flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold text-slate-900 line-clamp-1">{app.jobTitle}</div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {t('col_applied_at')}: {new Date(app.appliedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={app.status} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </QuickDrawer>

            {/* MODAL SỬA THÔNG TIN ỨNG VIÊN */}
            {editCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">{t('modal_edit_candidate_title')} #{editCandidate.id}</h3>
                            <button
                                onClick={() => setEditCandidate(null)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_full_name')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_phone')}</label>
                                <input
                                    type="text"
                                    value={editForm.phoneNumber}
                                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_address')}</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditCandidate(null)}
                                    className="px-3.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded cursor-pointer"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded cursor-pointer transition shadow-xs"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM TOGGLE STATUS MODAL */}
            <ConfirmModal
                isOpen={!!statusCandidate}
                onClose={() => setStatusCandidate(null)}
                onConfirm={handleConfirmToggleStatus}
                title={statusCandidate?.isActive ? t('lock_account') : t('unlock_account')}
                message={t('modal_toggle_account_msg')}
                confirmText={statusCandidate?.isActive ? t('lock_account') : t('unlock_account')}
                isDanger={statusCandidate?.isActive}
            />
        </div>
    );
}
