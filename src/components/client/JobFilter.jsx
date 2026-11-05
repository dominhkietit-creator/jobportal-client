import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function JobFilter({ onSearch }) {
    const { t } = useLanguage();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        onSearch({ keyword: keyword.trim(), location });
    };

    const handleClear = () => {
        setKeyword('');
        setLocation('');
        onSearch({ keyword: '', location: '' });
    };

    const handleQuickTag = (tag, isLoc = false) => {
        if (isLoc) {
            setLocation(tag);
            onSearch({ keyword: keyword.trim(), location: tag });
        } else {
            setKeyword(tag);
            onSearch({ keyword: tag, location });
        }
    };

    return (
        <div className="space-y-2.5">
            <form onSubmit={handleFilter} className="bg-white p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={t('placeholder_job_keyword')}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] focus:bg-white transition"
                    />
                    {keyword && (
                        <button
                            type="button"
                            onClick={() => setKeyword('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title="Xóa từ khóa"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="w-full sm:w-56 md:w-64">
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] text-slate-700 focus:bg-white transition"
                    >
                        <option value="">{t('all_locations')}</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold px-6 py-2.5 rounded-lg transition text-xs sm:text-sm shadow-xs shrink-0 cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                    title={t('search_job_btn')}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>{t('search_job_btn')}</span>
                </button>

                {(keyword || location) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition text-xs sm:text-sm border border-slate-200 shrink-0 cursor-pointer"
                    >
                        {t('reset')}
                    </button>
                )}
            </form>

            {/* Gợi ý tìm kiếm nhanh */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 px-1">
                <span className="font-medium text-slate-400">{t('quick_search_tags')}</span>
                {['.NET', 'ReactJS', 'Backend', 'Hồ Chí Minh', 'Hà Nội'].map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickTag(tag, tag === 'Hồ Chí Minh' || tag === 'Hà Nội')}
                        className="bg-white hover:bg-blue-50 hover:text-[#1E40AF] hover:border-blue-200 border border-slate-200 px-2 py-0.5 rounded-full text-[11px] transition cursor-pointer"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}