import { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
    StatusBadge,
    QuickDrawer,
    SearchIcon,
    EyeIcon,
    ExternalLinkIcon
} from '../components/admin/AdminCommon';

// --- ICON COMPONENTS CHO DASHBOARD ---
const TrendingUpIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const ChartPieIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);

const TrophyIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const BriefcaseIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const DocumentTextIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export default function AdminDashboard() {
    const { t, language } = useLanguage();
    const isEn = language === 'en';
    const toast = useToast();

    const [data, setData] = useState({
        totalJobs: 0,
        activeJobs: 0,
        pendingJobs: 0,
        closedJobs: 0,
        totalCandidates: 0,
        totalEmployers: 0,
        totalCompanies: 0,
        totalApplications: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        acceptedApplications: 0,
        rejectedApplications: 0,
        totalReports: 0,
        topJobs: [],
        categoryStats: [],
        jobTypeStats: [],
        monthlyTrend: [],
        recentJobs: [],
        recentApplications: []
    });

    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);

    const timeTabs = [
        { key: 'today', label: t('tab_today') },
        { key: 'week', label: t('tab_this_week') },
        { key: 'month', label: t('tab_this_month') },
        { key: 'quarter', label: t('tab_this_quarter') }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/dashboard-summary');
            setData(res.data);
        } catch (err) {
            console.error('Lỗi nạp dashboard:', err);
            toast.error(
                isEn ? 'Connection Error' : 'Lỗi kết nối',
                isEn ? 'Could not load dashboard data.' : 'Không thể kết nối máy chủ để tải số liệu.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Lọc tìm kiếm nhanh
    const filteredJobs = useMemo(() => {
        if (!searchQuery.trim()) return data.recentJobs || [];
        const q = searchQuery.toLowerCase();
        return (data.recentJobs || []).filter(
            (j) =>
                j.title?.toLowerCase().includes(q) ||
                j.companyName?.toLowerCase().includes(q) ||
                j.location?.toLowerCase().includes(q)
        );
    }, [data.recentJobs, searchQuery]);

    const filteredApplications = useMemo(() => {
        if (!searchQuery.trim()) return data.recentApplications || [];
        const q = searchQuery.toLowerCase();
        return (data.recentApplications || []).filter(
            (a) =>
                a.candidateName?.toLowerCase().includes(q) ||
                a.jobTitle?.toLowerCase().includes(q) ||
                a.companyName?.toLowerCase().includes(q)
        );
    }, [data.recentApplications, searchQuery]);

    const handleExportCSV = () => {
        if (!data.recentJobs || data.recentJobs.length === 0) {
            toast.warning(
                isEn ? 'No Data' : 'Chưa có dữ liệu',
                isEn ? 'No job data available to export.' : 'Chưa có dữ liệu việc làm để xuất báo cáo.'
            );
            return;
        }

        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
        csvContent += isEn
            ? 'ID,Job Title,Company,Category,Location,Salary Min,Salary Max,Status\n'
            : 'Mã tin,Tiêu đề công việc,Công ty,Danh mục,Địa điểm,Lương tối thiểu,Lương tối đa,Trạng thái\n';

        data.recentJobs.forEach((job) => {
            const id = job.id;
            const title = `"${(job.title || '').replace(/"/g, '""')}"`;
            const comp = `"${(job.companyName || '').replace(/"/g, '""')}"`;
            const cat = `"${(job.categoryName || '').replace(/"/g, '""')}"`;
            const loc = `"${(job.location || '').replace(/"/g, '""')}"`;
            const min = job.salaryMin || 0;
            const max = job.salaryMax || 0;
            const status = job.status || 'Active';
            csvContent += `${id},${title},${comp},${cat},${loc},${min},${max},${status}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `JobPortal_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(
            isEn ? 'Export Successful' : 'Xuất dữ liệu thành công',
            isEn ? 'Downloaded JobPortal_Report.csv.' : 'Đã tải xuống tệp báo cáo việc làm.'
        );
    };

    // Tính toán tỷ lệ phần trăm
    const activeJobRate = data.totalJobs > 0 ? Math.round((data.activeJobs / data.totalJobs) * 100) : 0;
    const acceptanceRate = data.totalApplications > 0 ? Math.round((data.acceptedApplications / data.totalApplications) * 100) : 0;

    // Palette màu cho danh mục
    const categoryColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

    // Tính toán max cho biểu đồ xu hướng
    const maxTrendValue = useMemo(() => {
        const trend = data.monthlyTrend || [];
        if (trend.length === 0) return 10;
        const maxVal = Math.max(...trend.map(t => Math.max(t.jobsCount || 0, t.applicationsCount || 0)));
        return maxVal > 0 ? Math.ceil(maxVal * 1.25) : 10;
    }, [data.monthlyTrend]);

    // Format hình thức việc làm
    const formatJobType = (type) => {
        switch (type) {
            case 'FullTime': return t('full_time');
            case 'PartTime': return t('part_time');
            case 'Remote': return t('remote');
            case 'Internship': return t('internship');
            case 'Contract': return t('contract');
            default: return type || t('full_time');
        }
    };

    return (
        <div className="space-y-6">
            {/* TIÊU ĐỀ & THANH CÔNG CỤ TRÊN CÙNG */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>{t('title_dashboard')}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E40AF] dark:bg-blue-950 dark:text-blue-300 font-semibold">
                            Admin Suite
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                        {t('sub_dashboard')}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden text-xs font-medium shadow-xs">
                        {timeTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setTimeFilter(tab.key)}
                                className={`px-2.5 sm:px-3 py-1.5 transition cursor-pointer text-[11px] sm:text-xs ${timeFilter === tab.key
                                    ? 'bg-[#1E40AF] text-white font-semibold'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg cursor-pointer transition shadow-xs active:scale-95"
                    >
                        <span>{t('export_csv')}</span>
                    </button>
                </div>
            </div>

            {/* 1. NĂM THẺ CHỈ SỐ KPI CHÍNH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                {/* 1.1 Tổng số việc làm */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {t('kpi_total_jobs')}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E40AF]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {data.totalJobs}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            +{data.activeJobs} {t('active_jobs')}
                        </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{t('status_pending')}: <strong className="text-amber-600">{data.pendingJobs}</strong></span>
                        <span>{t('status_closed')}: <strong className="text-slate-500">{data.closedJobs}</strong></span>
                    </div>
                </div>

                {/* 1.2 Tổng số ứng viên */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {t('kpi_total_candidates')}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {data.totalCandidates}
                        </span>
                        <span className="text-[11px] font-semibold text-[#0284c7] bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                            100% {t('status_active')}
                        </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {t('completed_profiles')}
                    </div>
                </div>

                {/* 1.3 Tổng số nhà tuyển dụng */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {t('kpi_total_employers')}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {data.totalEmployers}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            HR
                        </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {t('col_posted_jobs')} &amp; {t('applications_unit')}
                    </div>
                </div>

                {/* 1.4 Tổng số công ty */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {t('kpi_total_companies')}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {data.totalCompanies}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {t('enterprises_unit')}
                        </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {t('verified_companies')}
                    </div>
                </div>

                {/* 1.5 Tổng số hồ sơ ứng tuyển */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {t('kpi_total_applications')}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {data.totalApplications}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            {data.pendingApplications} {t('status_pending')}
                        </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{t('shortlisted')}: <strong className="text-emerald-600">{data.shortlistedApplications + data.acceptedApplications}</strong></span>
                        <span>{t('status_rejected')}: <strong className="text-rose-600">{data.rejectedApplications}</strong></span>
                    </div>
                </div>
            </div>

            {/* 2. KHU VỰC BIỂU ĐỒ (CHARTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
                {/* 2.1 BIỂU ĐỒ XU HƯỚNG TIN ĐĂNG & ỨNG TUYỂN 6 THÁNG (CỘT 8) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUpIcon className="w-4 h-4 text-blue-600" />
                                <span>{t('recruitment_trend')}</span>
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                {isEn ? 'Monthly comparison of posted jobs vs applications submitted' : 'So sánh lượng việc làm đăng mới và hồ sơ ứng tuyển theo từng tháng'}
                            </p>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center space-x-4 text-xs font-medium">
                            <div className="flex items-center space-x-1.5">
                                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                                <span className="text-slate-600 dark:text-slate-300">{isEn ? 'Jobs' : 'Việc làm'}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                                <span className="text-slate-600 dark:text-slate-300">{isEn ? 'Applications' : 'Ứng tuyển'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Vùng vẽ biểu đồ SVG Bar chart */}
                    <div className="pt-6 pb-2">
                        <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-4">
                            {(data.monthlyTrend || []).map((m, idx) => {
                                const jobHeight = Math.max(12, Math.round(((m.jobsCount || 0) / maxTrendValue) * 190));
                                const appHeight = Math.max(12, Math.round(((m.applicationsCount || 0) / maxTrendValue) * 190));

                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        {/* Hover Tooltip */}
                                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap">
                                            <div className="font-semibold text-center">{m.MonthName || m.Month}</div>
                                            <div className="text-blue-300">{isEn ? 'Jobs' : 'Việc làm'}: {m.jobsCount || 0}</div>
                                            <div className="text-emerald-300">{isEn ? 'Apps' : 'Ứng tuyển'}: {m.applicationsCount || 0}</div>
                                        </div>

                                        {/* Cặp cột song song */}
                                        <div className="w-full flex items-end justify-center gap-1 sm:gap-2">
                                            {/* Cột Việc làm */}
                                            <div
                                                style={{ height: `${jobHeight}px` }}
                                                className="w-3 sm:w-5 bg-gradient-to-t from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-t-md transition-all duration-300 relative shadow-xs"
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-white font-bold absolute -top-4 left-1/2 -translate-x-1/2 transition">
                                                    {m.jobsCount || 0}
                                                </span>
                                            </div>

                                            {/* Cột Ứng tuyển */}
                                            <div
                                                style={{ height: `${appHeight}px` }}
                                                className="w-3 sm:w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-700 hover:to-emerald-500 rounded-t-md transition-all duration-300 relative shadow-xs"
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-white font-bold absolute -top-4 left-1/2 -translate-x-1/2 transition">
                                                    {m.applicationsCount || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Nhãn tháng ở trục X */}
                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 truncate">
                                            {m.Month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 2.2 BIỂU ĐỒ CƠ CẤU THEO NGÀNH NGHỀ (CỘT 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                            <ChartPieIcon className="w-4 h-4 text-emerald-600" />
                            <span>{t('category_distribution')}</span>
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {isEn ? 'Top categories by job openings' : 'Top ngành nghề có số lượng việc làm cao nhất'}
                        </p>
                    </div>

                    {/* Donut chart vector & Legend */}
                    <div className="py-4 flex flex-col items-center">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                {/* Base track */}
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    className="text-slate-100 dark:text-slate-800"
                                />
                                {(() => {
                                    const total = (data.categoryStats || []).reduce((acc, c) => acc + (c.jobsCount || 0), 0) || 1;
                                    let accumulatedPercent = 0;

                                    return (data.categoryStats || []).map((cat, idx) => {
                                        const percent = Math.round(((cat.jobsCount || 0) / total) * 100);
                                        const dashArray = `${percent * 0.88} ${88 - percent * 0.88}`;
                                        const dashOffset = -accumulatedPercent * 0.88;
                                        accumulatedPercent += percent;

                                        return (
                                            <circle
                                                key={cat.id || idx}
                                                cx="18"
                                                cy="18"
                                                r="14"
                                                fill="none"
                                                stroke={categoryColors[idx % categoryColors.length]}
                                                strokeWidth="4"
                                                strokeDasharray={dashArray}
                                                strokeDashoffset={dashOffset}
                                                strokeLinecap="round"
                                                className="transition-all duration-500"
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                                    {(data.categoryStats || []).reduce((acc, c) => acc + (c.jobsCount || 0), 0)}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 uppercase">
                                    {isEn ? 'Jobs' : 'Việc làm'}
                                </span>
                            </div>
                        </div>

                        {/* Danh sách ngành nghề & phần trăm */}
                        <div className="w-full mt-4 space-y-2">
                            {(data.categoryStats || []).map((cat, idx) => {
                                const total = (data.categoryStats || []).reduce((acc, c) => acc + (c.jobsCount || 0), 0) || 1;
                                const percent = Math.round(((cat.jobsCount || 0) / total) * 100);
                                const color = categoryColors[idx % categoryColors.length];

                                return (
                                    <div key={cat.id || idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2 min-w-0">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 shrink-0">
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{cat.jobsCount}</span>
                                            <span className="text-[10px] text-slate-400">({percent}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. KHU VỰC THỐNG KÊ CHI TIẾT (THỐNG KÊ VIỆC LÀM & THỐNG KÊ HỒ SƠ ỨNG TUYỂN) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
                {/* 3.1 THỐNG KÊ VIỆC LÀM (CỘT 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <BriefcaseIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('job_statistics')}</h3>
                                <p className="text-[11px] text-slate-400">{t('job_type_breakdown')}</p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {activeJobRate}% {t('status_active')}
                        </span>
                    </div>

                    {/* Progress bar tổng hợp trạng thái việc làm */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span>{t('status_approved')} ({data.activeJobs})</span>
                            <span>{t('status_pending')} ({data.pendingJobs})</span>
                            <span>{t('status_closed')} ({data.closedJobs})</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${activeJobRate}%` }} className="bg-emerald-500 h-full transition-all duration-500" title="Active" />
                            <div style={{ width: `${data.totalJobs > 0 ? (data.pendingJobs / data.totalJobs) * 100 : 0}%` }} className="bg-amber-500 h-full transition-all duration-500" title="Pending" />
                            <div style={{ width: `${data.totalJobs > 0 ? (data.closedJobs / data.totalJobs) * 100 : 0}%` }} className="bg-slate-400 h-full transition-all duration-500" title="Closed" />
                        </div>
                    </div>

                    {/* Danh sách phân bổ theo loại hình làm việc */}
                    <div className="space-y-3 pt-2">
                        {(data.jobTypeStats && data.jobTypeStats.length > 0 ? data.jobTypeStats : [
                            { jobType: 'FullTime', count: data.activeJobs || 1 },
                            { jobType: 'PartTime', count: 0 },
                            { jobType: 'Remote', count: 0 }
                        ]).map((jt, idx) => {
                            const percent = data.totalJobs > 0 ? Math.round((jt.count / data.totalJobs) * 100) : 0;
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-700 dark:text-slate-300">{formatJobType(jt.jobType)}</span>
                                        <span className="text-slate-900 dark:text-white font-semibold">{jt.count} ({percent}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${percent}%` }} className="h-full bg-blue-600 rounded-full" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3.2 THỐNG KÊ HỒ SƠ ỨNG TUYỂN (CỘT 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <DocumentTextIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('application_statistics')}</h3>
                                <p className="text-[11px] text-slate-400">{t('recent_apps_sub')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t('acceptance_rate')}</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{acceptanceRate}%</span>
                        </div>
                    </div>

                    {/* Funnel pipeline thẻ trạng thái ứng tuyển */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase block">{t('status_pending')}</span>
                            <span className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1 block tabular-nums">{data.pendingApplications}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50">
                            <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 uppercase block">{t('status_shortlisted')}</span>
                            <span className="text-xl font-bold text-sky-900 dark:text-sky-200 mt-1 block tabular-nums">{data.shortlistedApplications}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase block">{t('status_accepted')}</span>
                            <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1 block tabular-nums">{data.acceptedApplications}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase block">{t('status_rejected')}</span>
                            <span className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-1 block tabular-nums">{data.rejectedApplications}</span>
                        </div>
                    </div>

                    {/* Thanh tỷ lệ chuyển đổi tuyển dụng */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">{isEn ? 'Recruitment Success Rate' : 'Hiệu quả tuyển dụng thành công'}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{data.acceptedApplications} / {data.totalApplications} {t('applications_count')}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div style={{ width: `${acceptanceRate}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. VIỆC LÀM HÀNG ĐẦU (TOP JOBS - THU HÚT ỨNG TUYỂN NHẤT) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <TrophyIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{t('top_jobs_title')}</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{t('top_jobs_sub')}</p>
                        </div>
                    </div>
                    <a
                        href="/admin/jobs"
                        className="text-xs font-semibold text-[#1E40AF] hover:underline flex items-center space-x-1"
                    >
                        <span>{t('view_all')}</span>
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[600px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 h-10">
                            <tr>
                                <th className="px-4 py-2.5 w-14 text-center uppercase tracking-wider text-[11px]">#</th>
                                <th className="px-4 py-2.5 uppercase tracking-wider text-[11px]">{t('col_job_company')}</th>
                                <th className="px-3 py-2.5 uppercase tracking-wider text-[11px]">{t('col_company_brand')}</th>
                                <th className="px-3 py-2.5 uppercase tracking-wider text-[11px]">{t('col_salary')}</th>
                                <th className="px-3 py-2.5 uppercase tracking-wider text-[11px] text-center">{t('applications_count')}</th>
                                <th className="px-3 py-2.5 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                <th className="px-4 py-2.5 uppercase tracking-wider text-[11px] text-right">{t('details')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(!data.topJobs || data.topJobs.length === 0) ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        {isEn ? 'No top jobs recorded yet.' : 'Chưa có dữ liệu việc làm hàng đầu.'}
                                    </td>
                                </tr>
                            ) : (
                                data.topJobs.map((job, idx) => (
                                    <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition h-14">
                                        {/* Rank Badge */}
                                        <td className="px-4 py-2 text-center">
                                            {idx === 0 ? (
                                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold inline-flex items-center justify-center text-xs shadow-xs">
                                                    1
                                                </span>
                                            ) : idx === 1 ? (
                                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold inline-flex items-center justify-center text-xs shadow-xs">
                                                    2
                                                </span>
                                            ) : idx === 2 ? (
                                                <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 font-bold inline-flex items-center justify-center text-xs shadow-xs">
                                                    3
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-semibold">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                                            <div className="font-semibold line-clamp-1">{job.title}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{job.categoryName} • {job.location || (isEn ? 'Nationwide' : 'Toàn quốc')}</div>
                                        </td>
                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-medium">
                                            {job.companyName}
                                        </td>
                                        <td className="px-3 py-2 text-slate-900 dark:text-white font-semibold tabular-nums">
                                            {job.salaryMin || job.salaryMax
                                                ? `${(job.salaryMin / 1000000).toFixed(0)} - ${(job.salaryMax / 1000000).toFixed(0)} ${t('million_vnd')}`
                                                : t('salary_negotiable')}
                                        </td>
                                        {/* Số lượng ứng tuyển nổi bật */}
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                🔥 {job.applicationsCount || 0} {t('applications_count')}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => setSelectedJob(job)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                                title={t('details')}
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* THANH TÌM KIẾM NHANH DỮ LIỆU */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('quick_search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#2563EB] text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-slate-500 dark:text-slate-400 justify-between sm:justify-end">
                    <span>{t('moderation_status')}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                        {data.totalReports} {t('reports_pending')}
                    </span>
                </div>
            </div>

            {/* 2 BẢNG DỮ LIỆU HOẠT ĐỘNG GẦN ĐÂY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
                {/* BẢNG VIỆC LÀM MỚI ĐĂNG (CỘT 7) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col min-w-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-sm text-slate-900 dark:text-white">{t('recent_jobs_title')}</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">{t('latest_jobs_sub')}</p>
                        </div>
                        <a
                            href="/admin/jobs"
                            className="text-xs font-semibold text-[#1E40AF] hover:underline flex items-center space-x-1"
                        >
                            <span>{t('view_all')} ({data.totalJobs})</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-xs min-w-[520px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 h-9">
                                <tr>
                                    <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_job_company')}</th>
                                    <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_company_brand')}</th>
                                    <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_salary')}</th>
                                    <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                    <th className="px-3 py-2 uppercase tracking-wider text-[11px] text-right">{t('details')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-slate-400">
                                            {t('no_matching_records')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition h-14">
                                            <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                                                <div className="font-semibold line-clamp-1">{job.title}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">{job.categoryName} • {job.location || (isEn ? 'Nationwide' : 'Toàn quốc')}</div>
                                            </td>
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-medium">
                                                {job.companyName}
                                            </td>
                                            <td className="px-3 py-2 text-slate-900 dark:text-white font-semibold tabular-nums">
                                                {job.salaryMin || job.salaryMax
                                                    ? `${(job.salaryMin / 1000000).toFixed(0)} - ${(job.salaryMax / 1000000).toFixed(0)} ${t('million_vnd')}`
                                                    : t('salary_negotiable')}
                                            </td>
                                            <td className="px-3 py-2">
                                                <StatusBadge status={job.status} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    onClick={() => setSelectedJob(job)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                                    title={t('details')}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* BẢNG HỒ SƠ ỨNG TUYỂN GẦN ĐÂY (CỘT 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col min-w-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-sm text-slate-900 dark:text-white">{t('recent_applications_title')}</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">{t('recent_apps_sub')}</p>
                        </div>
                        <a
                            href="/admin/applications"
                            className="text-xs font-semibold text-[#1E40AF] hover:underline flex items-center space-x-1"
                        >
                            <span>{t('view_all')} ({data.totalApplications})</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-xs min-w-[360px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 h-9">
                                <tr>
                                    <th className="px-4 py-2 uppercase tracking-wider text-[11px]">{t('col_candidate')}</th>
                                    <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_applied_position')}</th>
                                    <th className="px-3 py-2 uppercase tracking-wider text-[11px]">{t('col_status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-6 text-center text-slate-400">
                                            {t('no_matching_records')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <tr
                                            key={app.id}
                                            onClick={() => setSelectedApplication(app)}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer h-14"
                                        >
                                            <td className="px-4 py-2">
                                                <div className="font-semibold text-slate-900 dark:text-white">{app.candidateName}</div>
                                                <div className="text-[10px] text-slate-400">{app.candidateEmail}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{app.jobTitle}</div>
                                                <div className="text-[10px] text-slate-400">{app.companyName}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <StatusBadge status={app.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* QUICK INSPECTOR DRAWER CHO TIN TUYỂN DỤNG */}
            <QuickDrawer
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                title={selectedJob?.title || t('drawer_title')}
                subtitle={`#${selectedJob?.id} • ${new Date(selectedJob?.createdAt || Date.now()).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}`}
                badge={<StatusBadge status={selectedJob?.status} />}
                actions={
                    <a
                        href="/admin/jobs"
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition"
                    >
                        {t('nav_jobs')}
                    </a>
                }
            >
                {selectedJob && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_company_brand')}</div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedJob.companyName}</div>
                            <div className="text-slate-500 dark:text-slate-400">{t('col_location')}: {selectedJob.location || (isEn ? 'Nationwide' : 'Toàn quốc')}</div>
                            <div className="text-slate-500 dark:text-slate-400">{t('field_job_type')}: {formatJobType(selectedJob.jobType)}</div>
                            <div className="text-slate-500 dark:text-slate-400">
                                {t('col_salary')}:{' '}
                                <span className="font-bold text-[#1E40AF]">
                                    {selectedJob.salaryMin || selectedJob.salaryMax
                                        ? `${(selectedJob.salaryMin / 1000000).toFixed(0)} - ${(selectedJob.salaryMax / 1000000).toFixed(0)} ${t('million_vnd')}`
                                        : t('salary_negotiable')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('field_category')}</div>
                            <div className="text-slate-800 dark:text-slate-200 font-medium">{selectedJob.categoryName}</div>
                        </div>
                    </div>
                )}
            </QuickDrawer>

            {/* QUICK INSPECTOR DRAWER CHO HỒ SƠ ỨNG TUYỂN */}
            <QuickDrawer
                isOpen={!!selectedApplication}
                onClose={() => setSelectedApplication(null)}
                title={t('nav_applications')}
                subtitle={`#${selectedApplication?.id}`}
                badge={<StatusBadge status={selectedApplication?.status} />}
                actions={
                    <a
                        href="/admin/applications"
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition"
                    >
                        {t('nav_applications')}
                    </a>
                }
            >
                {selectedApplication && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_candidate')}</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedApplication.candidateName}</div>
                            <div className="text-slate-500 dark:text-slate-400">{t('field_email')}: {selectedApplication.candidateEmail}</div>
                            <div className="text-slate-500 dark:text-slate-400">{t('col_applied_at')}: {new Date(selectedApplication.appliedAt).toLocaleString(isEn ? 'en-US' : 'vi-VN')}</div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{t('col_applied_position')}</div>
                            <div className="text-sm font-bold text-[#1E40AF]">{selectedApplication.jobTitle}</div>
                            <div className="text-slate-600 dark:text-slate-300 font-medium">{selectedApplication.companyName}</div>
                        </div>
                    </div>
                )}
            </QuickDrawer>
        </div>
    );
}
