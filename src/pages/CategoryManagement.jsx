import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
    PlusIcon,
    EditIcon,
    TrashIcon,
    ConfirmModal,
    SearchIcon,
    XIcon,
    Pagination,
    usePagination
} from '../components/admin/AdminCommon';
import RecycleBinModal from '../components/admin/RecycleBinModal';

export default function CategoryManagement() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form thêm mới
    const [newCategoryName, setNewCategoryName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal sửa
    const [editCat, setEditCat] = useState(null);
    const [editName, setEditName] = useState('');

    // Modal xóa & Thùng rác
    const [deleteCat, setDeleteCat] = useState(null);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [trashCategories, setTrashCategories] = useState([]);
    const [trashLoading, setTrashLoading] = useState(false);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Lỗi tải danh mục:', err);
            toast.error(
                language === 'en' ? 'Connection Error' : 'Lỗi kết nối',
                language === 'en' ? 'Could not load categories.' : 'Không thể kết nối máy chủ để tải danh mục.'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadTrash = async () => {
        setTrashLoading(true);
        try {
            const res = await axiosClient.get('/Admin/categories/trash');
            setTrashCategories(res.data);
        } catch (err) {
            console.error('Lỗi tải thùng rác danh mục:', err);
        } finally {
            setTrashLoading(false);
        }
    };

    const handleRestoreCategory = async (cat) => {
        try {
            await axiosClient.post(`/Admin/categories/${cat.id}/restore`);
            toast.success(
                language === 'en' ? 'Restored Successfully' : 'Khôi phục thành công',
                language === 'en' ? `Category "${cat.name}" has been restored.` : `Danh mục "${cat.name}" đã được khôi phục thành công.`
            );
            await loadCategories();
            await loadTrash();
        } catch (err) {
            toast.error(
                language === 'en' ? 'Restore Failed' : 'Khôi phục thất bại',
                language === 'en' ? 'Could not restore this category.' : 'Không thể khôi phục danh mục này.'
            );
        }
    };

    const handlePermanentDeleteCategory = async (cat) => {
        try {
            await axiosClient.delete(`/Admin/categories/${cat.id}/permanent`);
            toast.success(
                language === 'en' ? 'Permanently Deleted' : 'Đã xóa vĩnh viễn',
                language === 'en' ? `Category was removed from trash.` : `Đã xóa vĩnh viễn danh mục khỏi thùng rác.`
            );
            await loadTrash();
        } catch (err) {
            toast.error(
                language === 'en' ? 'Action Failed' : 'Thất bại',
                language === 'en' ? 'Could not delete category.' : 'Không thể xóa danh mục khỏi thùng rác.'
            );
        }
    };

    useEffect(() => {
        loadCategories();
        loadTrash();
    }, []);

    // Tìm kiếm và lọc danh mục
    const [search, setSearch] = useState('');

    const filteredCategories = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter((c) => c.name?.toLowerCase().includes(q));
    }, [categories, search]);

    // Phân trang tự động
    const {
        paginatedItems: pagedCategories,
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        setCurrentPage,
        setPageSize
    } = usePagination(filteredCategories, 10);

    // 1. Thêm danh mục
    const handleAddCategory = async (e) => {
        e.preventDefault();
        const catName = newCategoryName.trim();
        if (!catName) return;

        setSubmitting(true);
        try {
            await axiosClient.post('/Admin/categories', { name: catName });
            setNewCategoryName('');
            await loadCategories();
            toast.success(
                language === 'en' ? 'Category Created' : 'Tạo danh mục thành công',
                language === 'en' ? `Category "${catName}" has been added.` : `Ngành nghề "${catName}" đã được đưa vào hệ thống.`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Creation Failed' : 'Thêm danh mục thất bại',
                language === 'en' ? 'Failed to add category.' : 'Không thể tạo mới danh mục này.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    // 2. Sửa danh mục
    const handleOpenEdit = (c) => {
        setEditCat(c);
        setEditName(c.name);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        const updatedName = editName.trim();
        if (!updatedName) return;

        try {
            await axiosClient.put(`/Admin/categories/${editCat.id}`, { name: updatedName });
            await loadCategories();
            setEditCat(null);
            toast.success(
                language === 'en' ? 'Category Updated' : 'Cập nhật thành công',
                language === 'en' ? `Category name changed to "${updatedName}".` : `Đã đổi tên danh mục thành "${updatedName}".`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Error' : 'Lỗi cập nhật',
                language === 'en' ? 'Error updating category.' : 'Không thể lưu thay đổi danh mục.'
            );
        }
    };

    // 3. Xóa danh mục (chuyển vào thùng rác)
    const handleConfirmDelete = async () => {
        if (!deleteCat) return;
        const cat = deleteCat;
        try {
            await axiosClient.delete(`/Admin/categories/${cat.id}`);
            await loadCategories();
            await loadTrash();
            toast.success(
                language === 'en' ? 'Moved to Recycle Bin' : 'Đã chuyển vào thùng rác',
                language === 'en' ? `Category "${cat.name}" moved to trash. You can restore it anytime.` : `Đã chuyển danh mục "${cat.name}" vào thùng rác. Bạn có thể khôi phục lại bất kỳ lúc nào.`
            );
            setDeleteCat(null);
        } catch (err) {
            toast.error(
                language === 'en' ? 'Cannot Delete' : 'Không thể xóa',
                err.response?.data || (language === 'en' ? 'Cannot delete category with associated jobs.' : 'Không thể xóa danh mục này do đang có việc làm liên kết.')
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('title_categories')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_categories')}
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
                    {trashCategories.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                            {trashCategories.length}
                        </span>
                    )}
                </button>
            </div>

            {/* BỐ CỤC 2 CỘT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
                {/* CỘT TRÁI: FORM THÊM MỚI (4 CỘT) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs h-fit space-y-4">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">{t('category_add_title')}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('category_add_sub')}
                        </p>
                    </div>

                    <form onSubmit={handleAddCategory} className="space-y-3.5 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                {t('category_name_label')} *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={language === 'en' ? 'e.g. Artificial Intelligence (AI), Accounting...' : 'VD: Trí tuệ nhân tạo (AI), Kế toán - Kiểm toán...'}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center space-x-1.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold py-2.5 rounded text-xs transition shadow-xs cursor-pointer"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>{submitting ? t('btn_adding') : t('btn_create_category')}</span>
                        </button>
                    </form>
                </div>

                {/* CỘT PHẢI: BẢNG DANH SÁCH DANH MỤC (8 CỘT) */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col min-w-0">
                    <div className="p-3 sm:p-3.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 bg-white">
                        <div className="font-bold text-sm text-slate-900">
                            {t('category_existing_title')} ({categories.length})
                        </div>
                        <div className="relative w-full sm:w-52">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={language === 'en' ? 'Search category...' : 'Tìm danh mục...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-xs pl-8 pr-7 py-1 rounded focus:outline-none focus:border-[#2563EB]"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                    title={t('reset')}
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[480px]">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-9">
                                <tr>
                                    <th className="px-4 py-2 uppercase tracking-wider text-[11px] w-20">ID</th>
                                    <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_category_name')}</th>
                                    <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_job_count')}</th>
                                    <th className="px-4 py-2 uppercase tracking-wider text-[11px] text-right">{t('col_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400">
                                            {t('no_matching_records')}
                                        </td>
                                    </tr>
                                ) : (
                                    pagedCategories.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50 transition h-14">
                                            <td className="px-4 py-2 font-mono text-slate-500 font-medium">
                                                #{c.id}
                                            </td>
                                            <td className="px-4 py-2 font-semibold text-slate-900">
                                                {c.name}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 tabular-nums">
                                                    {c.jobsCount || 0} {t('jobs_unit')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right space-x-1">
                                                <button
                                                    onClick={() => handleOpenEdit(c)}
                                                    className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-[#1E40AF] transition cursor-pointer"
                                                    title={t('edit')}
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteCat(c)}
                                                    className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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
                        pageSizeOptions={[5, 10, 20, 50]}
                        itemName={t('categories_unit')}
                    />
                </div>
            </div>

            {/* MODAL CHỈNH SỬA TÊN DANH MỤC */}
            {editCat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-sm text-slate-900">{t('modal_edit_cat_title')} #{editCat.id}</h3>
                            <button
                                onClick={() => setEditCat(null)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">{t('category_name_label')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563EB]"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditCat(null)}
                                    className="px-3.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded cursor-pointer"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded cursor-pointer transition shadow-xs"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN XÓA */}
            <ConfirmModal
                isOpen={!!deleteCat}
                onClose={() => setDeleteCat(null)}
                onConfirm={handleConfirmDelete}
                title={t('modal_delete_cat_title')}
                message={`"${deleteCat?.name}" - ${t('modal_delete_cat_msg')}`}
                confirmText={t('delete')}
                isDanger={true}
            />
            {/* RECYCLE BIN MODAL */}
            <RecycleBinModal
                isOpen={isTrashOpen}
                onClose={() => setIsTrashOpen(false)}
                title={language === 'en' ? 'Category Recycle Bin' : 'Thùng rác danh mục'}
                items={trashCategories}
                loading={trashLoading}
                onRestore={handleRestoreCategory}
                onPermanentDelete={handlePermanentDeleteCategory}
            />
        </div>
    );
}
