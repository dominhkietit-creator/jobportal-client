import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { SearchIcon, XIcon, StatusBadge } from '../components/admin/AdminCommon';
import { ThemeToggle } from '../contexts/ThemeContext';
import { LanguageToggle, useLanguage } from '../contexts/LanguageContext';

// --- ICON SVG CHO SIDEBAR THEO DESIGN.MD ---
const NavDashboardIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const NavBriefcaseIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const NavFolderIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const NavBuildingIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const NavUserIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const NavUsersIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const NavDocumentIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const NavShieldIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const NavKeyIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const MenuHamburgerIcon = () => (
    <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseXIcon = () => (
    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    // State điều khiển mở Sidebar Off-canvas trên Tablet / Mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [stats, setStats] = useState({
        pendingJobs: 0,
        pendingApplications: 0,
        totalReports: 0,
        pendingRecovery: 0
    });

    const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Super Administrator');
    const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || 'admin@jobportal.com');
    const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar') || '');

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const res = await axiosClient.get('/Admin/dashboard-summary');
                let recCount = 0;
                try {
                    const recRes = await axiosClient.get('/Admin/recovery-tickets?status=Pending');
                    recCount = recRes.data?.length || 0;
                } catch {}

                setStats({
                    pendingJobs: res.data.pendingJobs || 0,
                    pendingApplications: res.data.pendingApplications || 0,
                    totalReports: res.data.totalReports || 0,
                    pendingRecovery: recCount
                });
            } catch {
                // Silently fallback
            }
        };
        fetchBadges();
    }, [location.pathname]);

    // Đồng bộ hồ sơ Admin thời gian thực khi cập nhật
    useEffect(() => {
        const syncProfile = () => {
            setUserName(localStorage.getItem('user_name') || 'Super Administrator');
            setUserEmail(localStorage.getItem('user_email') || 'admin@jobportal.com');
            setUserAvatar(localStorage.getItem('user_avatar') || '');
        };

        const fetchLatestProfile = async () => {
            try {
                const res = await axiosClient.get('/Admin/profile');
                if (res.data) {
                    setUserName(res.data.fullName || 'Super Administrator');
                    setUserEmail(res.data.email || 'admin@jobportal.com');
                    setUserAvatar(res.data.avatarUrl || '');
                    localStorage.setItem('user_name', res.data.fullName || '');
                    localStorage.setItem('user_email', res.data.email || '');
                    if (res.data.avatarUrl) localStorage.setItem('user_avatar', res.data.avatarUrl);
                }
            } catch {
                // Silently fallback
            }
        };

        window.addEventListener('admin_profile_updated', syncProfile);
        fetchLatestProfile();

        return () => window.removeEventListener('admin_profile_updated', syncProfile);
    }, []);

    // Quick Search states
    const [quickSearchQuery, setQuickSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState({ totalMatches: 0, jobs: [], candidates: [], companies: [], employers: [] });
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Debounced search query
    useEffect(() => {
        if (!quickSearchQuery.trim()) {
            setSearchResults({ totalMatches: 0, jobs: [], candidates: [], companies: [], employers: [] });
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await axiosClient.get(`/Admin/quick-search?q=${encodeURIComponent(quickSearchQuery.trim())}`);
                setSearchResults(res.data);
                setIsSearchOpen(true);
            } catch (err) {
                console.error('Lỗi tìm kiếm nhanh:', err);
            } finally {
                setIsSearching(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [quickSearchQuery]);

    // Handle shortcuts & click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                setIsSearchOpen(true);
            } else if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleQuickSearchSubmit = (e) => {
        e.preventDefault();
        const q = quickSearchQuery.trim();
        if (!q) return;

        setIsSearchOpen(false);
        navigate(`/admin/jobs?search=${encodeURIComponent(q)}`);
    };

    const handleSelectResult = (targetUrl) => {
        setIsSearchOpen(false);
        navigate(targetUrl);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new Event('auth_changed'));
        navigate('/');
    };

    const menuGroups = [
        {
            group: t('group_overview'),
            items: [
                { label: t('nav_dashboard'), path: '/admin', icon: <NavDashboardIcon /> },
                { label: t('nav_profile'), path: '/admin/profile', icon: <NavUserIcon /> }
            ]
        },
        {
            group: t('group_jobs'),
            items: [
                {
                    label: t('nav_jobs'),
                    path: '/admin/jobs',
                    icon: <NavBriefcaseIcon />,
                    badge: stats.pendingJobs > 0 ? stats.pendingJobs : null
                },
                { label: t('nav_categories'), path: '/admin/categories', icon: <NavFolderIcon /> }
            ]
        },
        {
            group: t('group_partners'),
            items: [
                { label: t('nav_companies'), path: '/admin/companies', icon: <NavBuildingIcon /> },
                { label: t('nav_candidates'), path: '/admin/candidates', icon: <NavUserIcon /> },
                { label: t('nav_employers'), path: '/admin/employers', icon: <NavUsersIcon /> }
            ]
        },
        {
            group: t('group_operations'),
            items: [
                {
                    label: t('nav_applications'),
                    path: '/admin/applications',
                    icon: <NavDocumentIcon />,
                    badge: stats.pendingApplications > 0 ? stats.pendingApplications : null
                },
                {
                    label: t('nav_reports'),
                    path: '/admin/reports',
                    icon: <NavShieldIcon />,
                    badge: stats.totalReports > 0 ? stats.totalReports : null,
                    isDangerBadge: true
                },
                {
                    label: t('nav_recovery'),
                    path: '/admin/recovery-requests',
                    icon: <NavKeyIcon />,
                    badge: stats.pendingRecovery > 0 ? stats.pendingRecovery : null
                }
            ]
        }
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full justify-between">
            <div className="p-5 overflow-y-auto">
                {/* Brand Logo TalentOS & Nút đóng trên mobile */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                    <div
                        onClick={() => navigate('/admin')}
                        className="flex items-center space-x-3 cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#1E40AF] text-white flex items-center justify-center font-black text-base shadow-xs">
                            T
                        </div>
                        <div>
                            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">JobPortal</div>
                            <div className="text-[10px] tracking-wider text-slate-400 font-bold mt-1">ADMINISTRATOR SUITE</div>
                        </div>
                    </div>

                    {/* Nút đóng dành riêng cho màn hình nhỏ */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer"
                        title="Đóng menu"
                    >
                        <CloseXIcon />
                    </button>
                </div>

                {/* Danh mục Menu Điều Hướng */}
                <div className="space-y-5">
                    {menuGroups.map((grp, idx) => (
                        <div key={idx}>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                {grp.group}
                            </div>
                            <div className="space-y-1">
                                {grp.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${isActive
                                                ? 'bg-[#1E40AF] text-white font-bold shadow-xs'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-2.5">
                                                {item.icon}
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-2 ${isActive
                                                        ? 'bg-white/20 text-white'
                                                        : item.isDangerBadge
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] text-slate-500 font-medium">{t('language')}:</span>
                    <LanguageToggle showLabel={true} />
                </div>
                <div className="text-[11px] text-slate-500 mb-2 px-1">
                    {t('admin_portal')} <br />
                    <span className="text-[10px] text-slate-400">TalentOS v2.4 Enterprise</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg text-xs transition border border-slate-200 cursor-pointer"
                >
                    {t('logout')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
            {/* 1. SIDEBAR CHO MÀN HÌNH LỚN (DESKTOP >= 1024px: 260px STICKY THEO DESIGN.MD) */}
            <aside className="hidden lg:flex w-[260px] bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0 z-30">
                {sidebarContent}
            </aside>

            {/* 2. SIDEBAR OFF-CANVAS CHO TABLET VÀ MOBILE (< 1024px) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop mờ nền */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    {/* Panel trượt từ bên trái */}
                    <div className="fixed inset-y-0 left-0 w-[280px] sm:w-[300px] bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300">
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* VÙNG NỘI DUNG CHÍNH (FLUID CANVAS) */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* HEADER (64px CHIỀU CAO CHUẨN THEO DESIGN.MD) */}
                <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20 gap-3">
                    {/* Nút Hamburger bật menu bên trái cho Mobile & Tablet */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700 focus:outline-none transition cursor-pointer"
                            aria-label="Mở danh mục quản trị"
                        >
                            <MenuHamburgerIcon />
                        </button>

                        {/* Ô TÌM KIẾM NHANH HỆ THỐNG VÀ NÚT TÌM KIẾM */}
                        <div ref={searchContainerRef} className="relative w-44 sm:w-80 md:w-[440px]">
                            <form onSubmit={handleQuickSearchSubmit} className="flex items-center space-x-1.5">
                                <div className="relative flex-1 min-w-0">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <SearchIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={quickSearchQuery}
                                        onChange={(e) => {
                                            setQuickSearchQuery(e.target.value);
                                            if (e.target.value.trim()) setIsSearchOpen(true);
                                        }}
                                        onFocus={() => {
                                            if (quickSearchQuery.trim()) setIsSearchOpen(true);
                                        }}
                                        placeholder={t('quick_search_placeholder')}
                                        className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 text-xs pl-8 pr-12 py-2 rounded-lg focus:outline-none focus:border-[#2563EB] transition shadow-2xs"
                                    />
                                    {quickSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickSearchQuery('');
                                                setSearchResults({ totalMatches: 0, jobs: [], candidates: [], companies: [], employers: [] });
                                                setIsSearchOpen(false);
                                            }}
                                            className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                                            title={t('reset')}
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <span className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-slate-200/70 text-slate-500 font-mono px-1 py-0.5 rounded border border-slate-300 pointer-events-none">
                                        Ctrl K
                                    </span>
                                </div>

                                {/* NÚT TÌM KIẾM NHANH TRÊN HỆ THỐNG */}
                                <button
                                    type="submit"
                                    className="bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs shrink-0 flex items-center space-x-1 cursor-pointer active:scale-95"
                                    title={t('search_btn')}
                                >
                                    <SearchIcon className="w-3.5 h-3.5 text-white" />
                                    <span className="hidden sm:inline">{t('search_btn')}</span>
                                </button>
                            </form>

                            {/* POPUP KẾT QUẢ TÌM KIẾM NHANH TOÀN HỆ THỐNG */}
                            {isSearchOpen && quickSearchQuery.trim() && (
                                <div className="absolute left-0 w-[300px] sm:w-[480px] md:w-[520px] top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[480px] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {/* Header kết quả */}
                                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700 truncate pr-2">
                                            {t('search_results_for')} <span className="text-[#1E40AF]">"{quickSearchQuery}"</span>
                                        </span>
                                        <span className="bg-[#1E40AF]/10 text-[#1E40AF] font-bold text-[10px] px-2 py-0.5 rounded-full tabular-nums shrink-0">
                                            {searchResults.totalMatches} {t('results_count')}
                                        </span>
                                    </div>

                                    {/* Đang tìm kiếm */}
                                    {isSearching && (
                                        <div className="p-4 text-center text-xs text-slate-400">
                                            <span className="inline-block animate-spin mr-1.5">⏳</span> {t('searching')}
                                        </div>
                                    )}

                                    {/* Không có kết quả */}
                                    {!isSearching && searchResults.totalMatches === 0 && (
                                        <div className="p-6 text-center text-xs text-slate-400">
                                            {t('no_results')}
                                        </div>
                                    )}

                                    {/* Danh sách kết quả theo nhóm */}
                                    {!isSearching && searchResults.totalMatches > 0 && (
                                        <div className="p-2 space-y-3 divide-y divide-slate-100 text-xs">
                                            {/* 1. Nhóm Việc làm */}
                                            {searchResults.jobs?.length > 0 && (
                                                <div className="pt-2 first:pt-0">
                                                    <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                        <span>{t('group_jobs_title')} ({searchResults.jobs.length})</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectResult(`/admin/jobs?search=${encodeURIComponent(quickSearchQuery)}`)}
                                                            className="text-[#2563EB] hover:underline normal-case cursor-pointer font-normal text-[11px]"
                                                        >
                                                            {t('view_all')} &rarr;
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {searchResults.jobs.map((job) => (
                                                            <div
                                                                key={job.id}
                                                                onClick={() => handleSelectResult(`/admin/jobs?search=${encodeURIComponent(job.title)}`)}
                                                                className="p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="font-semibold text-slate-800 group-hover:text-[#1E40AF] truncate">
                                                                        {job.title}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 truncate">
                                                                        {job.companyName} • {job.location}
                                                                    </div>
                                                                </div>
                                                                <StatusBadge status={job.status} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 2. Nhóm Ứng viên */}
                                            {searchResults.candidates?.length > 0 && (
                                                <div className="pt-2">
                                                    <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                        <span>{t('group_candidates_title')} ({searchResults.candidates.length})</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectResult(`/admin/candidates?search=${encodeURIComponent(quickSearchQuery)}`)}
                                                            className="text-[#2563EB] hover:underline normal-case cursor-pointer font-normal text-[11px]"
                                                        >
                                                            {t('view_all')} &rarr;
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {searchResults.candidates.map((c) => (
                                                            <div
                                                                key={c.id}
                                                                onClick={() => handleSelectResult(`/admin/candidates?search=${encodeURIComponent(c.fullName)}`)}
                                                                className="p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="font-semibold text-slate-800 group-hover:text-[#1E40AF] truncate">
                                                                        {c.fullName}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 truncate">
                                                                        {c.email} {c.phone && `• ${c.phone}`}
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                    {c.isActive ? t('status_active') : t('status_locked')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Nhóm Công ty */}
                                            {searchResults.companies?.length > 0 && (
                                                <div className="pt-2">
                                                    <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                        <span>{t('group_companies_title')} ({searchResults.companies.length})</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectResult(`/admin/companies?search=${encodeURIComponent(quickSearchQuery)}`)}
                                                            className="text-[#2563EB] hover:underline normal-case cursor-pointer font-normal text-[11px]"
                                                        >
                                                            {t('view_all')} &rarr;
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {searchResults.companies.map((comp) => (
                                                            <div
                                                                key={comp.id}
                                                                onClick={() => handleSelectResult(`/admin/companies?search=${encodeURIComponent(comp.companyName)}`)}
                                                                className="p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="font-semibold text-slate-800 group-hover:text-[#1E40AF] truncate">
                                                                        {comp.companyName}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 truncate">
                                                                        {comp.location}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                    {comp.isActive ? t('status_active') : t('status_locked')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 4. Nhóm Nhà tuyển dụng */}
                                            {searchResults.employers?.length > 0 && (
                                                <div className="pt-2">
                                                    <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                        <span>{t('group_employers_title')} ({searchResults.employers.length})</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectResult(`/admin/employers?search=${encodeURIComponent(quickSearchQuery)}`)}
                                                            className="text-[#2563EB] hover:underline normal-case cursor-pointer font-normal text-[11px]"
                                                        >
                                                            {t('view_all')} &rarr;
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {searchResults.employers.map((emp) => (
                                                            <div
                                                                key={emp.id}
                                                                onClick={() => handleSelectResult(`/admin/employers?search=${encodeURIComponent(emp.fullName)}`)}
                                                                className="p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="font-semibold text-slate-800 group-hover:text-[#1E40AF] truncate">
                                                                        {emp.fullName} ({emp.position || 'HR'})
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 truncate">
                                                                        {emp.companyName} • {emp.email}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                    HR Recruiter
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer phím tắt */}
                                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>{t('press_esc_to_close')}</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsSearchOpen(false)}
                                            className="text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                                        >
                                            {t('close_esc')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cụm nút chuyển đổi Theme, Ngôn ngữ và Thông tin hồ sơ quản trị viên */}
                    <div className="flex items-center space-x-2 sm:space-x-2.5">
                        {/* Nút chuyển đổi Ngôn ngữ */}
                        <LanguageToggle />

                        {/* Nút chuyển đổi Theme Sáng / Tối */}
                        <ThemeToggle />

                        <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1"></div>

                        <div
                            onClick={() => navigate('/admin/profile')}
                            className="flex items-center space-x-2 sm:space-x-2.5 p-1 -mr-1 rounded-lg hover:bg-slate-100 transition cursor-pointer group"
                            title={t('nav_profile')}
                        >
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-slate-900 group-hover:text-[#1E40AF] leading-none truncate max-w-[150px] transition">
                                    {userName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[150px]">
                                    {userEmail}
                                </div>
                            </div>
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 overflow-hidden border border-slate-200">
                                {userAvatar ? (
                                    <img
                                        src={userAvatar.startsWith('http') ? userAvatar : `https://towers-contract-toolbox-distinguished.trycloudflare.com${userAvatar}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    (userName || 'AD').substring(0, 2).toUpperCase()
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* WORKSPACE CANVAS (PADDING RESPONSIVE: 1rem mobile -> 2rem desktop) */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
                    <div className="max-w-[1600px] mx-auto min-w-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}