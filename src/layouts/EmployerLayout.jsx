import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import OnlinePaymentModal from '../components/employer/OnlinePaymentModal';

export default function EmployerLayout() {
  const navigate = useNavigate();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'Đang tải...',
    logoUrl: '',
    position: 'HR Manager'
  });
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar') || '');

  // Wallet & Online Payment state
  const [walletBalance, setWalletBalance] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Multi-company state
  const [myCompanies, setMyCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    Number(localStorage.getItem('active_company_id')) || null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('join'); // 'join' | 'create'
  
  // Available companies for joining
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedJoinCompanyId, setSelectedJoinCompanyId] = useState('');
  const [joinPosition, setJoinPosition] = useState('Chuyên viên tuyển dụng');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);

  // Create new company form
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyPosition, setNewCompanyPosition] = useState('Giám đốc nhân sự (HR Director)');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newCompanyDesc, setNewCompanyDesc] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const dropdownRef = useRef(null);

  const loadMyCompanies = async () => {
    try {
      const res = await axiosClient.get('/Employer/my-companies');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setMyCompanies(res.data);
        const stored = Number(localStorage.getItem('active_company_id'));
        const found = res.data.find(c => c.companyId === stored);
        const active = found || res.data[0];
        
        setSelectedCompanyId(active.companyId);
        localStorage.setItem('active_company_id', active.companyId);
        setCompanyInfo({
          companyName: active.companyName,
          logoUrl: active.logoUrl || '',
          position: active.position || 'HR'
        });
      }
    } catch (e) {
      console.error('Không thể tải danh sách công ty:', e);
    }
  };

  const loadAvailableCompanies = async () => {
    try {
      const res = await axiosClient.get('/Employer/companies/available');
      if (Array.isArray(res.data)) {
        setAvailableCompanies(res.data);
        if (res.data.length > 0 && !selectedJoinCompanyId) {
          setSelectedJoinCompanyId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    const storedEmail = localStorage.getItem('user_email');
    const storedAvatar = localStorage.getItem('user_avatar');
    setUserName(storedName || 'Nhà Tuyển Dụng');
    setUserEmail(storedEmail || 'recruiter@jobportal.vn');
    setUserAvatar(storedAvatar || '');

    loadMyCompanies();

    // Fetch Wallet balance
    const fetchWallet = () => {
      axiosClient.get('/Employer/wallet')
        .then(res => {
          if (res.data?.balance !== undefined) setWalletBalance(res.data.balance);
        })
        .catch(() => {});
    };
    fetchWallet();

    const handleProfileUpdated = (e) => {
      if (e.detail?.fullName) setUserName(e.detail.fullName);
      if (e.detail?.avatarUrl !== undefined) setUserAvatar(e.detail.avatarUrl);
      if (e.detail?.position) setCompanyInfo(prev => ({ ...prev, position: e.detail.position }));
    };

    const handleCompanySwitched = () => {
      loadMyCompanies();
    };

    const handleWalletUpdated = (e) => {
      if (e.detail?.newBalance !== undefined) {
        setWalletBalance(e.detail.newBalance);
      } else {
        fetchWallet();
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('employer_profile_updated', handleProfileUpdated);
    window.addEventListener('company_switched', handleCompanySwitched);
    window.addEventListener('wallet_updated', handleWalletUpdated);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('employer_profile_updated', handleProfileUpdated);
      window.removeEventListener('company_switched', handleCompanySwitched);
      window.removeEventListener('wallet_updated', handleWalletUpdated);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSwitchCompany = (comp) => {
    setSelectedCompanyId(comp.companyId);
    localStorage.setItem('active_company_id', comp.companyId);
    setCompanyInfo({
      companyName: comp.companyName,
      logoUrl: comp.logoUrl || '',
      position: comp.position || 'HR'
    });
    setDropdownOpen(false);
    showToast(`Đã chuyển sang công ty: ${comp.companyName}`, 'success');
    window.dispatchEvent(new CustomEvent('company_switched', { detail: comp }));
  };

  const handleOpenModal = () => {
    setDropdownOpen(false);
    setShowModal(true);
    loadAvailableCompanies();
  };

  const handleJoinCompanySubmit = async (e) => {
    e.preventDefault();
    if (!selectedJoinCompanyId) {
      showToast('Vui lòng chọn công ty để gia nhập.', 'warning');
      return;
    }
    try {
      setIsSubmittingJoin(true);
      const res = await axiosClient.post('/Employer/companies/join', {
        companyId: Number(selectedJoinCompanyId),
        position: joinPosition.trim() || 'Chuyên viên tuyển dụng'
      });
      showToast(res.data?.message || 'Gia nhập công ty thành công!', 'success');
      localStorage.setItem('active_company_id', selectedJoinCompanyId);
      await loadMyCompanies();
      window.dispatchEvent(new CustomEvent('company_switched'));
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gia nhập thất bại.', 'error');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleCreateCompanySubmit = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      showToast('Vui lòng nhập tên công ty.', 'warning');
      return;
    }
    try {
      setIsSubmittingCreate(true);
      const res = await axiosClient.post('/Employer/companies/create', {
        companyName: newCompanyName.trim(),
        position: newCompanyPosition.trim() || 'HR Director',
        website: newCompanyWebsite.trim(),
        address: newCompanyAddress.trim(),
        description: newCompanyDesc.trim()
      });
      showToast('Tạo và liên kết công ty mới thành công!', 'success');
      if (res.data?.companyId) {
        localStorage.setItem('active_company_id', res.data.companyId);
      }
      await loadMyCompanies();
      window.dispatchEvent(new CustomEvent('company_switched'));
      setShowModal(false);
      // Reset form
      setNewCompanyName('');
      setNewCompanyWebsite('');
      setNewCompanyAddress('');
      setNewCompanyDesc('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Tạo công ty thất bại.', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('active_company_id');
    window.dispatchEvent(new Event('auth_changed'));
    showToast('Đã đăng xuất khỏi Cổng Nhà Tuyển Dụng', 'info');
    navigate('/');
  };

  const navItems = [
    {
      to: '/employer',
      label: isEn ? 'Dashboard' : 'Bảng điều khiển',
      icon: 'dashboard',
      end: true
    },
    {
      to: '/employer/jobs',
      label: isEn ? 'Job Management' : 'Quản lý việc làm',
      icon: 'work_outline'
    },
    {
      to: '/employer/applications',
      label: isEn ? 'Applications' : 'Hồ sơ ứng tuyển',
      icon: 'group'
    },
    {
      to: '/employer/company',
      label: isEn ? 'Company Profile' : 'Hồ sơ công ty',
      icon: 'domain'
    },
    {
      to: '/employer/profile',
      label: isEn ? 'My Profile' : 'Hồ sơ cá nhân',
      icon: 'account_circle'
    },
    {
      to: '/employer/billing',
      label: isEn ? 'Wallet & Billing' : 'Ví tiền & Thanh toán',
      icon: 'account_balance_wallet'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-slate-900 text-[#0B1C30] dark:text-slate-100 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-r border-slate-100 dark:border-slate-700/60 z-50 flex flex-col justify-between py-4">
        <div className="flex flex-col gap-6">
          {/* Logo brand */}
          <div className="flex items-center gap-3 px-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#081534] via-[#1E2A4A] to-[#00288E] text-white flex items-center justify-center font-bold text-xl shadow-md">
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <div className="flex flex-col min-w-0">
              <Link to="/employer" className="font-extrabold text-lg tracking-tight text-[#081534] dark:text-white leading-none">
                Job<span className="text-[#006A61] dark:text-[#86F2E4]">Portal</span>
              </Link>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold mt-1">
                Cổng Tuyển Dụng
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-[#1E2A4A] text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-[#EFF4FF] dark:hover:bg-slate-700/60 hover:text-[#081534] dark:hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
          <Link
            to="/jobs"
            target="_blank"
            className="flex items-center justify-between p-2.5 bg-[#EFF4FF] dark:bg-slate-700/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-100/60 transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006A61] text-[18px]">open_in_new</span>
              <span className="font-medium">Xem trang việc làm</span>
            </div>
            <span className="text-[11px] font-bold text-blue-600">Client</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition w-full font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="pl-64">
        {/* TOP HEADER */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xs border-b border-slate-100 dark:border-slate-700/60 z-40 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="flex items-center gap-2 bg-[#EFF4FF] dark:bg-slate-900/60 px-3.5 py-1.5 rounded-xl w-full text-xs border border-transparent focus-within:border-blue-300">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                className="bg-transparent border-none outline-none w-full text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                placeholder="Tìm việc làm, ứng viên, kỹ năng tuyển dụng..."
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/employer/applications?search=${e.target.value}`);
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Wallet Balance Pill & Quick Deposit Button */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-xs shadow-xs">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">account_balance_wallet</span>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[10px] text-slate-400 font-semibold">Ví tuyển dụng</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                  {walletBalance.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                title="Nạp tiền trực tuyến vào tài khoản"
              >
                + Nạp
              </button>
            </div>

            {/* Multi-Company Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-[#EFF4FF] dark:bg-slate-700/70 hover:bg-[#E2ECFF] dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-[#081534] dark:text-slate-100 transition border border-blue-200/60 dark:border-slate-600 cursor-pointer shadow-xs"
                title="Nhấn để chuyển đổi giữa các công ty bạn đang làm việc"
              >
                <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                  {companyInfo.logoUrl ? (
                    <img src={companyInfo.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[14px] text-[#006A61]">corporate_fare</span>
                  )}
                </div>
                <span className="max-w-[150px] truncate text-left">{companyInfo.companyName}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  {dropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2 mb-1">
                    <span>Công ty của bạn ({myCompanies.length})</span>
                    <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded font-mono">Đa công ty</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                    {myCompanies.map((c) => {
                      const isActive = c.companyId === selectedCompanyId;
                      return (
                        <button
                          key={c.companyId}
                          type="button"
                          onClick={() => handleSwitchCompany(c)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition cursor-pointer ${
                            isActive
                              ? 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold border border-teal-200/80 dark:border-teal-800/60'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              {c.logoUrl ? (
                                <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-slate-400">domain</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs">{c.companyName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{c.position || 'Chuyên viên tuyển dụng'}</p>
                            </div>
                          </div>
                          {isActive && (
                            <span className="material-symbols-outlined text-teal-600 text-[18px] shrink-0 ml-2">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_business</span>
                      <span>+ Gia nhập / Tạo công ty mới</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User profile quick link */}
            <Link
              to="/employer/profile"
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-700 hover:opacity-85 transition cursor-pointer"
              title="Xem và chỉnh sửa hồ sơ cá nhân"
            >
              <div className="flex flex-col text-right leading-none">
                <span className="font-bold text-xs text-[#081534] dark:text-white truncate max-w-[140px]">{userName}</span>
                <span className="text-[10px] text-slate-400 mt-1">{companyInfo.position}</span>
              </div>
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover shadow-xs ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* MAIN BODY OUTLET */}
        <main className="pt-20 px-6 pb-12 min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* MODAL: GIA NHẬP / TẠO CÔNG TY MỚI */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 transition-all scale-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 relative flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006A61]">domain_add</span>
                  <span>Liên kết công ty tuyển dụng</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Làm việc linh hoạt cho nhiều doanh nghiệp trên cùng 1 tài khoản
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setModalTab('join')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'join'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">group_add</span>
                <span>Gia nhập công ty có sẵn</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('create')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'create'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Tạo công ty mới</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modalTab === 'join' ? (
                <form onSubmit={handleJoinCompanySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Chọn công ty muốn tham gia
                    </label>
                    <select
                      value={selectedJoinCompanyId}
                      onChange={(e) => setSelectedJoinCompanyId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                    >
                      {availableCompanies.length === 0 ? (
                        <option value="">Không có công ty khả dụng (hoặc bạn đã tham gia hết)</option>
                      ) : (
                        availableCompanies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName} {c.address ? `(${c.address})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Chức vụ / Vị trí tại công ty này
                    </label>
                    <input
                      type="text"
                      value={joinPosition}
                      onChange={(e) => setJoinPosition(e.target.value)}
                      placeholder="VD: Senior Talent Acquisition, HR Manager..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingJoin || availableCompanies.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingJoin ? 'Đang tham gia...' : 'Gia nhập ngay'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateCompanySubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Tên công ty / Doanh nghiệp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="VD: FPT Software, VNG Corporation..."
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Chức vụ của bạn tại công ty này <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCompanyPosition}
                      onChange={(e) => setNewCompanyPosition(e.target.value)}
                      placeholder="VD: Trưởng phòng tuyển dụng, HR Director..."
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Địa chỉ trụ sở
                      </label>
                      <input
                        type="text"
                        value={newCompanyAddress}
                        onChange={(e) => setNewCompanyAddress(e.target.value)}
                        placeholder="Hà Nội, TP.HCM..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Website công ty
                      </label>
                      <input
                        type="url"
                        value={newCompanyWebsite}
                        onChange={(e) => setNewCompanyWebsite(e.target.value)}
                        placeholder="https://company.vn"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Mô tả ngắn gọn về công ty
                    </label>
                    <textarea
                      rows={2}
                      value={newCompanyDesc}
                      onChange={(e) => setNewCompanyDesc(e.target.value)}
                      placeholder="Giới thiệu sơ lược về ngành nghề và sứ mệnh công ty..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCreate}
                      className="px-5 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingCreate ? 'Đang tạo...' : 'Tạo và liên kết'}
                    </button>
                  </div>
                </form>
              )}
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
      />
    </div>
  );
}
