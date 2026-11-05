import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/client/JobCard';
import { useLanguage } from '../contexts/LanguageContext';
import SmartPagination from '../components/common/SmartPagination';

export default function JobListingPage() {
  const { isEn } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState(searchParams.get('location') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [jobType, setJobType] = useState(searchParams.get('jobType') || 'all');
  const [salaryRange, setSalaryRange] = useState(searchParams.get('salary') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Data state
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);

  // Fetch categories & locations from database
  useEffect(() => {
    axiosClient.get('/Jobs/categories')
      .then(res => setCategoriesList(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    axiosClient.get('/Jobs/locations')
      .then(res => setLocationsList(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Sync state with search params on initial mount or change
  useEffect(() => {
    if (searchParams.get('keyword') !== null) setKeyword(searchParams.get('keyword'));
    if (searchParams.get('location') !== null) setLocation(searchParams.get('location'));
    if (searchParams.get('category') !== null) setCategory(searchParams.get('category'));
  }, [searchParams]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let url = `/Jobs?page=${page}&pageSize=${pageSize}`;
        if (keyword.trim()) url += `&keyword=${encodeURIComponent(keyword.trim())}`;
        if (location && location !== 'all') url += `&location=${encodeURIComponent(location)}`;
        if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
        if (jobType && jobType !== 'all') url += `&jobType=${encodeURIComponent(jobType)}`;

        // Salary range mapping
        if (salaryRange === 'under_10') {
          url += '&maxSalary=10000000';
        } else if (salaryRange === '10_20') {
          url += '&minSalary=10000000&maxSalary=20000000';
        } else if (salaryRange === '20_35') {
          url += '&minSalary=20000000&maxSalary=35000000';
        } else if (salaryRange === 'above_35') {
          url += '&minSalary=35000000';
        }

        if (sortBy === 'salary_desc') url += '&sortBy=salary_desc';
        if (sortBy === 'title_asc') url += '&sortBy=title_asc';

        const res = await axiosClient.get(url);
        const data = res.data?.data || res.data?.Data || [];
        const totalItems = res.data?.total || res.data?.Total || 0;
        setJobs(data);
        setTotal(totalItems);
      } catch (err) {
        console.error('Lỗi tải danh sách việc làm:', err);
        setJobs([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [keyword, location, category, jobType, salaryRange, sortBy, page, pageSize]);

  // Handle Search Form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);

    // Save search keyword to localStorage history (Requirement 6)
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
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setLocation('all');
    setCategory('all');
    setJobType('all');
    setSalaryRange('all');
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="w-full bg-[#FAF8FF] dark:bg-slate-900 transition-colors pb-20">
      
      {/* 1. TOP HEADER & INTEGRATED SEARCH DOCK */}
      <section className="relative w-full bg-gradient-to-b from-[#EAEDFF]/80 via-[#FAF8FF] to-[#FAF8FF] dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 pt-8 pb-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs & Live Pulse */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Link to="/" className="hover:text-[#00288E] dark:hover:text-blue-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>{isEn ? 'Home' : 'Trang chủ'}</span>
              </Link>
              <span>/</span>
              <span className="text-[#00288E] dark:text-blue-400 font-bold">
                {isEn ? 'Browse Career Opportunities' : 'Khám phá cơ hội việc làm'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isEn ? 'Updated continuously: ' : 'Cập nhật thời gian thực: '} <strong className="text-slate-800 dark:text-slate-200">{total}</strong> {isEn ? 'matching positions' : 'vị trí đang mở'}</span>
            </div>
          </div>

          {/* Elevated Search Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              
              {/* Keyword Input */}
              <div className="lg:col-span-6 flex items-center bg-slate-50 dark:bg-slate-900/80 rounded-xl px-4 py-3 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00288E] transition">
                <span className="material-symbols-outlined text-slate-400 text-2xl mr-3">search</span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={isEn ? 'Job title, keywords, or company...' : 'Vị trí, chức danh hoặc công ty (Ví dụ: React, Shopee...)'}
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Location Select (Real data from DB) */}
              <div className="lg:col-span-3 flex items-center bg-slate-50 dark:bg-slate-900/80 rounded-xl px-3.5 py-3 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00288E] transition">
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">location_on</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">{isEn ? 'All Locations' : 'Toàn quốc (Tất cả địa điểm)'}</option>
                  {locationsList.map((loc, idx) => (
                    <option key={idx} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Submit CTA */}
              <div className="lg:col-span-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-sm rounded-xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">travel_explore</span>
                  <span>{isEn ? 'Search Jobs' : 'Tìm kiếm cơ hội'}</span>
                </button>
              </div>
            </form>

            {/* Quick Filter Tags */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-amber-500">trending_up</span>
                {isEn ? 'Popular:' : 'Phổ biến:'}
              </span>
              {['ReactJS', 'NodeJS', 'Product Manager', 'Remote 100%', 'Lương > 35 triệu', 'Techcombank'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setKeyword(tag);
                    setPage(1);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/70 hover:bg-blue-50 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* 2. MAIN 2-COLUMN VIEWPORT CONTENT */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: MULTI-DIMENSIONAL FILTER SIDEBAR (4 Cols) */}
          <aside className="lg:col-span-4 w-full space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 sm:p-6 sticky top-24">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                  <span className="material-symbols-outlined text-[#00288E] dark:text-blue-400">tune</span>
                  <span>{isEn ? 'Filter Jobs' : 'Bộ lọc tuyển dụng'}</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  type="button"
                  className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
                </button>
              </div>

              {/* Active Filter Pills Strip */}
              {(category !== 'all' || location !== 'all' || salaryRange !== 'all' || jobType !== 'all') && (
                <div className="flex flex-wrap gap-1.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
                  {category !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#00288E] dark:text-blue-300 text-[11px] font-bold rounded-full">
                      Ngành: {category}
                      <button onClick={() => setCategory('all')} className="hover:text-rose-500">×</button>
                    </span>
                  )}
                  {location !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-full">
                      Địa điểm: {location}
                      <button onClick={() => setLocation('all')} className="hover:text-rose-500">×</button>
                    </span>
                  )}
                  {salaryRange !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-full">
                      Lương: {salaryRange}
                      <button onClick={() => setSalaryRange('all')} className="hover:text-rose-500">×</button>
                    </span>
                  )}
                  {jobType !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[11px] font-bold rounded-full">
                      Hình thức: {jobType}
                      <button onClick={() => setJobType('all')} className="hover:text-rose-500">×</button>
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-6 text-xs">
                
                {/* 1. Mức lương */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">payments</span>
                    <span>{isEn ? 'Salary Range' : 'Mức lương mong muốn'}</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: isEn ? 'All salaries' : 'Tất cả mức lương' },
                      { id: 'under_10', label: isEn ? 'Under 10M VND' : 'Dưới 10 triệu' },
                      { id: '10_20', label: '10 - 20 triệu' },
                      { id: '20_35', label: '20 - 35 triệu' },
                      { id: 'above_35', label: isEn ? 'Above 35M VND' : 'Trên 35 triệu' }
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="salaryRange"
                          checked={salaryRange === opt.id}
                          onChange={() => {
                            setSalaryRange(opt.id);
                            setPage(1);
                          }}
                          className="w-4 h-4 text-[#00288E] focus:ring-[#00288E] cursor-pointer"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Ngành nghề / Danh mục */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-base">category</span>
                    <span>{isEn ? 'Category / Industry' : 'Ngành nghề chuyên môn'}</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">{isEn ? 'All Categories' : 'Tất cả ngành nghề'}</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} ({c.jobsCount})</option>
                    ))}
                  </select>
                </div>

                {/* 3. Hình thức làm việc */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-purple-600 text-base">schedule</span>
                    <span>{isEn ? 'Work Mode / Type' : 'Hình thức làm việc'}</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: isEn ? 'All types' : 'Tất cả hình thức' },
                      { id: 'fulltime', label: isEn ? 'Full-Time' : 'Toàn thời gian (Full-time)' },
                      { id: 'parttime', label: isEn ? 'Part-Time' : 'Bán thời gian (Part-time)' },
                      { id: 'remote', label: isEn ? 'Remote' : 'Làm từ xa (Remote 100%)' },
                      { id: 'hybrid', label: isEn ? 'Hybrid' : 'Linh hoạt (Hybrid)' }
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="jobType"
                          checked={jobType === opt.id}
                          onChange={() => {
                            setJobType(opt.id);
                            setPage(1);
                          }}
                          className="w-4 h-4 text-[#00288E] focus:ring-[#00288E] cursor-pointer"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </aside>

          {/* RIGHT COLUMN: JOB RESULTS FEED & PAGINATION (8 Cols) */}
          <main className="lg:col-span-8 w-full space-y-6">
            
            {/* Sort & Result Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {keyword ? (
                    <span>Kết quả tìm kiếm cho: <span className="text-[#00288E] dark:text-blue-400">"{keyword}"</span></span>
                  ) : (
                    <span>Tất cả vị trí việc làm đang tuyển dụng</span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tìm thấy <strong className="text-slate-900 dark:text-white">{total}</strong> việc làm phù hợp
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">{isEn ? 'Sort by:' : 'Sắp xếp:'}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="newest">{isEn ? 'Newest' : 'Mới cập nhật'}</option>
                  <option value="salary_desc">{isEn ? 'Highest Salary' : 'Lương cao nhất'}</option>
                  <option value="title_asc">{isEn ? 'Title (A-Z)' : 'Tiêu đề (A-Z)'}</option>
                </select>
              </div>
            </div>

            {/* Job Stream */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-40"></div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-3xl">
                  🔍
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  {isEn ? 'No jobs match your search criteria' : 'Không tìm thấy việc làm phù hợp'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isEn ? 'Try adjusting your keyword, location, or resetting the filter options.' : 'Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bấm nút đặt lại bộ lọc.'}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#00288E] text-white text-xs font-bold hover:bg-[#1E40AF] transition"
                >
                  {isEn ? 'Reset All Filters' : 'Đặt lại tất cả bộ lọc'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Phân trang danh sách việc làm thông minh khi dữ liệu nhiều */}
            <div className="pt-6">
              <SmartPagination
                currentPage={page}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[9, 18, 27, 45]}
                itemName={isEn ? 'jobs' : 'việc làm'}
              />
            </div>

          </main>

        </div>
      </div>

    </div>
  );
}
