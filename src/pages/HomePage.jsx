import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/client/JobCard';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isEn } = useLanguage();

  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');

  // Real data states from Database
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({ totalJobs: 0, totalCompanies: 0, totalCandidates: 0 });
  const [activeJobTab, setActiveJobTab] = useState('featured'); // 'featured' | 'latest'
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Fetch all real database data for homepage
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoadingJobs(true);
      try {
        const [featuredRes, latestRes, catRes, compRes, locRes, statRes] = await Promise.allSettled([
          axiosClient.get('/Jobs/featured?limit=6'),
          axiosClient.get('/Jobs/latest?limit=6'),
          axiosClient.get('/Jobs/categories'),
          axiosClient.get('/Jobs/companies?limit=8'),
          axiosClient.get('/Jobs/locations'),
          axiosClient.get('/Jobs/stats')
        ]);

        if (featuredRes.status === 'fulfilled') {
          const list = featuredRes.value.data?.data || (Array.isArray(featuredRes.value.data) ? featuredRes.value.data : []);
          setFeaturedJobs(list);
        } else {
          // Fallback if specific endpoint not reached
          const fallback = await axiosClient.get('/Jobs?page=1&pageSize=6');
          setFeaturedJobs(fallback.data?.data || fallback.data?.Data || []);
        }

        if (latestRes.status === 'fulfilled') {
          const list = latestRes.value.data?.data || (Array.isArray(latestRes.value.data) ? latestRes.value.data : []);
          setLatestJobs(list);
        }

        if (catRes.status === 'fulfilled') {
          setCategories(Array.isArray(catRes.value.data) ? catRes.value.data : []);
        }

        if (compRes.status === 'fulfilled') {
          setCompanies(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        }

        if (locRes.status === 'fulfilled') {
          setLocations(Array.isArray(locRes.value.data) ? locRes.value.data : []);
        }

        if (statRes.status === 'fulfilled') {
          setStats({
            totalJobs: statRes.value.data?.totalJobs || statRes.value.data?.TotalJobs || 0,
            totalCompanies: statRes.value.data?.totalCompanies || statRes.value.data?.TotalCompanies || 0,
            totalCandidates: statRes.value.data?.totalCandidates || statRes.value.data?.TotalCandidates || 0
          });
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ từ CSDL:', err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    if (keyword.trim()) {
      try {
        const stored = JSON.parse(localStorage.getItem('recent_searches') || '[]');
        const updated = [keyword.trim(), ...stored.filter(k => k.toLowerCase() !== keyword.trim().toLowerCase())].slice(0, 10);
        localStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
    }

    const params = new URLSearchParams();
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (location && location !== 'all') params.append('location', location);
    if (category && category !== 'all') params.append('category', category);
    navigate(`/jobs?${params.toString()}`);
  };

  const getCategoryVisuals = (index) => {
    const icons = ['terminal', 'campaign', 'account_balance', 'trending_up', 'palette', 'badge', 'school', 'local_shipping'];
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-pink-500 to-rose-600',
      'from-amber-500 to-orange-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-indigo-600',
      'from-cyan-500 to-blue-600',
      'from-green-500 to-emerald-600',
      'from-violet-500 to-purple-600'
    ];
    return {
      icon: icons[index % icons.length],
      bg: gradients[index % gradients.length]
    };
  };

  const getCompanyColor = (index) => {
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-emerald-600 to-teal-700',
      'from-orange-500 to-amber-600',
      'from-red-600 to-rose-700',
      'from-purple-600 to-indigo-700',
      'from-cyan-600 to-blue-700'
    ];
    return gradients[index % gradients.length];
  };

  const activeJobsToDisplay = activeJobTab === 'featured' ? featuredJobs : (latestJobs.length > 0 ? latestJobs : featuredJobs);

  return (
    <div className="w-full bg-[#FAF8FF] dark:bg-slate-900 transition-colors">
      
      {/* 1. HERO BANNER & MASTER SEARCH DOCK */}
      <section className="relative w-full bg-gradient-to-b from-[#EAEDFF]/70 via-[#FAF8FF] to-[#FAF8FF] dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 pt-12 pb-16 overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Title */}
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm mb-4 border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {isEn ? 'Vietnam\'s #1 AI-Powered Recruitment Platform' : 'Nền tảng tuyển dụng thông minh ứng dụng AI hàng đầu Việt Nam'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
              {isEn ? 'Discover Over ' : 'Khám phá hơn '}
              <span className="text-[#00288E] dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-700 decoration-wavy decoration-2">
                {stats.totalJobs > 0 ? `${stats.totalJobs.toLocaleString()}+` : 'Nhiều'}
              </span> 
              {isEn ? ' Dream Job Opportunities' : ' Cơ Hội Việc Làm Thực Tế'}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {isEn 
                ? 'Directly connect with legally verified enterprises, multinationals and startups. Elevate your career trajectory with JobPortal.'
                : 'Kết nối trực tiếp với các doanh nghiệp đã kiểm định pháp lý trong hệ thống. Tự tin bứt phá nấc thang sự nghiệp cùng dữ liệu thực tế tại JobPortal.'}
            </p>
          </div>

          {/* Master Search Dock - Using REAL categories and locations from database */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4 max-w-5xl mx-auto mb-10">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Keyword Input */}
              <div className="md:col-span-5 flex items-center bg-slate-50 dark:bg-slate-900/80 rounded-xl px-4 py-3 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00288E] transition">
                <span className="material-symbols-outlined text-slate-400 text-2xl mr-3">search</span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={isEn ? 'Job title, keywords, or company...' : 'Chức danh, kỹ năng công nghệ hoặc công ty...'}
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Location Select (Real data from DB) */}
              <div className="md:col-span-3 flex items-center bg-slate-50 dark:bg-slate-900/80 rounded-xl px-3.5 py-3 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00288E] transition">
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">location_on</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="">{isEn ? 'All Locations' : 'Tất cả địa điểm'}</option>
                  {locations.length > 0 ? (
                    locations.map((loc, i) => (
                      <option key={i} value={loc}>{loc}</option>
                    ))
                  ) : (
                    <>
                      <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </>
                  )}
                </select>
              </div>

              {/* Category Select (Real data from DB) */}
              <div className="md:col-span-2 flex items-center bg-slate-50 dark:bg-slate-900/80 rounded-xl px-3 py-3 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00288E] transition">
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">domain</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="">{isEn ? 'All Industries' : 'Ngành nghề'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit CTA */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full min-h-[46px] bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">search</span>
                  <span>{isEn ? 'Search Jobs' : 'Tìm việc'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3 Real Highlight Stats Cards from Database */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-slate-200/60 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#00288E] dark:text-blue-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">work</span>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.totalJobs.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isEn ? 'Active verified job openings' : 'Việc làm thực tế đang mở tuyển'}
                </p>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-slate-200/60 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.totalCompanies.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isEn ? 'Legally verified companies' : 'Doanh nghiệp trong hệ thống'}
                </p>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-slate-200/60 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.totalCandidates.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isEn ? 'Active registered candidates' : 'Ứng viên tìm việc trên nền tảng'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 2. VIỆC LÀM NỔI BẬT & VIỆC LÀM MỚI (Real Data from Database with Tab Switcher) */}
      <section className="w-full py-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {/* Tab: Việc làm nổi bật */}
              <button
                onClick={() => setActiveJobTab('featured')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeJobTab === 'featured'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                <span>{isEn ? 'Featured Jobs' : 'Việc làm nổi bật (Lương cao)'}</span>
              </button>

              {/* Tab: Việc làm mới */}
              <button
                onClick={() => setActiveJobTab('latest')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeJobTab === 'latest'
                    ? 'bg-blue-100 text-[#00288E] dark:bg-blue-950/80 dark:text-blue-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>{isEn ? 'Latest Jobs' : 'Việc làm mới đăng'}</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeJobTab === 'featured' 
                ? (isEn ? 'Featured Job Opportunities' : 'Việc Làm Nổi Bật')
                : (isEn ? 'Latest Job Openings' : 'Việc Làm Mới Nhất Tuyển Dụng')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeJobTab === 'featured'
                ? (isEn ? 'Highest compensation packages from database employers' : 'Được xếp theo mức lương và chế độ đãi ngộ cao nhất')
                : (isEn ? 'Recently posted positions waiting for candidate profiles' : 'Các tin tuyển dụng vừa được các nhà tuyển dụng cập nhật')}
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00288E] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group"
          >
            <span>{isEn ? 'Browse all jobs' : 'Xem toàn bộ việc làm'}</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Real Jobs Grid */}
        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 animate-pulse h-48"></div>
            ))}
          </div>
        ) : activeJobsToDisplay.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
            {isEn ? 'No jobs found currently in database.' : 'Hiện chưa có việc làm nào trong cơ sở dữ liệu.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeJobsToDisplay.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>


      {/* 3. REAL JOB CATEGORIES FROM DATABASE */}
      <section className="w-full py-16 bg-white dark:bg-slate-800/50 border-y border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isEn ? 'Career Categories' : 'Ngành Nghề Tuyển Dụng'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isEn ? 'Real categories and live position counts from database' : 'Dữ liệu các nhóm ngành nghề và số lượng tin tuyển dụng thực tế'}
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Chưa có danh mục nào trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {categories.map((cat, idx) => {
                const visuals = getCategoryVisuals(idx);
                return (
                  <Link
                    key={cat.id}
                    to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-4 sm:p-5 hover:border-[#00288E] dark:hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${visuals.bg} text-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl">{visuals.icon}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#00288E] dark:group-hover:text-blue-400 transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                      {cat.jobsCount} {isEn ? 'active jobs' : 'việc làm'}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </section>


      {/* 4. REAL COMPANIES FROM DATABASE */}
      <section className="w-full py-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isEn ? 'Featured Companies' : 'Nhà Tuyển Dụng Hàng Đầu'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn ? 'Companies registered and hiring directly on the platform' : 'Các doanh nghiệp đã tham gia đăng tin tuyển dụng trực tiếp trong hệ thống'}
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có công ty nào trong hệ thống.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {companies.map((c, idx) => (
              <Link
                key={c.id}
                to={`/jobs?keyword=${encodeURIComponent(c.companyName)}`}
                className="bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-5 text-center flex flex-col items-center hover:shadow-xl transition group"
              >
                {c.logoUrl ? (
                  <img
                    src={c.logoUrl.startsWith('http') ? c.logoUrl : `https://towers-contract-toolbox-distinguished.trycloudflare.com${c.logoUrl}`}
                    alt={c.companyName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm mb-3 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getCompanyColor(idx)} text-white flex items-center justify-center font-black text-xl shadow-md mb-3 group-hover:scale-105 transition-transform`}>
                    {c.companyName ? c.companyName.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                  {c.companyName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-full">
                  {c.address || (isEn ? 'Verified Employer' : 'Nhà tuyển dụng xác thực')}
                </p>
                <span className="mt-3 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#00288E] dark:text-blue-300 text-[11px] font-bold">
                  {c.jobsCount} {isEn ? 'openings' : 'việc làm'}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* 5. EMPLOYER CALL-TO-ACTION RECRUITMENT BANNER */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#00288E] via-[#1E40AF] to-[#2563EB] text-white p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white">
                <span className="material-symbols-outlined text-[16px] text-amber-300">stars</span>
                <span>{isEn ? 'For Enterprises & HR Specialists' : 'Dành riêng cho Doanh Nghiệp & Chuyên viên Nhân sự'}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {isEn ? 'Recruit Top Talents Swiftly with Real Candidate Matching' : 'Tuyển Dụng Nhân Tài Nhanh Chóng Cùng JobPortal'}
              </h3>

              <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                {isEn 
                  ? 'Post jobs and manage applicants seamlessly. Access our pool of verified candidates with real-time application processing.'
                  : 'Đăng tin tuyển dụng và quản lý hồ sơ ứng viên nhanh chóng. Tiếp cận các ứng viên đang tìm việc thực tế trong hệ thống.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register?role=employer"
                  className="px-6 py-3.5 bg-white text-[#00288E] hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95"
                >
                  {isEn ? 'Post Free Job Now' : 'Đăng tin tuyển dụng miễn phí ngay'}
                </Link>

                <Link
                  to="/user-login"
                  className="px-5 py-3.5 text-white hover:text-blue-200 font-semibold text-xs sm:text-sm flex items-center gap-1 transition"
                >
                  <span>{isEn ? 'Employer Login' : 'Đăng nhập Nhà tuyển dụng'}</span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="w-44 h-44 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="material-symbols-outlined text-5xl text-emerald-300 mb-2">psychology</span>
                <span className="font-bold text-sm text-white">AI Screening</span>
                <span className="text-[11px] text-blue-200 mt-1">Tiết kiệm 70% thời gian lọc hồ sơ</span>
              </div>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
