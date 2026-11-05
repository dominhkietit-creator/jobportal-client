import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Application Modal & Form state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [selectedCvId, setSelectedCvId] = useState(0);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadedCvFile, setUploadedCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch job detail
  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/Jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error('Lỗi tải chi tiết việc làm:', err);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Fetch candidate profile for CV list if logged in
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    if (token && role === 'Candidate') {
      axiosClient.get('/Candidates/profile')
        .then((res) => {
          const cvList = res.data.cvs || res.data.cVs || res.data.CVs || [];
          setCandidateProfile({ ...res.data, CVs: cvList });
          if (cvList.length > 0) {
            setSelectedCvId(cvList[0].id);
          }
        })
        .catch(() => {});
    }
  }, []);

  const formatSalary = (min, max) => {
    if (!min && !max) return isEn ? 'Negotiable' : 'Thỏa thuận';
    const minM = min ? Math.round(min / 1000000) : 0;
    const maxM = max ? Math.round(max / 1000000) : 0;
    if (minM > 0 && maxM > 0) return `${minM} - ${maxM} triệu VNĐ`;
    if (minM > 0) return `Từ ${minM} triệu VNĐ`;
    return `Tới ${maxM} triệu VNĐ`;
  };

  const handleToggleSave = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      showToast(isEn ? 'Please login to save this job.' : 'Vui lòng đăng nhập để lưu việc làm.', 'info');
      return;
    }
    try {
      const res = await axiosClient.post(`/Candidates/save-job/${id}`);
      setIsSaved(!isSaved);
      showToast(res.data?.Message || (isSaved ? 'Đã bỏ lưu' : 'Đã lưu việc làm!'), 'success');
    } catch {
      showToast('Không thể lưu việc làm.', 'error');
    }
  };

  const handleCvFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      showToast('Vui lòng đăng nhập để tải lên CV.', 'warning');
      return;
    }

    setUploadingCv(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosClient.post('/Candidates/upload-cv', formData);
      showToast('Tải lên CV thành công!', 'success');
      setUploadedCvFile(file.name);
      if (res.data?.id) {
        setSelectedCvId(res.data.id);
      }
      // Refresh CVs list
      const profileRes = await axiosClient.get('/Candidates/profile');
      const cvList = profileRes.data?.cvs || profileRes.data?.cVs || profileRes.data?.CVs || [];
      setCandidateProfile({ ...profileRes.data, CVs: cvList });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể tải lên CV.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setUploadingCv(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmitApplication = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      showToast('Vui lòng đăng nhập bằng tài khoản Ứng viên để nộp hồ sơ.', 'info');
      navigate('/user-login');
      return;
    }

    if (role !== 'Candidate') {
      showToast('Chỉ tài khoản Ứng viên mới có thể nộp hồ sơ ứng tuyển.', 'warning');
      return;
    }

    setApplying(true);
    try {
      const res = await axiosClient.post('/Candidates/apply', {
        jobId: parseInt(id, 10),
        cvId: selectedCvId || 0
      });
      showToast(res.data?.Message || 'Nộp hồ sơ thành công!', 'success');
      setHasApplied(true);
      setIsApplyModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Nộp hồ sơ không thành công.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FF] dark:bg-slate-900 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-semibold">Đang tải thông tin việc làm...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAF8FF] dark:bg-slate-900 py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-3">
          ❌
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy thông tin việc làm</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">Tin tuyển dụng có thể đã hết hạn hoặc tạm dừng nhận hồ sơ.</p>
        <Link to="/jobs" className="mt-4 px-5 py-2.5 rounded-xl bg-[#00288E] text-white text-xs font-bold shadow-md">
          ← Quay lại danh sách việc làm
        </Link>
      </div>
    );
  }

  const company = job.employer?.company || {};

  return (
    <div className="w-full bg-[#FAF8FF] dark:bg-slate-900 transition-colors pb-24">
      
      {/* 1. BREADCRUMBS BAR */}
      <section className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 py-3">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Link to="/" className="hover:text-blue-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>Trang chủ</span>
            </Link>
            <span>/</span>
            <Link to="/jobs" className="hover:text-blue-600">Việc làm</Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">{job.title}</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">visibility</span>
              <span>1,842 lượt xem</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-blue-600">send</span>
              <span>48 hồ sơ đã nộp</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. SPOTLIGHT HEADER CARD */}
      <section className="pt-6 pb-4 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            
            {/* Left: Company Logo & Titles */}
            <div className="flex flex-col sm:flex-row items-start gap-5 flex-1">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 p-2 flex items-center justify-center shrink-0 shadow-xs">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#00288E] to-[#2563EB] text-white flex items-center justify-center font-black text-2xl shadow-xs">
                    {(company.companyName || 'V').charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm" title="Doanh nghiệp đã xác thực">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                </span>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                    Tuyển gấp
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                    Mã tin: #{job.id}
                  </span>
                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {job.categoryName || 'Toàn thời gian'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-[#00288E] dark:text-blue-400 text-sm flex items-center gap-1">
                    {company.companyName || 'Tập đoàn đa quốc gia'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="material-symbols-outlined text-[15px]">location_on</span>
                    {job.location || 'Toàn quốc'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleToggleSave}
                  className={`flex-1 sm:flex-initial h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                    isSaved ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSaved ? 'bookmark' : 'bookmark_border'}
                  </span>
                  <span>{isSaved ? 'Đã lưu' : 'Lưu tin'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 sm:flex-initial h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>Chia sẻ</span>
                </button>
              </div>

              {hasApplied ? (
                <div className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Đã nộp hồ sơ</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Ứng tuyển ngay</span>
                </button>
              )}
            </div>

          </div>

          {/* 6 Metric Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/80">
            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">payments</span>
                <span>Mức lương</span>
              </div>
              <p className="font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-blue-600">location_on</span>
                <span>Địa điểm</span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 truncate">
                {job.location || 'Toàn quốc'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-purple-600">work</span>
                <span>Hình thức</span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 truncate">
                {job.jobType || 'Full-time'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-amber-600">military_tech</span>
                <span>Kinh nghiệm</span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 truncate">
                1 - 3 năm
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-cyan-600">groups</span>
                <span>Số lượng tuyển</span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 truncate">
                03 người
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-rose-600">event</span>
                <span>Hạn nộp hồ sơ</span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 truncate">
                Còn 25 ngày
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TWO-COLUMN MAIN DETAILS & COMPANY INFO */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: JOB DESCRIPTION, REQUIREMENTS, BENEFITS (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Detail Content Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700 space-y-8">
              
              {/* Mô tả công việc */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-5 bg-[#00288E] dark:bg-blue-400 rounded-full"></span>
                  <span>Mô tả công việc</span>
                </h2>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                  {job.description || (
                    <>
                      <p>• Tham gia phát triển, bảo trì và tối ưu hóa hệ thống ứng dụng chính của doanh nghiệp.</p>
                      <p>• Phối hợp chặt chẽ với Product Owner, Designer và các kỹ sư phần mềm nhằm đem lại trải nghiệm người dùng mượt mà nhất.</p>
                      <p>• Tham gia xây dựng kiến trúc mở rộng, đảm bảo tính ổn định và bảo mật cao của hệ thống dữ liệu.</p>
                      <p>• Đề xuất cải tiến kỹ thuật, cập nhật công nghệ mới nhằm nâng cao hiệu suất làm việc của toàn đội ngũ.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Yêu cầu công việc */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-5 bg-emerald-600 rounded-full"></span>
                  <span>Yêu cầu ứng viên</span>
                </h2>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                  {job.requirements || (
                    <>
                      <p>• Tốt nghiệp Đại học/Cao đẳng chuyên ngành CNTT, Khoa học máy tính hoặc các ngành liên quan.</p>
                      <p>• Có kinh nghiệm làm việc thực tế từ 1 năm trở lên ở vị trí tương đương.</p>
                      <p>• Thành thạo các kỹ năng chuyên môn cốt lõi, tư duy giải quyết vấn đề linh hoạt và logic.</p>
                      <p>• Khả năng làm việc độc lập và làm việc nhóm hiệu quả, có tinh thần trách nhiệm cao.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Quyền lợi được hưởng */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
                  <span>Quyền lợi & Đãi ngộ</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Thưởng lương tháng 13 + KPI thành tích dự án hấp dẫn hàng quý.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Gói bảo hiểm sức khỏe toàn diện cao cấp cho nhân viên và gia đình.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Cấp phát Macbook Pro / Laptop cấu hình cao phục vụ công việc.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Du lịch nghỉ dưỡng hàng năm, teambuilding định kỳ, cà phê & đồ ăn nhẹ miễn phí.</span>
                  </div>
                </div>
              </div>

              {/* Địa điểm làm việc chi tiết */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-5 bg-purple-600 rounded-full"></span>
                  <span>Địa điểm làm việc</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {company.address || job.location || 'Văn phòng trụ sở công ty'}
                </p>
              </div>

            </div>

            {/* In-page Direct Application Card */}
            <div id="apply-box" className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-3xl p-6 sm:p-8 border border-blue-200/80 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00288E] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">send</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ứng tuyển vào vị trí này
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nộp CV ngay hôm nay để nhận phản hồi từ nhà tuyển dụng trong vòng 24 - 48 giờ
                  </p>
                </div>
              </div>

              {hasApplied ? (
                <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Bạn đã nộp hồ sơ thành công vào vị trí này! Hãy kiểm tra hòm thư thường xuyên để nhận thông báo.</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  <span>Mở bảng nộp hồ sơ ứng tuyển</span>
                </button>
              )}
            </div>

          </div>

          {/* RIGHT: COMPANY PROFILE & RELATED JOBS (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Company Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl font-black text-[#00288E]">
                      {(company.companyName || 'C').charAt(0)}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {company.companyName || 'Doanh nghiệp uy tín'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Đã xác minh</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-slate-400 text-base shrink-0">apartment</span>
                  <span>Quy mô: <strong>100 - 500 nhân viên</strong></span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-slate-400 text-base shrink-0">language</span>
                  <a href={company.website || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                    {company.website || 'https://company-careers.vn'}
                  </a>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-slate-400 text-base shrink-0">location_on</span>
                  <span className="line-clamp-2">{company.address || job.location || 'Hà Nội & TP.HCM'}</span>
                </div>
              </div>

              {company.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700 line-clamp-4">
                  {company.description}
                </p>
              )}
            </div>

            {/* Similar Jobs Widget */}
            {job.relatedJobs && job.relatedJobs.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                  <span>Việc làm tương tự</span>
                  <span className="text-[11px] text-blue-600 font-medium hover:underline">
                    <Link to="/jobs">Xem thêm</Link>
                  </span>
                </h3>

                <div className="space-y-3">
                  {job.relatedJobs.map((rj) => (
                    <Link
                      key={rj.id}
                      to={`/jobs/${rj.id}`}
                      className="block p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-slate-700 transition border border-slate-100 dark:border-slate-600 group"
                    >
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-blue-600 transition line-clamp-1">
                        {rj.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {rj.companyName}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[11px]">
                        <span className="font-bold text-emerald-600">
                          {formatSalary(rj.salaryMin, rj.salaryMax)}
                        </span>
                        <span className="text-slate-400">{rj.location}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 4. MODAL ỨNG TUYỂN CÔNG VIỆC */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Hồ sơ ứng tuyển</span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {job.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{company.companyName}</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-5 text-xs">
              
              {/* Chọn CV */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Chọn CV ứng tuyển <span className="text-rose-500">*</span>
                </label>

                {candidateProfile?.CVs && candidateProfile.CVs.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {candidateProfile.CVs.map((cv) => (
                      <label
                        key={cv.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedCvId === cv.id
                            ? 'border-[#00288E] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <input
                            type="radio"
                            name="selectedCv"
                            checked={selectedCvId === cv.id}
                            onChange={() => setSelectedCvId(cv.id)}
                            className="text-[#00288E]"
                          />
                          <span className="material-symbols-outlined text-rose-500 text-base">picture_as_pdf</span>
                          <span className="truncate">{cv.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(cv.uploadedAt).toLocaleDateString()}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3">
                    Bạn chưa có CV nào trong tài khoản. Hãy tải lên tệp PDF hoặc DOCX bên dưới:
                  </p>
                )}

                {/* Upload New CV Input */}
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-4 text-center hover:border-blue-500 transition bg-slate-50 dark:bg-slate-900/60">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleCvFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-2xl text-blue-600">cloud_upload</span>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {uploadingCv ? 'Đang tải lên...' : uploadedCvFile ? `Đã chọn: ${uploadedCvFile}` : 'Tải lên CV mới từ thiết bị'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ định dạng PDF, DOCX (Tối đa 10MB)</p>
                </div>
              </div>

              {/* Thư giới thiệu / Lời nhắn */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Thư giới thiệu (Cover Letter / Lời nhắn tới Nhà tuyển dụng)
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Kính gửi Nhà tuyển dụng, tôi rất ấn tượng với sứ mệnh của công ty và tự tin kinh nghiệm của mình phù hợp với vị trí..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={applying || uploadingCv}
                  className="px-6 py-2.5 rounded-xl bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {applying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang nộp...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Xác nhận nộp hồ sơ</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
