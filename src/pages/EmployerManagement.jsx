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
    XIcon,
    Pagination,
    usePagination
} from '../components/admin/AdminCommon';

export default function EmployerManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const [employers, setEmployers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');

    // Quick Drawer
    const [inspectorEmployer, setInspectorEmployer] = useState(null);
    const [employerDetail, setEmployerDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Edit modal
    const [editEmployer, setEditEmployer] = useState(null);
    const [editForm, setEditForm] = useState({
        fullName: '',
        phoneNumber: '',
        position: '',
        companyId: ''
    });

    // Toggle active status modal
    const [statusEmployer, setStatusEmployer] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empRes, compRes] = await Promise.all([
                axiosClient.get('/Admin/employers'),
                axiosClient.get('/Admin/companies')
            ]);
            setEmployers(empRes.data);
            setCompanies(compRes.data);
        } catch (err) {
            console.error('Lỗi tải danh sách nhà tuyển dụng:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load employers.' : 'Không thể kết nối máy chủ để tải nhà tuyển dụng.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const q = searchParams.get('search') || searchParams.get('q');
        if (q !== null) {
            setSearch(q);
        }
    }, [searchParams]);

    const filteredEmployers = useMemo(() => {
        if (!search.trim()) return employers;
        const q = search.toLowerCase();
        return employers.filter(
            (e) =>
                e.fullName?.toLowerCase().includes(q) ||
                e.email?.toLowerCase().includes(q) ||
                e.companyName?.toLowerCase().includes(q) ||
                e.position?.toLowerCase().includes(q)
        );
    }, [employers, search]);

    // Phân trang tự động
    const {
        paginatedItems: pagedEmployers,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredEmployers, 10);

    // Xem chi tiết nhà tuyển dụng qua Drawer
    const handleInspectEmployer = async (emp) => {
        setInspectorEmployer(emp);
        setLoadingDetail(true);
        try {
            const res = await axiosClient.get(`/Admin/employers/${emp.id}`);
            setEmployerDetail(res.data);
        } catch (err) {
            console.error('Lỗi nạp chi tiết nhà tuyển dụng:', err);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Mở modal sửa nhà tuyển dụng
    const handleOpenEdit = (emp) => {
        setEditEmployer(emp);
        setEditForm({
            fullName: emp.fullName || '',
            phoneNumber: emp.phoneNumber || '',
            position: emp.position || '',
            companyId: emp.companyId || (companies[0]?.id || '')
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put(`/Admin/employers/${editEmployer.id}`, {
                ...editForm,
                companyId: Number(editForm.companyId)
            });
            await loadData();
            if (inspectorEmployer && inspectorEmployer.id === editEmployer.id) {
                setInspectorEmployer({ ...inspectorEmployer, ...editForm });
            }
            const empName = editForm.fullName;
            setEditEmployer(null);
            toast.success(
                language === 'en' ? 'Employer Updated' : 'Cập nhật thành công',
                language === 'en' ? `Profile for "${empName}" saved.` : `Thông tin nhà tuyển dụng "${empName}" đã được cập nhật.`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Error' : 'Lỗi cập nhật',
                language === 'en' ? 'Error updating employer.' : 'Không thể lưu thông tin nhà tuyển dụng.'
            );
        }
    };

    // Khóa / Mở khóa tài khoản nhà tuyển dụng
    const handleConfirmToggleStatus = async () => {
        if (!statusEmployer) return;
        const emp = statusEmployer;
        const newStatus = emp.isActive ? 'Blocked' : 'Active';
        const oldStatus = emp.isActive ? 'Active' : 'Blocked';
        try {
            await axiosClient.patch(`/Admin/users/${emp.userId}/toggle-status`);
            await loadData();
            if (inspectorEmployer && inspectorEmployer.id === emp.id) {
                setInspectorEmployer({ ...inspectorEmployer, isActive: !inspectorEmployer.isActive });
            }
            toast.statusUpdate({
                entity: emp.fullName || `Employer #${emp.id}`,
                oldStatus,
                newStatus,
                message: emp.isActive
                    ? (language === 'en' ? `Account for "${emp.fullName}" has been locked.` : `Tài khoản của "${emp.fullName}" đã bị khóa.`)
                    : (language === 'en' ? `Account for "${emp.fullName}" has been unlocked.` : `Tài khoản của "${emp.fullName}" đã được mở khóa hoạt động.`)
            });
            setStatusEmployer(null);
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
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('title_employers')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_employers')}
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
                        placeholder={t('search_employer_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                    />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                    {t('total_label')} <strong>{employers.length}</strong> {t('employers_unit')}
                </div>
            </div>

            {/* BẢNG DỮ LIỆU NHÀ TUYỂN DỤNG */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[750px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-10">
                            <tr>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px]">NHÀ tuyển dụng</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('field_email')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_enterprise')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_position')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_posted_jobs')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        {t('no_matching_records')}
                                    </td>
                                </tr>
                            ) : (
                                pagedEmployers.map((emp) => (
                                    <tr
                                        key={emp.id}
                                        onClick={() => handleInspectEmployer(emp)}
                                        className="hover:bg-slate-50 transition cursor-pointer h-14"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                    {emp.fullName?.charAt(0) || 'E'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 line-clamp-1 hover:text-[#1E40AF]">
                                                        {emp.fullName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">ID #{emp.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 font-medium">
                                            {emp.email}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-800 font-semibold">
                                            {emp.companyName}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500">
                                            {emp.position || (language === 'en' ? 'Recruitment Manager' : 'Trưởng phòng tuyển dụng')}
                                        </td>
                                        <td className="px-3 py-2.5 font-semibold text-slate-900 tabular-nums">
                                            {emp.totalJobs || 0} {t('jobs_unit')}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={emp.isActive ? 'Active' : 'Blocked'} />
                                        </td>
                                        <td className="px-4 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            {/* Sửa */}
                                            <button
                                                onClick={() => handleOpenEdit(emp)}
                                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-[#1E40AF] transition cursor-pointer"
                                                title={t('edit')}
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>

                                            {/* Khóa / Mở khóa */}
                                            <button
                                                onClick={() => setStatusEmployer(emp)}
                                                className={`p-1.5 rounded transition cursor-pointer ${emp.isActive
                                                    ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                                    : 'hover:bg-emerald-50 text-emerald-600'
                                                    }`}
                                                title={emp.isActive ? t('lock_account') : t('unlock_account')}
                                            >
                                                {emp.isActive ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
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
                    itemName={t('employers_unit')}
                />
            </div>

            {/* QUICK INSPECTOR DRAWER */}
            <QuickDrawer
                isOpen={!!inspectorEmployer}
                onClose={() => setInspectorEmployer(null)}
                title={inspectorEmployer?.fullName || t('drawer_title')}
                subtitle={`#${inspectorEmployer?.id} • ${inspectorEmployer?.companyName}`}
                badge={<StatusBadge status={inspectorEmployer?.isActive ? 'Active' : 'Blocked'} />}
                actions={
                    inspectorEmployer && (
                        <>
                            <button
                                onClick={() => handleOpenEdit(inspectorEmployer)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition"
                            >
                                {t('edit_profile')}
                            </button>
                            <button
                                onClick={() => {
                                    setStatusEmployer(inspectorEmployer);
                                    setInspectorEmployer(null);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer text-white transition ${inspectorEmployer.isActive
                                    ? 'bg-[#e11d48] hover:bg-[#be123c]'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                            >
                                {inspectorEmployer.isActive ? t('lock_account') : t('unlock_account')}
                            </button>
                        </>
                    )
                }
            >
                {inspectorEmployer && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_contact_info')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('field_email')}:</span>
                                <span className="font-semibold text-slate-900">{inspectorEmployer.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_enterprise')}:</span>
                                <span className="font-bold text-[#1E40AF]">{inspectorEmployer.companyName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_position')}:</span>
                                <span className="font-medium text-slate-800">{inspectorEmployer.position || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_posted_jobs')}:</span>
                                <span className="font-bold text-slate-900">{inspectorEmployer.totalJobs || 0} {t('jobs_unit')}</span>
                            </div>
                        </div>

                        {/* DANH SÁCH VIỆC LÀM DO NHÀ TUYỂN DỤNG ĐĂNG */}
                        {loadingDetail ? (
                            <div className="p-4 text-center text-slate-400">{t('searching')}</div>
                        ) : employerDetail && (
                            <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">
                                    {t('col_posted_jobs')} ({employerDetail.jobs?.length || 0})
                                </div>
                                {employerDetail.jobs?.length === 0 ? (
                                    <p className="text-slate-400">{t('no_matching_records')}</p>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {employerDetail.jobs?.map((j) => (
                                            <div key={j.id} className="py-2 flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900 line-clamp-1">{j.title}</div>
                                                    <div className="text-[10px] text-slate-400">{j.location} • {new Date(j.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}</div>
                                                </div>
                                                <StatusBadge status={j.status} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </QuickDrawer>

            {/* MODAL SỬA THÔNG TIN NHÀ TUYỂN DỤNG */}
            {editEmployer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">{t('modal_edit_employer_title')} #{editEmployer.id}</h3>
                            <button
                                onClick={() => setEditEmployer(null)}
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
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_position')}</label>
                                <input
                                    type="text"
                                    value={editForm.position}
                                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('col_affiliated_company')}</label>
                                <select
                                    value={editForm.companyId}
                                    onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                >
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.companyName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditEmployer(null)}
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
                isOpen={!!statusEmployer}
                onClose={() => setStatusEmployer(null)}
                onConfirm={handleConfirmToggleStatus}
                title={statusEmployer?.isActive ? t('lock_account') : t('unlock_account')}
                message={t('modal_toggle_account_msg')}
                confirmText={statusEmployer?.isActive ? t('lock_account') : t('unlock_account')}
                isDanger={statusEmployer?.isActive}
            />
        </div>
    );
}
