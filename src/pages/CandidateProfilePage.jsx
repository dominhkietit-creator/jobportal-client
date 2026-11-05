import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import SmartPagination from '../components/common/SmartPagination';

export default function CandidateProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab') || 'info';
  const [activeTab, setActiveTab] = useState(tabParam); // 'info' | 'cvs' | 'saved' | 'applied' | 'password' | 'searches'

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Edit info form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // CVs
  const [cvs, setCvs] = useState([]);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [editingCvId, setEditingCvId] = useState(null);
  const [editingCvTitle, setEditingCvTitle] = useState('');
  const [savingCvTitle, setSavingCvTitle] = useState(false);

  // Saved Jobs & Applications
  const [savedJobs, setSavedJobs] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedPage, setSavedPage] = useState(1);
  const [savedPageSize, setSavedPageSize] = useState(5);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(5);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Đếm ngược OTP cooldown
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Recent Searches & Recommended Jobs
  const [recentSearches, setRecentSearches] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      setRecentSearches(stored);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Fetch candidate profile
  const fetchProfile = async (silent = false) => {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      showToast('Vui lòng đăng nhập để xem hồ sơ.', 'info');
      navigate('/user-login');
      return;
    }

    if (role === 'Employer') {
      showToast('Tài khoản Nhà tuyển dụng: chuyển hướng đến trang Quản lý hồ sơ ứng viên tuyển dụng.', 'info');
      navigate('/employer/applications');
      return;
    }

    if (role !== 'Candidate' && role !== 'Admin') {
      showToast('Vui lòng đăng nhập bằng tài khoản Ứng viên để xem hồ sơ.', 'info');
      navigate('/user-login');
      return;
    }

    if (!silent) setLoading(true);
    try {
      const res = await axiosClient.get('/Candidates/profile');
      const data = res.data;
      setProfile(data);
      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setPhoneNumber(data.phoneNumber || '');
      setAddress(data.address || '');
      setAvatarUrl(data.avatarUrl || '');

      const rawCvs = data.cvs || data.cVs || data.CVs || [];
      if (Array.isArray(rawCvs) && rawCvs.length > 0) {
        setCvs(rawCvs);
      } else {
        try {
          const cvRes = await axiosClient.get('/Candidates/cvs');
          setCvs(Array.isArray(cvRes.data) ? cvRes.data : (Array.isArray(rawCvs) ? rawCvs : []));
        } catch {
          setCvs(Array.isArray(rawCvs) ? rawCvs : []);
        }
      }
    } catch (err) {
      console.error('Lỗi tải hồ sơ ứng viên:', err);
      if (!silent) {
        showToast('Không thể tải thông tin hồ sơ ứng viên.', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch saved jobs
  const fetchSavedJobs = async () => {
    setLoadingSaved(true);
    try {
      const res = await axiosClient.get('/Candidates/saved-jobs');
      setSavedJobs(res.data || []);
    } catch {
      setSavedJobs([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await axiosClient.get('/Candidates/applications');
      setApplications(res.data || []);
    } catch {
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  // Fetch recommended jobs
  const fetchRecommendedJobs = async () => {
    setLoadingRecommended(true);
    try {
      const res = await axiosClient.get('/Jobs?page=1&pageSize=6');
      setRecommendedJobs(res.data?.data || res.data?.Data || []);
    } catch {
      setRecommendedJobs([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'saved') fetchSavedJobs();
    if (activeTab === 'applied') fetchApplications();
    if (activeTab === 'searches') fetchRecommendedJobs();
  }, [activeTab]);

  // Update profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const safeName = (fullName || '').trim();
      const safeEmail = (email || '').trim();
      const safePhone = (phoneNumber || '').trim();
      const safeAddress = (address || '').trim();
      const safeAvatar = (avatarUrl || '').trim();

      await axiosClient.put('/Candidates/profile', {
        fullName: safeName,
        email: safeEmail,
        phoneNumber: safePhone,
        address: safeAddress,
        avatarUrl: safeAvatar
      });
      showToast('Cập nhật thông tin hồ sơ thành công!', 'success');
      localStorage.setItem('user_name', safeName);
      if (safeAvatar) {
        localStorage.setItem('user_avatar', safeAvatar);
      }
      window.dispatchEvent(new CustomEvent('avatar_updated', { 
        detail: { avatarUrl: safeAvatar, userName: safeName } 
      }));
      await fetchProfile(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Cập nhật hồ sơ thất bại, vui lòng thử lại.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Direct avatar file upload (Xem trước ảnh, chỉ lưu vào hồ sơ khi bấm nút Lưu)
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const relativeUrl = res.data.imageUrl;
      const fullUrl = `https://towers-contract-toolbox-distinguished.trycloudflare.com${relativeUrl}`;
      setAvatarUrl(fullUrl);
      switchTab('info');

      showToast('Đã chọn ảnh đại diện xem trước. Vui lòng nhấn nút "Lưu thay đổi thông tin" bên dưới để áp dụng lưu.', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải lên ảnh đại diện.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload CV
  const handleUploadCv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCv(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosClient.post('/Candidates/upload-cv', formData);
      showToast('Tải lên CV mới thành công!', 'success');

      // Cập nhật ngay lập tức vào danh sách CV trên giao diện
      if (res.data?.id) {
        const newCvItem = {
          id: res.data.id,
          title: res.data.title || file.name,
          fileUrl: res.data.fileUrl,
          uploadedAt: res.data.uploadedAt || new Date().toISOString()
        };
        setCvs((prev) => [newCvItem, ...prev.filter(c => c.id !== newCvItem.id)]);
      }

      await fetchProfile(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể tải lên CV.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setUploadingCv(false);
      if (e.target) e.target.value = '';
    }
  };

  // Edit CV title
  const handleSaveCvTitle = async (cvId) => {
    if (!editingCvTitle.trim()) {
      showToast('Tiêu đề CV không được để trống.', 'warning');
      return;
    }
    setSavingCvTitle(true);
    try {
      await axiosClient.put(`/Candidates/cv/${cvId}`, { title: editingCvTitle.trim() });
      showToast('Cập nhật tên CV thành công!', 'success');
      setEditingCvId(null);
      await fetchProfile(true);
    } catch (err) {
      showToast(err.response?.data || 'Không thể cập nhật tên CV.', 'error');
    } finally {
      setSavingCvTitle(false);
    }
  };

  // Delete CV
  const handleDeleteCv = async (cvId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa CV này?')) return;
    try {
      await axiosClient.delete(`/Candidates/cv/${cvId}`);
      showToast('Đã xóa CV thành công!', 'success');
      await fetchProfile(true);
    } catch (err) {
      showToast(err.response?.data || 'Không thể xóa CV.', 'error');
    }
  };

  // Unsave job
  const handleUnsaveJob = async (jobId) => {
    try {
      await axiosClient.post(`/Candidates/save-job/${jobId}`);
      showToast('Đã xóa khỏi danh sách đã lưu', 'info');
      fetchSavedJobs();
    } catch {
      showToast('Không thể cập nhật danh sách đã lưu.', 'error');
    }
  };

  // Gửi mã OTP xác nhận đổi mật khẩu
  const handleSendPasswordOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await axiosClient.post('/Candidates/send-password-otp');
      setOtpCountdown(60);
      const targetEmail = res.data?.email || profile?.email || email || '';
      const msg = res.data?.message || `Đã gửi mã xác thực OTP tới ${targetEmail}. Vui lòng kiểm tra email của bạn.`;
      showToast(msg, 'success');
      setOtpCode(''); // Không điền sẵn, người dùng nhập thủ công từ email
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể gửi mã OTP qua email.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Xác nhận mật khẩu mới không khớp.', 'warning');
      return;
    }
    if (!otpCode.trim()) {
      showToast('Vui lòng nhập mã OTP đã gửi qua email.', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await axiosClient.post('/Candidates/change-password', {
        currentPassword,
        newPassword,
        otpCode: otpCode.trim()
      });
      showToast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setOtpCountdown(0);

      // Xóa thông tin xác thực phiên làm việc cũ và yêu cầu đăng nhập lại
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_avatar');
      window.dispatchEvent(new Event('auth_changed'));

      setTimeout(() => {
        navigate('/user-login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Đổi mật khẩu thất bại.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Clear search history
  const handleClearSearches = () => {
    localStorage.removeItem('recent_searches');
    setRecentSearches([]);
    showToast('Đã xóa toàn bộ lịch sử tìm kiếm.', 'info');
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Thỏa thuận';
    const minM = min ? Math.round(min / 1000000) : 0;
    const maxM = max ? Math.round(max / 1000000) : 0;
    if (minM > 0 && maxM > 0) return `${minM} - ${maxM} triệu VNĐ`;
    if (minM > 0) return `Từ ${minM} triệu`;
    return `Tới ${maxM} triệu`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">Đã trúng tuyển (Offer)</span>;
      case 'Shortlisted':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[11px]">Lọt phỏng vấn</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[11px]">Chưa phù hợp</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px]">Chờ xem xét</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FF] dark:bg-slate-900 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-semibold">Đang tải hồ sơ của bạn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8FF] dark:bg-slate-900 transition-colors pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/" className="hover:text-blue-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Trang chủ</span>
          </Link>
          <span>/</span>
          <span>Tài khoản ứng viên</span>
          <span>/</span>
          <span className="text-[#00288E] dark:text-blue-400 font-bold">Hồ sơ & Quản lý CV</span>
        </div>

        {/* 1. CANDIDATE PROFILE HEADER CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700 relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00288E] via-[#2563EB] to-emerald-500"></div>

          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pt-2">
            
            {/* Avatar & Core Info */}
            <div className="flex flex-col sm:flex-row items-start gap-5 flex-1">
              <div className="relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-24 h-24 rounded-2xl object-cover shadow-sm ring-4 ring-slate-100 dark:ring-slate-700" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#00288E] to-[#2563EB] text-white flex items-center justify-center font-black text-3xl shadow-sm ring-4 ring-slate-100 dark:ring-slate-700">
                    {(fullName || 'U').charAt(0)}
                  </div>
                )}
                
                {/* Upload Avatar Overlay Button */}
                <label className="absolute bottom-1 right-1 bg-white dark:bg-slate-700 text-[#00288E] dark:text-blue-400 p-1.5 rounded-full shadow-md hover:scale-105 transition cursor-pointer" title="Tải lên ảnh đại diện">
                  <span className="material-symbols-outlined text-base">
                    {uploadingAvatar ? 'hourglass_top' : 'photo_camera'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    {fullName || 'Ứng viên JobPortal'}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Tài khoản đã xác thực
                  </span>
                  <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    PRO Member
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#00288E] dark:text-blue-400">
                  Chuyên viên phát triển sự nghiệp <span className="text-slate-400 font-normal">| Đã tham gia hệ sinh thái JobPortal</span>
                </p>

                {/* Contacts Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                    <span>{profile?.email || 'ungvien@jobportal.vn'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-400">phone</span>
                    <span>{phoneNumber || 'Chưa cập nhật SĐT'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
                    <span>{address || 'Việt Nam'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions CTA */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => switchTab('cvs')}
                className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-slate-700 hover:bg-blue-100 text-[#00288E] dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                <span>Tải lên CV</span>
              </button>

              <button
                onClick={() => switchTab('info')}
                className="px-4 py-2.5 rounded-xl bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>

          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => switchTab('info')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#00288E] text-[#00288E] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">person</span>
            <span>Hồ sơ của tôi</span>
          </button>

          <button
            onClick={() => switchTab('cvs')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'cvs'
                ? 'border-[#00288E] text-[#00288E] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">description</span>
            <span>CV của tôi ({cvs.length})</span>
          </button>

          <button
            onClick={() => switchTab('applied')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'applied'
                ? 'border-[#00288E] text-[#00288E] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">send</span>
            <span>Hồ sơ đã ứng tuyển</span>
          </button>

          <button
            onClick={() => switchTab('saved')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'saved'
                ? 'border-[#00288E] text-[#00288E] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span>Việc làm đã lưu</span>
          </button>

          <button
            onClick={() => switchTab('searches')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'searches'
                ? 'border-[#00288E] text-[#00288E] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            <span>Lịch sử tìm kiếm & Gợi ý</span>
          </button>

          <button
            onClick={() => switchTab('password')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-[#00288E] text-[#00288E] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">lock</span>
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700 max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">person</span>
              <span>Cập nhật thông tin hồ sơ của bạn</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Địa chỉ Email nhận thông báo & OTP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tỉnh / Thành phố sinh sống
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Hà Nội, TP.HCM..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Đường dẫn ảnh đại diện (Avatar URL hoặc tải lên ảnh trực tiếp)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                  <label className="px-4 py-2.5 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold rounded-xl cursor-pointer hover:bg-blue-100 transition flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-base">upload</span>
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAvatar}
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>Lưu thay đổi thông tin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ CV */}
        {activeTab === 'cvs' && (
          <div className="space-y-6 max-w-3xl">
            {/* Upload Box */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Tải lên CV đính kèm mới
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Hỗ trợ định dạng PDF, DOCX (Dung lượng tệp tối đa 10MB)
              </p>

              <div className="relative border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-2xl p-6 text-center hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  disabled={uploadingCv}
                  onChange={handleUploadCv}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-3xl text-blue-600 mb-1">cloud_upload</span>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {uploadingCv ? 'Đang tải tệp lên hệ thống...' : 'Bấm vào đây để chọn tệp CV hoặc kéo thả vào khung'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Nên đặt tên CV theo mẫu: [Họ Tên] - [Vị Trí Ứng Tuyển].pdf</p>
              </div>
            </div>

            {/* List of uploaded CVs */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                Danh sách CV đã lưu ({cvs.length})
              </h3>

              {cvs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Bạn chưa tải lên CV nào. Hãy tải lên CV đầu tiên của bạn ở trên!
                </div>
              ) : (
                <div className="space-y-3">
                  {cvs.map((cv, index) => (
                    <div
                      key={cv.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          {editingCvId === cv.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingCvTitle}
                                onChange={(e) => setEditingCvTitle(e.target.value)}
                                className="px-2.5 py-1 text-xs border border-blue-400 rounded-lg bg-white dark:bg-slate-800 w-full"
                              />
                              <button
                                onClick={() => handleSaveCvTitle(cv.id)}
                                disabled={savingCvTitle}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingCvId(null)}
                                className="px-2 py-1 text-slate-400 hover:text-slate-600"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white truncate">{cv.title}</span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                                  CV Mặc định
                                </span>
                              )}
                            </div>
                          )}
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Tải lên ngày: {new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Edit Title Button */}
                        <button
                          onClick={() => {
                            setEditingCvId(cv.id);
                            setEditingCvTitle(cv.title);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                          title="Sửa tên CV"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>Sửa tên</span>
                        </button>

                        {/* View Button */}
                        {cv.fileUrl && (
                          <a
                            href={cv.fileUrl.startsWith('http') ? cv.fileUrl : `https://towers-contract-toolbox-distinguished.trycloudflare.com${cv.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Xem CV</span>
                          </a>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteCv(cv.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa CV"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HỒ SƠ ỨNG TUYỂN CỦA TÔI */}
        {activeTab === 'applied' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-5 flex items-center justify-between">
              <span>Hồ sơ ứng tuyển của tôi ({applications.length})</span>
            </h3>

            {loadingApps ? (
              <div className="text-center py-10 text-xs text-slate-400">Đang tải lịch sử ứng tuyển...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">send</span>
                <p className="text-xs">Bạn chưa nộp hồ sơ vào vị trí nào.</p>
                <Link to="/jobs" className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#00288E] text-white text-xs font-bold">
                  Tìm việc & Ứng tuyển ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications
                  .slice((appPage - 1) * appPageSize, appPage * appPageSize)
                  .map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(app.status)}
                        <span className="text-slate-400 text-[11px]">
                          Ngày ứng tuyển: {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <Link to={`/jobs/${app.jobId}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 transition">
                        {app.jobTitle}
                      </Link>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{app.companyName} • {app.location}</p>
                      <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                        {formatSalary(app.salaryMin, app.salaryMax)}
                      </span>
                    </div>

                    <div>
                      <Link
                        to={`/jobs/${app.jobId}`}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 font-semibold text-slate-700 dark:text-slate-300 inline-block text-center"
                      >
                        Chi tiết việc làm
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Phân trang lịch sử ứng tuyển thông minh */}
                <SmartPagination
                  currentPage={appPage}
                  totalItems={applications.length}
                  pageSize={appPageSize}
                  onPageChange={setAppPage}
                  onPageSizeChange={(newSize) => {
                    setAppPageSize(newSize);
                    setAppPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                  itemName="hồ sơ"
                  className="mt-4"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VIỆC LÀM ĐÃ LƯU */}
        {activeTab === 'saved' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-5 flex items-center justify-between">
              <span>Việc làm đã lưu ({savedJobs.length})</span>
              <Link to="/jobs" className="text-xs text-blue-600 hover:underline font-normal">
                + Tìm thêm việc làm
              </Link>
            </h3>

            {loadingSaved ? (
              <div className="text-center py-10 text-xs text-slate-400">Đang tải việc làm đã lưu...</div>
            ) : savedJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">bookmark_border</span>
                <p className="text-xs">Bạn chưa lưu việc làm nào.</p>
                <Link to="/jobs" className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#00288E] text-white text-xs font-bold">
                  Khám phá việc làm ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedJobs
                  .slice((savedPage - 1) * savedPageSize, savedPage * savedPageSize)
                  .map((j) => (
                  <div
                    key={j.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">{j.companyName}</p>
                      <Link to={`/jobs/${j.id}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 transition">
                        {j.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                        <span className="font-bold text-emerald-600">
                          {formatSalary(j.salaryMin, j.salaryMax)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">{j.location}</span>
                        <span>•</span>
                        <span className="text-slate-400">Đã lưu: {new Date(j.savedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUnsaveJob(j.id)}
                        className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                      >
                        Bỏ lưu
                      </button>
                      <Link
                        to={`/jobs/${j.id}`}
                        className="px-4 py-2 rounded-xl bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold shadow-xs"
                      >
                        Xem & Ứng tuyển
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Phân trang danh sách việc làm đã lưu thông minh */}
                <SmartPagination
                  currentPage={savedPage}
                  totalItems={savedJobs.length}
                  pageSize={savedPageSize}
                  onPageChange={setSavedPage}
                  onPageSizeChange={(newSize) => {
                    setSavedPageSize(newSize);
                    setSavedPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                  itemName="việc làm"
                  className="mt-4"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LỊCH SỬ TÌM KIẾM & VIỆC LÀM GỢI Ý */}
        {activeTab === 'searches' && (
          <div className="space-y-6">
            {/* Lịch sử tìm kiếm gần đây */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">manage_search</span>
                  <span>Từ khóa & Lịch sử tìm kiếm gần đây</span>
                </h3>
                {recentSearches.length > 0 && (
                  <button
                    onClick={handleClearSearches}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Xóa tất cả lịch sử
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có lịch sử tìm kiếm. Các tìm kiếm việc làm của bạn sẽ được tự động lưu lại tại đây.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <Link
                      key={i}
                      to={`/jobs?keyword=${encodeURIComponent(term)}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-blue-50 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400">search</span>
                      <span>{term}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Việc làm gợi ý & liên quan */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">recommend</span>
                <span>Việc làm gợi ý cho bạn dựa trên hồ sơ & thị trường</span>
              </h3>

              {loadingRecommended ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tìm việc làm phù hợp...</div>
              ) : recommendedJobs.length === 0 ? (
                <p className="text-xs text-slate-400">Hiện chưa có gợi ý việc làm mới.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{j.companyName}</span>
                        <Link to={`/jobs/${j.id}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 block">
                          {j.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{j.location}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-600">{formatSalary(j.salaryMin, j.salaryMax)}</span>
                        </div>
                      </div>
                      <Link
                        to={`/jobs/${j.id}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] shrink-0"
                      >
                        Ứng tuyển
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ĐỔI MẬT KHẨU */}
        {activeTab === 'password' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700 max-w-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">lock_reset</span>
              <span>Đổi mật khẩu tài khoản</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu của bạn với bất kỳ ai.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Mã OTP gửi qua Email */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-700/40 border border-blue-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 dark:text-slate-100">
                    Mã xác thực OTP gửi qua Email <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={sendingOtp || otpCountdown > 0}
                    onClick={handleSendPasswordOtp}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {sendingOtp ? (
                      <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">mail</span>
                    )}
                    <span>
                      {otpCountdown > 0 ? `Gửi lại sau (${otpCountdown}s)` : 'Gửi mã OTP qua email'}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập 6 số OTP (vd: 123456)"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Hệ thống sẽ gửi mã bảo mật 6 chữ số đến địa chỉ email đăng ký của bạn ({profile?.email || 'email của bạn'}).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2.5 bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">vpn_key</span>
                      <span>Cập nhật mật khẩu mới</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
