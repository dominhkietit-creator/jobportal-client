import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import axiosClient from '../../api/axiosClient';

export default function JobCard({ job, onSaveToggle }) {
  const { isEn } = useLanguage();
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState(job.isSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);

  const formatSalary = (min, max) => {
    if (!min && !max) return isEn ? 'Negotiable' : 'Thỏa thuận';
    const minM = min ? Math.round(min / 1000000) : 0;
    const maxM = max ? Math.round(max / 1000000) : 0;
    if (minM > 0 && maxM > 0) return `${minM} - ${maxM} triệu VNĐ`;
    if (minM > 0) return `Từ ${minM} triệu VNĐ`;
    return `Tới ${maxM} triệu VNĐ`;
  };

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      showToast(isEn ? 'Please login to save this job.' : 'Vui lòng đăng nhập để lưu tin việc làm này.', 'info');
      return;
    }

    if (role !== 'Candidate') {
      showToast(isEn ? 'Only candidate accounts can bookmark jobs.' : 'Chỉ tài khoản Ứng viên mới có thể lưu việc làm.', 'warning');
      return;
    }

    setSaveLoading(true);
    try {
      const res = await axiosClient.post(`/Candidates/save-job/${job.id}`);
      setIsSaved(!isSaved);
      showToast(res.data?.Message || (isSaved ? 'Đã bỏ lưu tin' : 'Đã lưu việc làm!'), 'success');
      if (onSaveToggle) onSaveToggle(job.id, !isSaved);
    } catch (err) {
      showToast(isEn ? 'Could not update saved status.' : 'Không thể lưu việc làm, vui lòng thử lại sau.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const companyLetter = (job.companyName || 'V').charAt(0).toUpperCase();

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
      
      {/* Top Header: Company Avatar, Title & Save Button */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              <img 
                src={job.companyLogo} 
                alt={job.companyName} 
                className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-700 p-1 border border-slate-100 dark:border-slate-600 shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00288E] to-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                {companyLetter}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                <span className="truncate">{job.companyName || 'Công ty uy tín'}</span>
                <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0" title="Doanh nghiệp đã kiểm định pháp lý">
                  verified
                </span>
              </div>

              <Link to={`/jobs/${job.id}`}>
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#00288E] dark:group-hover:text-blue-400 transition-colors text-base line-clamp-1 mt-0.5">
                  {job.title}
                </h3>
              </Link>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleSave}
            disabled={saveLoading}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isSaved 
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
          >
            <span className={`material-symbols-outlined text-[20px] ${isSaved ? 'fill-current' : ''}`}>
              {isSaved ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>

        {/* Salary Pill & Meta Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            <span className="material-symbols-outlined text-[15px]">payments</span>
            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
            <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
            <span className="truncate max-w-[120px]">{job.location || 'Toàn quốc'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
            <span className="material-symbols-outlined text-[13px] text-slate-400">work</span>
            <span>{job.jobType || job.categoryName || 'Toàn thời gian'}</span>
          </span>
        </div>

        {/* Short Job Description snippet */}
        {job.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {job.description}
          </p>
        )}
      </div>

      {/* Bottom Footer: Deadline & Quick CTA */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span>{isEn ? 'Active now' : 'Đang tuyển dụng'}</span>
        </span>

        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00288E] hover:bg-[#1E40AF] text-white font-semibold text-xs shadow-xs hover:shadow-sm transition active:scale-95"
        >
          <span>{isEn ? 'Apply' : 'Ứng tuyển ngay'}</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

    </div>
  );
}
