import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import SmartPagination from '../components/common/SmartPagination';
import OnlinePaymentModal from '../components/employer/OnlinePaymentModal';

export default function EmployerJobManagement() {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  // Wallet & Online Payment State
  const [walletBalance, setWalletBalance] = useState(0);
  const [postJobFee, setPostJobFee] = useState(50000);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Modal create/edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    categoryId: 1,
    description: '',
    requirements: '',
    salaryMin: 15000000,
    salaryMax: 30000000,
    location: 'Hà Nội',
    jobType: 'FullTime',
    status: 'Active'
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = { page, pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;

      const res = await axiosClient.get('/Employer/jobs', { params });
      if (res.data?.data) {
        setJobs(res.data.data);
        setTotal(res.data.total || 0);
      } else if (Array.isArray(res.data)) {
        setJobs(res.data);
        setTotal(res.data.length);
      }
    } catch (err) {
      showToast('Không thể tải danh sách việc làm: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/Employer/categories');
      setCategories(res.data);
      if (res.data.length > 0 && formData.categoryId === 1) {
        setFormData((prev) => ({ ...prev, categoryId: res.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await axiosClient.get('/Employer/wallet');
      if (res.data) {
        setWalletBalance(res.data.balance || 0);
        setPostJobFee(res.data.postJobFee || 50000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchWallet();

    const handleWalletUpdated = (e) => {
      if (e.detail?.newBalance !== undefined) {
        setWalletBalance(e.detail.newBalance);
      } else {
        fetchWallet();
      }
    };
    window.addEventListener('wallet_updated', handleWalletUpdated);
    return () => window.removeEventListener('wallet_updated', handleWalletUpdated);
  }, []);

  useEffect(() => {
    fetchJobs();
    const handleSwitch = () => fetchJobs();
    window.addEventListener('company_switched', handleSwitch);
    return () => window.removeEventListener('company_switched', handleSwitch);
  }, [search, statusFilter, categoryFilter, page, pageSize]);

  // Open Modal Create (Bắt buộc kiểm tra số dư ví để nạp tiền)
  const handleOpenCreate = () => {
    if (walletBalance < postJobFee) {
      if (window.confirm(`Số dư tài khoản (${walletBalance.toLocaleString('vi-VN')} đ) không đủ để đăng tin. Phí dịch vụ đăng tin là ${postJobFee.toLocaleString('vi-VN')} đ.\n\nBạn có muốn nạp tiền trực tuyến ngay bây giờ không?`)) {
        setShowPaymentModal(true);
      }
      return;
    }

    setIsEditing(false);
    setFormData({
      id: 0,
      title: '',
      categoryId: categories[0]?.id || 1,
      description: '',
      requirements: '',
      salaryMin: 15000000,
      salaryMax: 30000000,
      location: 'Hà Nội',
      jobType: 'FullTime',
      status: 'Active'
    });
    setModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (job) => {
    setIsEditing(true);
    setFormData({
      id: job.id,
      title: job.title,
      categoryId: job.categoryId,
      description: job.description || '',
      requirements: job.requirements || '',
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      location: job.location,
      jobType: job.jobType,
      status: job.status
    });
    setModalOpen(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmitJob = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề tuyển dụng.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await axiosClient.put(`/Employer/jobs/${formData.id}`, {
          title: formData.title,
          categoryId: parseInt(formData.categoryId, 10),
          description: formData.description,
          requirements: formData.requirements,
          salaryMin: parseFloat(formData.salaryMin),
          salaryMax: parseFloat(formData.salaryMax),
          location: formData.location,
          jobType: formData.jobType,
          status: formData.status
        });
        showToast('Cập nhật tin việc làm thành công!', 'success');
      } else {
        const res = await axiosClient.post('/Employer/jobs', {
          title: formData.title,
          categoryId: parseInt(formData.categoryId, 10),
          description: formData.description,
          requirements: formData.requirements,
          salaryMin: parseFloat(formData.salaryMin),
          salaryMax: parseFloat(formData.salaryMax),
          location: formData.location,
          jobType: formData.jobType
        });

        showToast(res.data?.message || 'Đăng tin tuyển dụng mới thành công!', 'success');
        if (res.data?.newBalance !== undefined) {
          setWalletBalance(res.data.newBalance);
          window.dispatchEvent(new CustomEvent('wallet_updated', {
            detail: { newBalance: res.data.newBalance }
          }));
        }
      }
      setModalOpen(false);
      fetchJobs();
    } catch (err) {
      if (err.response?.data?.insufficientBalance) {
        showToast(err.response.data.message, 'warning');
        setModalOpen(false);
        setShowPaymentModal(true);
      } else {
        showToast('Thao tác thất bại: ' + (err.response?.data?.message || err.message), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status (Active / Closed)
  const handleToggleStatus = async (job) => {
    const nextStatus = job.status === 'Active' ? 'Closed' : 'Active';
    try {
      await axiosClient.patch(`/Employer/jobs/${job.id}/status`, { status: nextStatus });
      showToast(`Đã chuyển trạng thái việc làm thành: ${nextStatus === 'Active' ? 'Đang tuyển' : 'Đóng tuyển'}`, 'info');
      setJobs(jobs.map(j => j.id === job.id ? { ...j, status: nextStatus } : j));
    } catch (err) {
      showToast('Không thể thay đổi trạng thái: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Delete Job
  const handleDeleteJob = async (id) => {
    try {
      await axiosClient.delete(`/Employer/jobs/${id}`);
      showToast('Đã xóa tin tuyển dụng thành công.', 'success');
      setDeleteConfirmId(null);
      fetchJobs();
    } catch (err) {
      showToast('Lỗi khi xóa việc làm: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. TOP HIGHLIGHT STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Tổng tin việc làm</span>
            <div className="text-2xl font-black text-[#081534] dark:text-white mt-1">{jobs.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-700 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">work</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Đang nhận hồ sơ</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {jobs.filter(j => j.status === 'Active').length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Đã đóng tuyển</span>
            <div className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">
              {jobs.filter(j => j.status === 'Closed').length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">archive</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 overflow-hidden">
        
        {/* Header & Action Button */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h1 className="text-xl font-black text-[#081534] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006A61] text-2xl">tune</span>
              <span>Quản lý tin tuyển dụng</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo mới, chỉnh sửa, đóng/mở nhận hồ sơ và theo dõi ứng viên từng vị trí.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-md cursor-pointer hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Đăng việc làm mới</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-[#F8F9FF] dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 max-w-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo chức danh, địa điểm..."
              className="w-full bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="">Tất cả ngành nghề</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.categoryName}</option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Active">Đang tuyển (Active)</option>
              <option value="Closed">Đã đóng (Closed)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-800/80">
                <th className="py-3 px-5">Vị trí việc làm</th>
                <th className="py-3 px-4">Ngành nghề</th>
                <th className="py-3 px-4">Mức lương (VNĐ)</th>
                <th className="py-3 px-4">Địa điểm</th>
                <th className="py-3 px-4 text-center">Hồ sơ CV</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Đang tải dữ liệu việc làm...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Không tìm thấy tin việc làm phù hợp.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#081534] dark:text-white text-xs sm:text-sm">
                        {job.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Ngày tạo: {new Date(job.createdAt).toLocaleDateString('vi-VN')} • {job.jobType}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {job.categoryName}
                    </td>

                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      {job.salaryMin.toLocaleString('vi-VN')} - {job.salaryMax.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {job.location}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <a
                        href={`/employer/applications?jobId=${job.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs hover:bg-blue-200 transition"
                      >
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span>{job.applicantCount}</span>
                      </a>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          job.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Bấm để chuyển trạng thái"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        <span>{job.status === 'Active' ? 'Đang tuyển' : 'Đã đóng'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Sửa tin việc làm"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(job.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Xóa việc làm"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang danh sách việc làm thông minh khi dữ liệu nhiều */}
        <SmartPagination
          currentPage={page}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[8, 16, 24, 48]}
          itemName="tin tuyển dụng"
          className="border-none rounded-none border-t border-slate-100 dark:border-slate-700/60"
        />
      </div>

      {/* 3. MODAL CREATE / EDIT JOB */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-black text-[#081534] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006A61] text-2xl">
                  {isEditing ? 'edit_square' : 'add_circle'}
                </span>
                <span>{isEditing ? 'Chỉnh sửa tin việc làm' : 'Đăng tin việc làm mới'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitJob} className="space-y-4">
              {/* Thông tin phí dịch vụ khi đăng tin */}
              {!isEditing && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">payments</span>
                    <span className="text-slate-700 dark:text-slate-200">
                      Phí đăng tin: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{postJobFee.toLocaleString('vi-VN')} đ</strong> (Số dư ví hiện có: <strong>{walletBalance.toLocaleString('vi-VN')} đ</strong>)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="text-emerald-700 dark:text-emerald-300 font-bold underline hover:text-emerald-800 cursor-pointer"
                  >
                    + Nạp thêm
                  </button>
                </div>
              )}

              {/* Tiêu đề việc làm */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <span>Tiêu đề việc làm</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Senior React Developer / Trưởng nhóm Marketing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                />
              </div>

              {/* Ngành nghề & Loại hình */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Ngành nghề danh mục
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.categoryName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Hình thức làm việc
                  </label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                  >
                    <option value="FullTime">Toàn thời gian (Full-time)</option>
                    <option value="PartTime">Bán thời gian (Part-time)</option>
                    <option value="Remote">Làm việc từ xa (Remote)</option>
                    <option value="Contract">Hợp đồng dự án (Contract)</option>
                  </select>
                </div>
              </div>

              {/* Lương Min - Max & Địa điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Lương tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Lương tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Địa điểm làm việc
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="VD: Hà Nội, TP.HCM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Trạng thái (chỉ khi Edit) */}
              {isEditing && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Trạng thái hiển thị
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="Active">Đang tuyển (Active)</option>
                    <option value="Closed">Đã đóng (Closed)</option>
                  </select>
                </div>
              )}

              {/* Mô tả công việc */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Mô tả công việc (Job Description)
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả trách nhiệm công việc, mục tiêu dự án..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Yêu cầu ứng viên */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Yêu cầu ứng viên (Requirements & Skills)
                </label>
                <textarea
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Kỹ năng chuyên môn, kinh nghiệm năm, ngoại ngữ..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Footer CTA */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Đăng tin việc làm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Xác nhận xóa việc làm</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bạn có chắc chắn muốn xóa tin tuyển dụng này? Các hồ sơ ứng tuyển liên kết cũng sẽ bị ảnh hưởng.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteJob(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONLINE PAYMENT MODAL */}
      <OnlinePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(data) => {
          if (data?.newBalance !== undefined) {
            setWalletBalance(data.newBalance);
          }
        }}
        initialAmount={50000}
      />
    </div>
  );
}
