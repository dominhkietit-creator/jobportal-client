import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { LanguageToggle, useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEn } = useLanguage();

  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Ứng viên');
  const [userRole, setUserRole] = useState(localStorage.getItem('user_role') || 'Candidate');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || '');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar') || '');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync auth state & avatar on storage or custom event changes
  const updateAuthFromStorage = () => {
    const currentToken = localStorage.getItem('jwt_token');
    setToken(currentToken);
    setUserName(localStorage.getItem('user_name') || 'Ứng viên');
    setUserRole(localStorage.getItem('user_role') || 'Candidate');
    setUserEmail(localStorage.getItem('user_email') || '');
    setUserAvatar(localStorage.getItem('user_avatar') || '');

    // If logged in as Candidate and no avatar cached yet, fetch from profile
    if (currentToken && localStorage.getItem('user_role') === 'Candidate' && !localStorage.getItem('user_avatar')) {
      axiosClient.get('/Candidates/profile')
        .then((res) => {
          if (res.data?.avatarUrl) {
            setUserAvatar(res.data.avatarUrl);
            localStorage.setItem('user_avatar', res.data.avatarUrl);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    updateAuthFromStorage();

    const handleStorageChange = () => updateAuthFromStorage();
    const handleAuthChanged = () => updateAuthFromStorage();
    const handleAvatarUpdated = (e) => {
      const newUrl = e.detail?.avatarUrl || localStorage.getItem('user_avatar') || '';
      setUserAvatar(newUrl);
      const newName = e.detail?.userName || localStorage.getItem('user_name');
      if (newName) setUserName(newName);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth_changed', handleAuthChanged);
    window.addEventListener('avatar_updated', handleAvatarUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth_changed', handleAuthChanged);
      window.removeEventListener('avatar_updated', handleAvatarUpdated);
    };
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Khi đăng xuất thì chuyển về trang chủ với vai trò là khách
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_avatar');
    setToken(null);
    setUserAvatar('');
    setUserRole('Guest');
    setIsUserDropdownOpen(false);
    window.dispatchEvent(new Event('auth_changed'));
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 left-0 right-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_8px_rgba(15,23,42,0.05)] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00288E] via-[#1E40AF] to-[#2563EB] text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[#00288E] dark:text-blue-400 leading-none">
                Job<span className="text-emerald-600 dark:text-emerald-400">Portal</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">
                Career Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
            <Link
              to="/"
              className={`transition-colors py-1 ${
                isActive('/') 
                  ? 'text-[#00288E] dark:text-blue-400 font-bold border-b-2 border-[#00288E] dark:border-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#00288E] dark:hover:text-blue-400'
              }`}
            >
              {isEn ? 'Home' : 'Trang chủ'}
            </Link>

            <Link
              to="/jobs"
              className={`transition-colors py-1 flex items-center gap-1.5 ${
                isActive('/jobs') 
                  ? 'text-[#00288E] dark:text-blue-400 font-bold border-b-2 border-[#00288E] dark:border-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#00288E] dark:hover:text-blue-400'
              }`}
            >
              <span>{isEn ? 'Find Jobs' : 'Tìm việc làm'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                HOT
              </span>
            </Link>

            {/* Chỉ hiển thị link Hồ sơ & CV nếu là Ứng viên */}
            {token && userRole === 'Candidate' && (
              <Link
                to="/candidate/profile"
                className={`transition-colors py-1 ${
                  isActive('/candidate/profile') 
                    ? 'text-[#00288E] dark:text-blue-400 font-bold border-b-2 border-[#00288E] dark:border-blue-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#00288E] dark:hover:text-blue-400'
                }`}
              >
                {isEn ? 'Candidate Profile & CV' : 'Hồ sơ & Quản lý CV'}
              </Link>
            )}

            {/* Link Dành cho NTD chỉ khi đã đăng nhập với vai trò Employer */}
            {token && (userRole === 'Employer' || userRole === 'Admin') && (
              <Link
                to="/employer"
                className="transition-colors py-1 text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">business_center</span>
                <span>{isEn ? 'Employer Hub' : 'Cổng NTD'}</span>
              </Link>
            )}

            {/* Link Admin chỉ khi là Admin */}
            {token && userRole === 'Admin' && (
              <Link
                to="/admin"
                className="transition-colors py-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>{isEn ? 'Admin Portal' : 'Cổng Quản Trị'}</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions: Role Selector, Toggles & Auth */}
        <div className="flex items-center gap-3">
          
          {/* Quick Audience Switcher Pill: CHỈ HIỂN THỊ KHI CHƯA ĐĂNG NHẬP (Yêu cầu đề bài) */}
          {!token && (
            <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs font-semibold">
              <Link
                to="/register?role=candidate"
                className="px-3 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs hover:text-blue-600 transition"
              >
                {isEn ? 'Candidate' : 'Ứng viên'}
              </Link>
              <Link
                to="/register?role=employer"
                className="px-3 py-1 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                {isEn ? 'For Employers' : 'Nhà tuyển dụng'}
              </Link>
            </div>
          )}

          {/* Theme & Language Toggles */}
          <div className="hidden sm:flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Authentication State */}
          {token ? (
            /* Logged in User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-9 h-9 rounded-xl object-cover shadow-sm ring-2 ring-blue-100 dark:ring-blue-900"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-blue-100 dark:ring-blue-900">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {userName}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                    {userRole === 'Admin' ? 'Admin' : userRole === 'Employer' ? 'Nhà tuyển dụng' : 'Ứng viên'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm hidden md:block">
                  expand_more
                </span>
              </button>

              {/* Dropdown Card */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        {userRole === 'Admin' ? 'Quản trị viên' : userRole === 'Employer' ? 'Nhà tuyển dụng' : 'Ứng viên tìm việc'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 text-xs text-slate-700 dark:text-slate-200">
                    {userRole === 'Candidate' && (
                      <>
                        <Link
                          to="/candidate/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          <span className="material-symbols-outlined text-lg text-slate-400">person</span>
                          <span>{isEn ? 'My Profile & CV' : 'Hồ sơ & CV của tôi'}</span>
                        </Link>

                        <Link
                          to="/candidate/profile?tab=saved"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          <span className="material-symbols-outlined text-lg text-slate-400">bookmark</span>
                          <span>{isEn ? 'Saved Jobs' : 'Việc làm đã lưu'}</span>
                        </Link>

                        <Link
                          to="/candidate/profile?tab=applied"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          <span className="material-symbols-outlined text-lg text-slate-400">send</span>
                          <span>{isEn ? 'Applied Jobs' : 'Việc làm đã ứng tuyển'}</span>
                        </Link>
                      </>
                    )}

                    {userRole === 'Employer' && (
                      <>
                        <Link
                          to="/employer"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold transition"
                        >
                          <span className="material-symbols-outlined text-lg">dashboard</span>
                          <span>{isEn ? 'Employer Dashboard' : 'Bảng điều khiển NTD'}</span>
                        </Link>
                        <Link
                          to="/employer/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-200"
                        >
                          <span className="material-symbols-outlined text-lg text-slate-400">account_circle</span>
                          <span>{isEn ? 'Recruiter Profile' : 'Hồ sơ cá nhân NTD'}</span>
                        </Link>
                      </>
                    )}

                    {userRole === 'Admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold transition"
                      >
                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                        <span>{isEn ? 'Admin Management' : 'Trang Quản Trị Hệ Thống'}</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      <span>{isEn ? 'Sign Out' : 'Đăng xuất tài khoản'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged out Action Buttons */
            <div className="flex items-center gap-2">
              <Link
                to="/user-login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#00288E] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isEn ? 'Sign In' : 'Đăng nhập'}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00288E] hover:bg-[#1E40AF] text-white shadow-sm hover:shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <span>{isEn ? 'Sign Up' : 'Đăng ký'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1 text-sm font-semibold">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isEn ? 'Home' : 'Trang chủ'}
            </Link>
            <Link
              to="/jobs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>{isEn ? 'Find Jobs' : 'Tìm việc làm'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">HOT</span>
            </Link>
            {token && userRole === 'Candidate' && (
              <Link
                to="/candidate/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {isEn ? 'Candidate Profile & CV' : 'Hồ sơ & Quản lý CV'}
              </Link>
            )}
            {token && userRole === 'Employer' && (
              <Link
                to="/employer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-teal-600 dark:text-teal-400 font-bold"
              >
                {isEn ? 'Employer Hub' : 'Cổng Nhà Tuyển Dụng'}
              </Link>
            )}
            {token && userRole === 'Admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold"
              >
                {isEn ? 'Admin Portal' : 'Cổng Quản Trị'}
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {!token && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <Link
                  to="/register?role=candidate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-700 dark:text-slate-300 hover:text-blue-600"
                >
                  {isEn ? 'Candidate' : 'Ứng viên'}
                </Link>
                <span className="text-slate-400">•</span>
                <Link
                  to="/register?role=employer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-500 hover:text-blue-600"
                >
                  {isEn ? 'Employer' : 'Nhà tuyển dụng'}
                </Link>
              </div>
            )}

            {!token && (
              <div className="flex items-center gap-2">
                <Link
                  to="/user-login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {isEn ? 'Sign In' : 'Đăng nhập'}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00288E] text-white"
                >
                  {isEn ? 'Sign Up' : 'Đăng ký'}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
