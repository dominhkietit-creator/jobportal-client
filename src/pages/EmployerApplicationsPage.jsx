import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import SmartPagination from '../components/common/SmartPagination';

export default function EmployerApplicationsPage() {
  const { isEn } = useLanguage();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [stageFilter, setStageFilter] = useState('All'); // All | Pending | Shortlisted | Accepted | Rejected
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || '');
  const [jobOptions, setJobOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  // Split-view selected application & candidate details
  const [selectedApp, setSelectedApp] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Helper chuẩn hóa đường dẫn file CV & ảnh
  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://towers-contract-toolbox-distinguished.trycloudflare.com${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch applications list
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = { page, pageSize };
      if (stageFilter !== 'All') params.status = stageFilter;
      if (search.trim()) params.search = search.trim();
      if (selectedJobId) params.jobId = selectedJobId;

      const res = await axiosClient.get('/Employer/applications', { params });
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const totalCount = res.data?.total || (Array.isArray(res.data) ? res.data.length : 0);
      setApplications(list);
      setTotal(totalCount);

      // Tự động chọn app đầu tiên nếu chưa chọn
      if (list.length > 0) {
        const queryAppId = searchParams.get('appId');
        const matched = queryAppId ? list.find(a => a.id.toString() === queryAppId) : null;
        const target = matched || list[0];
        setSelectedApp(target);
        fetchCandidateDetail(target.candidateId, target.id, target);
      } else {
        setSelectedApp(null);
        setCandidateDetail(null);
      }
    } catch (err) {
      showToast('Lỗi khi tải hồ sơ ứng tuyển: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs for filter dropdown
  const fetchJobOptions = async () => {
    try {
      const res = await axiosClient.get('/Employer/jobs?pageSize=100');
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setJobOptions(list);
    } catch (err) {
      console.error('Lỗi nạp danh mục việc làm bộ lọc:', err);
      setJobOptions([]);
    }
  };

  // Fetch detail for Candidate View (Requirement 6)
  const fetchCandidateDetail = async (candidateId, appId, fallbackApp = null) => {
    try {
      setLoadingDetail(true);
      const res = await axiosClient.get(`/Employer/candidates/${candidateId}?applicationId=${appId}`);
      setCandidateDetail(res.data);
    } catch (err) {
      console.warn('Không thể tải API chi tiết ứng viên, sử dụng dữ liệu từ danh sách hồ sơ:', err);
      const appRef = fallbackApp || selectedApp;
      if (appRef) {
        setCandidateDetail({
          candidateId,
          fullName: appRef.candidateName || 'Ứng viên JobPortal',
          email: appRef.candidateEmail || '',
          phoneNumber: appRef.candidatePhone || '',
          address: appRef.candidateAddress || '',
          appliedPosition: appRef.jobTitle || 'Việc làm ứng tuyển',
          currentApplicationStatus: appRef.status || 'Pending',
          appliedAt: appRef.appliedAt,
          cvs: appRef.cvFileUrl ? [{
            id: appRef.cvId || 1,
            title: appRef.cvTitle || 'CV ứng tuyển đính kèm',
            fileUrl: appRef.cvFileUrl,
            uploadedAt: appRef.appliedAt
          }] : []
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchJobOptions();
  }, []);

  useEffect(() => {
    fetchApplications();
    const handleSwitch = () => {
      fetchJobOptions();
      fetchApplications();
    };
    window.addEventListener('company_switched', handleSwitch);
    return () => window.removeEventListener('company_switched', handleSwitch);
  }, [stageFilter, selectedJobId, page, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  // Cập nhật trạng thái ứng tuyển (Pending, Shortlisted, Rejected, Accepted)
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedApp) return;
    try {
      setUpdatingStatus(true);
      await axiosClient.patch(`/Employer/applications/${selectedApp.id}/status`, { status: newStatus });
      
      const statusLabels = {
        Pending: 'Chờ xử lý',
        Shortlisted: 'Vào danh sách ngắn',
        Accepted: 'Chấp nhận tuyển dụng',
        Rejected: 'Từ chối ứng viên'
      };

      showToast(`Đã chuyển trạng thái hồ sơ thành: ${statusLabels[newStatus]}`, 'success');
      
      // Update local states
      setSelectedApp({ ...selectedApp, status: newStatus });
      setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      if (candidateDetail) {
        setCandidateDetail({ ...candidateDetail, currentApplicationStatus: newStatus });
      }
    } catch (err) {
      showToast('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Chấp nhận (Offer)</span>;
      case 'Shortlisted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Vào DS ngắn</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Từ chối</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Chờ xử lý</span>;
    }
  };

  // Pipeline counts (đảm bảo luôn an toàn không bao giờ văng Exception)
  const safeApps = Array.isArray(applications) ? applications : [];
  const countAll = safeApps.length;
  const countPending = safeApps.filter(a => a.status === 'Pending').length;
  const countShortlisted = safeApps.filter(a => a.status === 'Shortlisted').length;
  const countAccepted = safeApps.filter(a => a.status === 'Accepted').length;
  const countRejected = safeApps.filter(a => a.status === 'Rejected').length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. PIPELINE METRIC TABS (All, Pending, Shortlisted, Accepted, Rejected) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Tất cả */}
        <button
          onClick={() => { setStageFilter('All'); setPage(1); }}
          className={`p-4 rounded-2xl flex items-center justify-between text-left transition shadow-xs cursor-pointer ${
            stageFilter === 'All'
              ? 'bg-[#1E2A4A] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Tất cả</span>
            <div className="text-xl font-black mt-0.5">{countAll}</div>
          </div>
          <span className="material-symbols-outlined text-2xl opacity-80">group</span>
        </button>

        {/* Chờ xử lý */}
        <button
          onClick={() => { setStageFilter('Pending'); setPage(1); }}
          className={`p-4 rounded-2xl flex items-center justify-between text-left transition shadow-xs cursor-pointer ${
            stageFilter === 'Pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 hover:bg-amber-50/50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">Chờ xử lý</span>
            <div className="text-xl font-black mt-0.5">{countPending}</div>
          </div>
          <span className="material-symbols-outlined text-2xl text-amber-500">hourglass_top</span>
        </button>

        {/* Danh sách ngắn */}
        <button
          onClick={() => { setStageFilter('Shortlisted'); setPage(1); }}
          className={`p-4 rounded-2xl flex items-center justify-between text-left transition shadow-xs cursor-pointer ${
            stageFilter === 'Shortlisted'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Vào DS ngắn</span>
            <div className="text-xl font-black mt-0.5">{countShortlisted}</div>
          </div>
          <span className="material-symbols-outlined text-2xl text-blue-500">verified</span>
        </button>

        {/* Chấp nhận (Accepted) */}
        <button
          onClick={() => { setStageFilter('Accepted'); setPage(1); }}
          className={`p-4 rounded-2xl flex items-center justify-between text-left transition shadow-xs cursor-pointer ${
            stageFilter === 'Accepted'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 hover:bg-emerald-50/50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Chấp nhận</span>
            <div className="text-xl font-black mt-0.5">{countAccepted}</div>
          </div>
          <span className="material-symbols-outlined text-2xl text-emerald-500">task_alt</span>
        </button>

        {/* Từ chối (Rejected) */}
        <button
          onClick={() => { setStageFilter('Rejected'); setPage(1); }}
          className={`p-4 rounded-2xl flex items-center justify-between text-left transition shadow-xs cursor-pointer ${
            stageFilter === 'Rejected'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 hover:bg-rose-50/50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Từ chối</span>
            <div className="text-xl font-black mt-0.5">{countRejected}</div>
          </div>
          <span className="material-symbols-outlined text-2xl text-rose-500">cancel</span>
        </button>
      </div>

      {/* 2. SPLIT-VIEW ATS LAYOUT (5 cols list, 7 cols candidate details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CANDIDATE APPLICANTS LIST (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Search & Filter Dock */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <span className="material-symbols-outlined text-slate-400 text-lg absolute left-3 top-2.5">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên ứng viên, email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8F9FF] dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#F8F9FF] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="">Lọc theo tất cả việc làm</option>
                {(Array.isArray(jobOptions) ? jobOptions : []).map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Applications */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-3 space-y-2 max-h-[750px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách hồ sơ...</div>
            ) : safeApps.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">sentiment_dissatisfied</span>
                <span>Không có hồ sơ nào khớp với bộ lọc.</span>
              </div>
            ) : (
              safeApps.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app);
                      fetchCandidateDetail(app.candidateId, app.id, app);
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition flex items-start justify-between gap-3 border ${
                      isSelected
                        ? 'bg-[#EFF4FF] dark:bg-slate-700/80 border-blue-400 shadow-xs'
                        : 'bg-[#F8F9FF] dark:bg-slate-700/30 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E2A4A] to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {app.candidateName ? app.candidateName.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="font-bold text-xs sm:text-sm text-[#081534] dark:text-white truncate">
                          {app.candidateName}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Vị trí: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.jobTitle}</span>
                        </p>
                        <div className="text-[10px] text-slate-400">
                          Ngày nộp: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {getStatusBadge(app.status)}
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-semibold">
                        <span className="material-symbols-outlined text-xs">attach_file</span>
                        <span>CV</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Phân trang danh sách hồ sơ ứng tuyển thông minh */}
          <SmartPagination
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[8, 16, 32, 64]}
            itemName="hồ sơ ứng tuyển"
            className="p-3"
          />
        </div>

        {/* RIGHT COLUMN: CANDIDATE DETAIL DOSSIER (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sm:p-8 flex flex-col gap-6">
          {!selectedApp ? (
            <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">contact_page</span>
              <span>Chọn một ứng viên từ danh sách bên trái để xem hồ sơ chi tiết.</span>
            </div>
          ) : loadingDetail ? (
            <div className="py-24 text-center text-xs text-slate-400">Đang tải chi tiết ứng viên...</div>
          ) : candidateDetail ? (
            <>
              {/* Header Profile Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-800 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                    {candidateDetail.fullName?.charAt(0).toUpperCase() || 'C'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-[#081534] dark:text-white">
                        {candidateDetail.fullName}
                      </h2>
                      {getStatusBadge(candidateDetail.currentApplicationStatus || selectedApp.status)}
                    </div>
                    <p className="text-xs font-semibold text-[#006A61] dark:text-[#86F2E4]">
                      Ứng tuyển: {candidateDetail.appliedPosition}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Nộp ngày: {selectedApp?.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString('vi-VN') : 'Gần đây'}</span>
                      <span>•</span>
                      <span>Mã hồ sơ: #{selectedApp?.id}</span>
                    </div>
                  </div>
                </div>

                {/* CV Download CTA */}
                {selectedApp.cvFileUrl && (
                  <a
                    href={getFullFileUrl(selectedApp.cvFileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Tải & Xem CV Gốc</span>
                  </a>
                )}
              </div>

              {/* Requirement 5: Quick Status Transition Actions */}
              <div className="p-4 rounded-2xl bg-[#EFF4FF] dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Cập nhật trạng thái duyệt đơn:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Chờ xử lý */}
                  <button
                    onClick={() => handleUpdateStatus('Pending')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedApp.status === 'Pending'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Chờ xử lý (Pending)
                  </button>

                  {/* Vào DS ngắn */}
                  <button
                    onClick={() => handleUpdateStatus('Shortlisted')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedApp.status === 'Shortlisted'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Vào danh sách ngắn (Shortlisted)
                  </button>

                  {/* Chấp nhận Offer */}
                  <button
                    onClick={() => handleUpdateStatus('Accepted')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedApp.status === 'Accepted'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Chấp nhận (Accepted)
                  </button>

                  {/* Từ chối */}
                  <button
                    onClick={() => handleUpdateStatus('Rejected')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedApp.status === 'Rejected'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Từ chối (Rejected)
                  </button>
                </div>
              </div>

              {/* Requirement 6: Thông tin liên hệ & Kỹ năng ứng viên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Email liên hệ:</span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-400 text-base">mail</span>
                    <span>{candidateDetail.email}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Số điện thoại:</span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-400 text-base">call</span>
                    <span>{candidateDetail.phoneNumber || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-400">Địa chỉ cư trú:</span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-400 text-base">location_on</span>
                    <span>{candidateDetail.address || 'Việt Nam'}</span>
                  </div>
                </div>
              </div>

              {/* Danh sách tệp CV đính kèm */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#006A61] text-base">folder_open</span>
                  <span>Tài liệu & Hồ sơ CV của ứng viên</span>
                </h4>

                <div className="space-y-2">
                  {(candidateDetail.cvs || candidateDetail.cVs || candidateDetail.CVs || []).map((cv) => (
                    <div
                      key={cv.id}
                      className="p-3.5 rounded-2xl bg-[#F8F9FF] dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-rose-500 text-2xl">picture_as_pdf</span>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{cv.title || 'Curriculum Vitae'}</div>
                          <div className="text-[10px] text-slate-400">Tải lên: {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleDateString('vi-VN') : 'Gần đây'}</div>
                        </div>
                      </div>

                      <a
                        href={getFullFileUrl(cv.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-slate-600 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        Mở xem
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lịch sử ứng tuyển vào công ty */}
              {candidateDetail.appliedJobs?.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Các vị trí khác ứng viên từng nộp vào công ty bạn:
                  </h4>
                  <div className="space-y-1.5">
                    {(candidateDetail.appliedJobs || []).map((item) => (
                      <div key={item.applicationId} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.jobTitle}</span>
                        <span className="text-[11px] text-slate-400">{getStatusBadge(item.status)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}
