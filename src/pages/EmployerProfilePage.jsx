import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function EmployerProfilePage() {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'company' | 'password'
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile data
  const [profile, setProfile] = useState({
    id: 0,
    userId: 0,
    fullName: '',
    email: '',
    phoneNumber: '',
    avatarUrl: '',
    position: 'HR Manager',
    companyId: 0,
    companyName: '',
    companyLogo: '',
    companyAddress: '',
    companyWebsite: '',
    createdAt: ''
  });

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [position, setPosition] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Multi-company list in Tab 2
  const [companiesList, setCompaniesList] = useState([]);
  const [activeCompId, setActiveCompId] = useState(
    Number(localStorage.getItem('active_company_id')) || 0
  );

  const fetchMyCompanies = async () => {
    try {
      const res = await axiosClient.get('/Employer/my-companies');
      if (Array.isArray(res.data)) {
        setCompaniesList(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch employer personal profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/Employer/profile');
      const data = res.data;
      setProfile(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setAvatarUrl(data.avatarUrl || '');
      setPosition(data.position || 'HR Manager');
      if (data.companyId) {
        setActiveCompId(data.companyId);
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ nhà tuyển dụng:', err);
      showToast('Không thể tải thông tin hồ sơ nhà tuyển dụng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyCompanies();

    const handleSwitched = () => {
      fetchProfile();
      fetchMyCompanies();
    };
    window.addEventListener('company_switched', handleSwitched);
    return () => window.removeEventListener('company_switched', handleSwitched);
  }, []);

  const handleSwitchActive = (c) => {
    localStorage.setItem('active_company_id', c.companyId);
    setActiveCompId(c.companyId);
    showToast(`Đã chuyển sang công ty: ${c.companyName}`, 'success');
    window.dispatchEvent(new CustomEvent('company_switched', { detail: c }));
    fetchProfile();
    fetchMyCompanies();
  };

  const handleLeaveCompany = async (companyId, companyName) => {
    if (companiesList.length <= 1) {
      showToast('Bạn phải thuộc ít nhất một công ty, không thể rời công ty duy nhất!', 'warning');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn rời khỏi công ty "${companyName}" không?`)) {
      return;
    }
    try {
      await axiosClient.delete(`/Employer/companies/${companyId}/leave`);
      showToast(`Đã rời khỏi công ty ${companyName}`, 'success');
      if (activeCompId === companyId) {
        localStorage.removeItem('active_company_id');
      }
      fetchMyCompanies();
      fetchProfile();
      window.dispatchEvent(new CustomEvent('company_switched'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể rời công ty.', 'error');
    }
  };

  // Upload avatar file (CHỈ XEM TRƯỚC, CHỈ LƯU VÀO DATABASE KHI BẤM NÚT LƯU)
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Vui lòng chọn ảnh dung lượng dưới 5MB.', 'warning');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const relativeUrl = res.data.imageUrl;
      const fullUrl = `https://nato-feat-petersburg-runtime.trycloudflare.com${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
      setAvatarUrl(fullUrl);

      showToast('Đã chọn ảnh đại diện xem trước. Vui lòng nhấn nút "Lưu thay đổi thông tin" bên dưới để áp dụng lưu.', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải ảnh đại diện lên máy chủ.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit personal info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const safeName = fullName.trim();
    if (!safeName) {
      showToast('Họ và tên không được để trống.', 'warning');
      return;
    }

    try {
      setSavingInfo(true);
      const res = await axiosClient.put('/Employer/profile', {
        fullName: safeName,
        phoneNumber: phoneNumber.trim(),
        avatarUrl: avatarUrl.trim(),
        position: position.trim()
      });

      showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
      localStorage.setItem('user_name', safeName);
      if (avatarUrl.trim()) {
        localStorage.setItem('user_avatar', avatarUrl.trim());
      }
      window.dispatchEvent(new CustomEvent('employer_profile_updated', {
        detail: { fullName: safeName, avatarUrl: avatarUrl.trim(), position: position.trim() }
      }));
      window.dispatchEvent(new Event('auth_changed'));

      if (res.data?.profile) {
        setProfile(prev => ({
          ...prev,
          fullName: res.data.profile.fullName,
          phoneNumber: res.data.profile.phoneNumber,
          avatarUrl: res.data.profile.avatarUrl,
          position: res.data.profile.position
        }));
      }
    } catch (err) {
      showToast('Lỗi khi lưu thông tin: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  // Submit change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại.', 'warning');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'warning');
      return;
    }

    try {
      setChangingPassword(true);
      await axiosClient.put('/Employer/profile/password', {
        currentPassword,
        newPassword
      });

      showToast('Đổi mật khẩu thành công! Hãy lưu mật khẩu mới cẩn thận.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Đổi mật khẩu thất bại, vui lòng kiểm tra lại.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
        <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
        <span>Đang nạp hồ sơ nhà tuyển dụng...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* 1. TOP PROFILE HERO CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/80 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar frame */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-24 h-24 rounded-2xl object-cover shadow-sm ring-4 ring-slate-100 dark:ring-slate-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#006A61] via-[#0A2540] to-[#081534] text-white flex items-center justify-center font-black text-3xl shadow-sm ring-4 ring-slate-100 dark:ring-slate-700">
                {(fullName || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Upload Button Overlay */}
            <label
              className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-700 text-[#006A61] dark:text-teal-400 p-2 rounded-full shadow-md hover:scale-105 transition cursor-pointer border border-slate-200 dark:border-slate-600"
              title="Tải lên ảnh đại diện mới"
            >
              <span className="material-symbols-outlined text-[18px]">
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

          {/* User info details */}
          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {fullName || 'Chuyên viên tuyển dụng'}
              </h1>
              <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>{position || 'Nhà tuyển dụng'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Công ty: <strong className="text-slate-700 dark:text-slate-200">{profile.companyName || 'Doanh Nghiệp Tuyển Dụng'}</strong>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                <span>{profile.email}</span>
              </div>
              {phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                  <span>{phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick link to company profile */}
          <div className="shrink-0 flex items-center gap-2">
            <Link
              to="/employer/company"
              className="px-4 py-2.5 rounded-xl bg-[#EFF4FF] dark:bg-slate-700 text-[#081534] dark:text-slate-200 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span>Hồ sơ công ty</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 text-xs font-bold">
        <button
          onClick={() => setActiveTab('info')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'info'
              ? 'border-[#006A61] text-[#006A61] dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">person</span>
          <span>Thông tin cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'company'
              ? 'border-[#006A61] text-[#006A61] dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">corporate_fare</span>
          <span>Doanh nghiệp liên kết</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'password'
              ? 'border-[#006A61] text-[#006A61] dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">lock</span>
          <span>Đổi mật khẩu & Bảo mật</span>
        </button>
      </div>

      {/* 3. TAB 1: THÔNG TIN CÁ NHÂN */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/80">
          <form onSubmit={handleSaveInfo} className="space-y-5">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006A61]">badge</span>
              <span>Thông tin tài khoản nhà tuyển dụng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <span>Họ và tên</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Hoàng"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61] transition"
                />
              </div>

              {/* Chức danh tuyển dụng */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Chức danh / Vị trí công tác
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="VD: HR Director / Talent Acquisition Lead"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61] transition"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <span>Email đăng nhập</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Đã xác thực</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61] transition"
                />
              </div>

              {/* Link ảnh đại diện */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Đường dẫn ảnh đại diện cá nhân (Avatar URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                  />
                  <label className="px-4 py-2.5 bg-teal-50 dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-teal-100 transition flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-base">upload_file</span>
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
                <p className="text-[11px] text-slate-400">
                  Ảnh đại diện sẽ hiển thị trên Header và đại diện cho doanh nghiệp khi phản hồi ứng viên.
                </p>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingInfo}
                className="px-6 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingInfo ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Lưu thay đổi thông tin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. TAB 2: DOANH NGHIỆP LIÊN KẾT (ĐA CÔNG TY) */}
      {activeTab === 'company' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006A61]">domain</span>
                <span>Doanh nghiệp liên kết ({companiesList.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tài khoản của bạn có thể làm việc cho nhiều công ty khác nhau. Nhấn "Kích hoạt" để chuyển đổi không gian làm việc.
              </p>
            </div>

            <Link
              to="/employer/company"
              className="px-4 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">domain_verification</span>
              <span>Hồ sơ công ty đang chọn</span>
            </Link>
          </div>

          {/* Danh sách các công ty của nhà tuyển dụng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companiesList.map((c) => {
              const isActive = c.companyId === activeCompId;
              return (
                <div
                  key={c.companyId}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isActive
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-slate-400">corporate_fare</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {c.companyName}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Đang kích hoạt
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                        {c.position || 'Chuyên viên tuyển dụng'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        📍 {c.address || 'Việt Nam'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <strong>{c.totalJobs || 0}</strong> việc làm
                    </span>

                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Đang làm việc</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchActive(c)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          Chuyển sang
                        </button>
                      )}

                      {companiesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleLeaveCompany(c.companyId, c.companyName)}
                          className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Rời khỏi doanh nghiệp này"
                        >
                          <span className="material-symbols-outlined text-[16px]">logout</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-teal-600 text-base">info</span>
              <span>Cơ chế quản lý đa công ty</span>
            </div>
            <p>
              Mỗi khi bạn chuyển đổi công ty (trên thanh Header hoặc tại trang này), toàn bộ bảng tin tuyển dụng, hồ sơ ứng tuyển, và thống kê báo cáo sẽ tự động chuyển sang dữ liệu tương ứng của doanh nghiệp đó.
            </p>
          </div>
        </div>
      )}

      {/* 5. TAB 3: ĐỔI MẬT KHẨU & BẢO MẬT */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/80">
          <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006A61]">lock_reset</span>
              <span>Thay đổi mật khẩu đăng nhập</span>
            </h3>

            {/* Mật khẩu hiện tại */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ của bạn"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showCurrentPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {changingPassword ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    <span>Cập nhật mật khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
