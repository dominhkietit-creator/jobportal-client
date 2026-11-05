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

export default function CompanyManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');

    // Quick Inspector Drawer
    const [inspectorCompany, setInspectorCompany] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Edit Modal
    const [editCompany, setEditCompany] = useState(null);
    const [editForm, setEditForm] = useState({
        companyName: '',
        website: '',
        address: '',
        description: '',
        logoUrl: ''
    });

    // Toggle Status Modal
    const [statusToggleCompany, setStatusToggleCompany] = useState(null);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/companies');
            setCompanies(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách công ty:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load companies.' : 'Không thể kết nối máy chủ để tải danh sách công ty.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        const q = searchParams.get('search') || searchParams.get('q');
        if (q !== null) {
            setSearch(q);
        }
    }, [searchParams]);

    const filteredCompanies = useMemo(() => {
        if (!search.trim()) return companies;
        const q = search.toLowerCase();
        return companies.filter(
            (c) =>
                c.companyName?.toLowerCase().includes(q) ||
                c.address?.toLowerCase().includes(q) ||
                c.website?.toLowerCase().includes(q)
        );
    }, [companies, search]);

    // Phân trang tự động
    const {
        paginatedItems: pagedCompanies,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredCompanies, 10);

    // Xem chi tiết công ty qua Drawer
    const handleInspectCompany = async (company) => {
        setInspectorCompany(company);
        setLoadingDetail(true);
        try {
            const res = await axiosClient.get(`/Admin/companies/${company.id}`);
            setCompanyDetails(res.data);
        } catch (err) {
            console.error('Lỗi nạp chi tiết công ty:', err);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Mở form chỉnh sửa công ty
    const handleOpenEdit = (c) => {
        setEditCompany(c);
        setEditForm({
            companyName: c.companyName || '',
            website: c.website || '',
            address: c.address || '',
            description: c.description || '',
            logoUrl: c.logoUrl || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put(`/Admin/companies/${editCompany.id}`, editForm);
            await loadCompanies();
            if (inspectorCompany && inspectorCompany.id === editCompany.id) {
                setInspectorCompany({ ...inspectorCompany, ...editForm });
            }
            const compName = editForm.companyName;
            setEditCompany(null);
            toast.success(
                language === 'en' ? 'Company Updated' : 'Cập nhật thành công',
                language === 'en' ? `Profile for "${compName}" saved.` : `Thông tin doanh nghiệp "${compName}" đã được cập nhật.`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Error' : 'Lỗi cập nhật',
                language === 'en' ? 'Could not save company profile.' : 'Không thể lưu thông tin doanh nghiệp.'
            );
        }
    };

    // Kích hoạt / Vô hiệu hóa công ty
    const handleConfirmToggleStatus = async () => {
        if (!statusToggleCompany) return;
        const comp = statusToggleCompany;
        const newStatus = comp.isActive ? 'Disabled' : 'Active';
        const oldStatus = comp.isActive ? 'Active' : 'Disabled';
        try {
            await axiosClient.patch(`/Admin/companies/${comp.id}/toggle-status`);
            await loadCompanies();
            toast.statusUpdate({
                entity: comp.companyName || `Company #${comp.id}`,
                oldStatus,
                newStatus,
                message: comp.isActive
                    ? (language === 'en' ? `Company "${comp.companyName}" has been locked.` : `Doanh nghiệp "${comp.companyName}" đã bị vô hiệu hóa.`)
                    : (language === 'en' ? `Company "${comp.companyName}" has been activated.` : `Doanh nghiệp "${comp.companyName}" đã được kích hoạt hoạt động.`)
            });
            setStatusToggleCompany(null);
        } catch (err) {
            toast.error(
                language === 'en' ? 'Action Failed' : 'Thao tác thất bại',
                language === 'en' ? 'Failed to update company status.' : 'Cập nhật trạng thái công ty thất bại.'
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('title_companies')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_companies')}
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
                        placeholder={t('search_company_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                    />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                    {t('total_label')} <strong>{companies.length}</strong> {t('enterprises_unit')}
                </div>
            </div>

            {/* BẢNG DỮ LIỆU CÔNG TY */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[720px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-10">
                            <tr>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_enterprise')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_headquarters')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_website')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_posted_jobs')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_employers')}</th>
                                <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        {t('no_matching_records')}
                                    </td>
                                </tr>
                            ) : (
                                pagedCompanies.map((c) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => handleInspectCompany(c)}
                                        className="hover:bg-slate-50 transition cursor-pointer h-14"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                                                    {c.logoUrl ? (
                                                        <img src={c.logoUrl} alt="" className="w-full h-full object-cover rounded" />
                                                    ) : (
                                                        c.companyName?.charAt(0) || 'C'
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 line-clamp-1 hover:text-[#1E40AF]">
                                                        {c.companyName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">ID #{c.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {c.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}
                                        </td>
                                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            {c.website ? (
                                                <a
                                                    href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[#1E40AF] hover:underline inline-flex items-center space-x-1"
                                                >
                                                    <span className="line-clamp-1 max-w-[140px]">{c.website}</span>
                                                    <ExternalLinkIcon className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 font-semibold text-slate-900 tabular-nums">
                                            {c.jobsCount || 0} {t('jobs_unit')}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 font-medium tabular-nums">
                                            {c.employersCount || 0} HR
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={c.isActive ? 'Active' : 'Disabled'} />
                                        </td>
                                        <td className="px-4 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            {/* Sửa */}
                                            <button
                                                onClick={() => handleOpenEdit(c)}
                                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-[#1E40AF] transition cursor-pointer"
                                                title={t('edit')}
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>

                                            {/* Kích hoạt / Vô hiệu hóa */}
                                            <button
                                                onClick={() => setStatusToggleCompany(c)}
                                                className={`p-1.5 rounded transition cursor-pointer ${c.isActive
                                                    ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                                    : 'hover:bg-emerald-50 text-emerald-600'
                                                    }`}
                                                title={c.isActive ? t('lock_account') : t('unlock_account')}
                                            >
                                                {c.isActive ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
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
                    itemName={t('companies_unit')}
                />
            </div>

            {/* QUICK INSPECTOR DRAWER */}
            <QuickDrawer
                isOpen={!!inspectorCompany}
                onClose={() => setInspectorCompany(null)}
                title={inspectorCompany?.companyName || t('drawer_title')}
                subtitle={`#${inspectorCompany?.id}`}
                badge={<StatusBadge status={inspectorCompany?.isActive ? 'Active' : 'Disabled'} />}
                actions={
                    inspectorCompany && (
                        <>
                            <button
                                onClick={() => handleOpenEdit(inspectorCompany)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition"
                            >
                                {t('edit_profile')}
                            </button>
                            <button
                                onClick={() => {
                                    setStatusToggleCompany(inspectorCompany);
                                    setInspectorCompany(null);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer text-white transition ${inspectorCompany.isActive
                                    ? 'bg-[#e11d48] hover:bg-[#be123c]'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                            >
                                {inspectorCompany.isActive ? t('lock_account') : t('unlock_account')}
                            </button>
                        </>
                    )
                }
            >
                {inspectorCompany && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_contact_info')}</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_headquarters')}:</span>
                                <span className="font-medium text-slate-800 text-right">{inspectorCompany.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_website')}:</span>
                                <span className="font-medium text-slate-800">{inspectorCompany.website || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_posted_jobs')}:</span>
                                <span className="font-bold text-[#1E40AF]">{inspectorCompany.jobsCount || 0} {t('jobs_unit')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('col_employers')}:</span>
                                <span className="font-bold text-slate-900">{inspectorCompany.employersCount || 0} HR</span>
                            </div>
                        </div>

                        {inspectorCompany.description && (
                            <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">{t('field_description')}</div>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{inspectorCompany.description}</p>
                            </div>
                        )}

                        {/* Danh sách nhà tuyển dụng thuộc công ty */}
                        {loadingDetail ? (
                            <div className="p-4 text-center text-slate-400">{t('searching')}</div>
                        ) : companyDetails && (
                            <>
                                <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_affiliated_company')} HR ({companyDetails.employers?.length || 0})</div>
                                    <div className="divide-y divide-slate-100">
                                        {companyDetails.employers?.map((emp) => (
                                            <div key={emp.id} className="py-2 flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900">{emp.fullName}</div>
                                                    <div className="text-[10px] text-slate-400">{emp.email} • {emp.position || 'HR'}</div>
                                                </div>
                                                <StatusBadge status={emp.isActive ? 'Active' : 'Disabled'} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">{t('recent_jobs_title')} ({companyDetails.jobs?.length || 0})</div>
                                    <div className="divide-y divide-slate-100">
                                        {companyDetails.jobs?.map((j) => (
                                            <div key={j.id} className="py-2 flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900 line-clamp-1">{j.title}</div>
                                                    <div className="text-[10px] text-slate-400">{j.categoryName} • {j.location}</div>
                                                </div>
                                                <StatusBadge status={j.status} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </QuickDrawer>

            {/* MODAL SỬA CÔNG TY */}
            {editCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">{t('modal_edit_company_title')} #{editCompany.id}</h3>
                            <button
                                onClick={() => setEditCompany(null)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_company_name')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.companyName}
                                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">{t('field_website')}</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={editForm.website}
                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Logo URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={editForm.logoUrl}
                                        onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                    />
                                </div>
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

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('field_description')}</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditCompany(null)}
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
                isOpen={!!statusToggleCompany}
                onClose={() => setStatusToggleCompany(null)}
                onConfirm={handleConfirmToggleStatus}
                title={statusToggleCompany?.isActive ? t('lock_account') : t('unlock_account')}
                message={t('modal_toggle_account_msg')}
                confirmText={statusToggleCompany?.isActive ? t('lock_account') : t('unlock_account')}
                isDanger={statusToggleCompany?.isActive}
            />
        </div>
    );
}
