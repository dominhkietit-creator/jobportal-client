import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function EmployerDashboard() {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    activeJobList: [],
    recentApplications: [],
    companyName: 'Doanh Nghiệp Tuyển Dụng',
    employerName: 'Quản trị viên'
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/Employer/dashboard');
      setData(res.data);
    } catch (err) {
      showToast('Không thể tải dữ liệu bảng điều khiển: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const handleSwitch = () => fetchDashboard();
    window.addEventListener('company_switched', handleSwitch);
    return () => window.removeEventListener('company_switched', handleSwitch);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Đã chấp nhận</span>;
      case 'Shortlisted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Vào DS ngắn</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Từ chối</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Chờ xử lý</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. TOP COMMAND & WELCOME BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#081534] via-[#1E2A4A] to-[#0A2540] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-1/3 w-60 h-60 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cổng Tuyển Dụng Doanh Nghiệp ATS • {data.companyName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {data.employerName || 'Nhà Tuyển Dụng'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Hôm nay doanh nghiệp của bạn có <strong className="text-teal-300">{data.pendingApplications} hồ sơ ứng tuyển mới</strong> đang chờ xét duyệt và <strong className="text-white">{data.activeJobs} vị trí</strong> đang tuyển dụng tích cực.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to="/employer/jobs"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Đăng tin tuyển dụng</span>
          </Link>

          <Link
            to="/employer/applications"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition border border-white/15"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Xem tất cả ứng viên</span>
          </Link>
        </div>
      </div>

      {/* 2. STAT CARDS (Tổng số việc làm, Tổng số hồ sơ, Đang tuyển, Chờ xử lý) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số việc làm */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400">
              Tổng số việc làm
            </span>
            <div className="text-2xl font-black text-[#081534] dark:text-white">
              {loading ? '...' : data.totalJobs}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-teal-600 font-semibold">
              <span className="material-symbols-outlined text-[14px]">work_history</span>
              <span>Đã đăng trên hệ thống</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFF4FF] dark:bg-slate-700 text-[#1E2A4A] dark:text-blue-300 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl">work</span>
          </div>
        </div>

        {/* Card 2: Việc làm đang tuyển */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400">
              Việc làm đang tuyển
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : data.activeJobs}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[14px]">sensors</span>
              <span>Đang mở nhận hồ sơ</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        {/* Card 3: Tổng hồ sơ ứng tuyển */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400">
              Tổng số hồ sơ CV
            </span>
            <div className="text-2xl font-black text-[#081534] dark:text-white">
              {loading ? '...' : data.totalApplications}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Lưu lượng ứng viên</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl">group_add</span>
          </div>
        </div>

        {/* Card 4: Hồ sơ chờ duyệt */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400">
              Chờ xem xét duyệt
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {loading ? '...' : data.pendingApplications}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
              <span>Cần phản hồi sớm</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
        </div>
      </div>

      {/* 3. DUAL SECTIONS: VIỆC LÀM ĐANG TUYỂN & HỒ SƠ ỨNG TUYỂN GẦN ĐÂY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: VIỆC LÀM ĐANG TUYỂN (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#081534] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006A61] text-xl">work</span>
                <span>Việc làm đang tuyển</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Các vị trí mở tuyển gần đây nhất</p>
            </div>
            <Link
              to="/employer/jobs"
              className="text-xs font-bold text-[#006A61] hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách việc làm...</div>
          ) : data.activeJobList?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">work_off</span>
              <span>Hiện chưa có việc làm nào đang tuyển.</span>
              <Link to="/employer/jobs" className="text-[#006A61] font-bold underline mt-1">
                + Đăng tin ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.activeJobList.map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-2xl bg-[#F8F9FF] dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-blue-200 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/employer/jobs"
                        className="text-xs sm:text-sm font-bold text-[#081534] dark:text-white hover:text-blue-600 truncate block"
                      >
                        {job.title}
                      </Link>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {job.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">folder</span>
                        {job.categoryName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {job.location}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600">
                        {job.salaryMin.toLocaleString('vi-VN')} - {job.salaryMax.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-100/70 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {job.applicantCount} CV
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: HỒ SƠ ỨNG TUYỂN GẦN ĐÂY (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#081534] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl">history_edu</span>
                <span>Hồ sơ ứng tuyển mới</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ứng viên nộp hồ sơ gần đây</p>
            </div>
            <Link
              to="/employer/applications"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Đang tải hồ sơ gần đây...</div>
          ) : data.recentApplications?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">inbox</span>
              <span>Chưa có ứng viên nào nộp hồ sơ gần đây.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-2xl bg-[#F8F9FF] dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-teal-200 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 text-[#081534] dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {app.candidateName ? app.candidateName.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div className="min-w-0">
                      <Link
                        to={`/employer/applications?candidateId=${app.candidateId}&appId=${app.id}`}
                        className="text-xs font-bold text-[#081534] dark:text-white hover:text-teal-600 truncate block"
                      >
                        {app.candidateName}
                      </Link>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Ứng tuyển: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.jobTitle}</span>
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {getStatusBadge(app.status)}
                    <a
                      href={`http://localhost:5249${app.cvFileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span className="material-symbols-outlined text-xs">description</span>
                      <span>Xem CV</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
