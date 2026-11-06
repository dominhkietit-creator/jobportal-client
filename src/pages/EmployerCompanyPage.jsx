import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function EmployerCompanyPage() {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [company, setCompany] = useState({
    id: 0,
    companyName: '',
    logoUrl: '',
    website: '',
    address: '',
    description: '',
    employerPosition: 'HR Manager',
    employerName: '',
    employerEmail: ''
  });

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/Employer/company');
      setCompany(res.data);
    } catch (err) {
      showToast('Không thể tải thông tin công ty: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
    const handleSwitch = () => fetchCompany();
    window.addEventListener('company_switched', handleSwitch);
    return () => window.removeEventListener('company_switched', handleSwitch);
  }, []);

  // Xử lý upload Logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingLogo(true);
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newLogo = res.data.imageUrl;
      setCompany((prev) => ({ ...prev, logoUrl: newLogo }));
      showToast('Tải lên logo thành công! Nhớ nhấn "Lưu thay đổi" để áp dụng.', 'success');
    } catch (err) {
      showToast('Lỗi tải logo: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Cập nhật thông tin công ty
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.companyName.trim()) {
      showToast('Tên công ty không được để trống.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await axiosClient.put('/Employer/company', {
        companyName: company.companyName,
        website: company.website,
        address: company.address,
        description: company.description,
        logoUrl: company.logoUrl,
        employerPosition: company.employerPosition
      });
      showToast('Cập nhật thông tin công ty thành công!', 'success');
    } catch (err) {
      showToast('Lỗi cập nhật: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Đang tải hồ sơ doanh nghiệp...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* 1. TOP HEADER & QUICK STATS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006A61] dark:text-[#86F2E4] mb-1">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Thương Hiệu Doanh Nghiệp ATS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#081534] dark:text-white">
            Hồ sơ công ty & Thương hiệu tuyển dụng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thông tin hiển thị công khai trên các tin tuyển dụng và hồ sơ doanh nghiệp để thu hút ứng viên.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Lưu thay đổi</span>
            </>
          )}
        </button>
      </div>

      {/* 2. MAIN FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 p-6 sm:p-8 space-y-6">
        
        {/* LOGO & BRANDING SECTION */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/60">
          <div className="relative group w-32 h-32 rounded-3xl bg-slate-50 dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {company.logoUrl ? (
              <img
                src={company.logoUrl.startsWith('http') ? company.logoUrl : `https://nato-feat-petersburg-runtime.trycloudflare.com${company.logoUrl}`}
                alt="Company Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-1">
                <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                <span className="text-[10px] font-semibold">Chưa có Logo</span>
              </div>
            )}

            {/* Hover overlay upload */}
            <label className="absolute inset-0 bg-[#081534]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1 text-center p-2">
              <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              <span className="text-[11px] font-bold">
                {uploadingLogo ? 'Đang tải...' : 'Tải lên logo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-[#081534] dark:text-white">
              Logo đại diện công ty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
              Định dạng hợp lệ: JPG, PNG, WEBP. Kích thước đề xuất 400x400px. Logo sẽ hiển thị trên tất cả bài đăng tuyển dụng và kết quả tìm kiếm của ứng viên.
            </p>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EFF4FF] dark:bg-slate-700 text-[#081534] dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-blue-100 transition">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>{uploadingLogo ? 'Đang tải...' : 'Chọn ảnh mới'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* INPUT FIELDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tên công ty */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <span>Tên doanh nghiệp / Công ty</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={company.companyName}
              onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
              placeholder="VD: TechCorp Solutions Vietnam"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61] transition"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Trang web chính thức (Website)
            </label>
            <div className="flex items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <span className="material-symbols-outlined text-slate-400 text-lg mr-2">language</span>
              <input
                type="text"
                value={company.website || ''}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                placeholder="https://techcorp.vn"
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Địa chỉ trụ sở */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Địa chỉ trụ sở chính
            </label>
            <div className="flex items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <span className="material-symbols-outlined text-slate-400 text-lg mr-2">location_on</span>
              <input
                type="text"
                value={company.address || ''}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                placeholder="VD: Tòa nhà Bitexco, Q.1, TP. Hồ Chí Minh"
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Chức danh người đại diện */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Vị trí phụ trách tuyển dụng
            </label>
            <input
              type="text"
              value={company.employerPosition || ''}
              onChange={(e) => setCompany({ ...company, employerPosition: e.target.value })}
              placeholder="VD: HR Director / Talent Acquisition Lead"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61] transition"
            />
          </div>

          {/* Email tài khoản (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Email đại diện tài khoản
            </label>
            <input
              type="text"
              disabled
              value={company.employerEmail || ''}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-500 cursor-not-allowed outline-none"
            />
          </div>

          {/* Giới thiệu công ty */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Giới thiệu văn hóa & môi trường làm việc
            </label>
            <textarea
              rows={5}
              value={company.description || ''}
              onChange={(e) => setCompany({ ...company, description: e.target.value })}
              placeholder="Mô tả tóm lược về định hướng kinh doanh, công nghệ cốt lõi, đãi ngộ và văn hóa công ty để thu hút nhân tài..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#006A61] transition"
            />
          </div>
        </div>

        {/* BOTTOM SUBMIT */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006A61] hover:bg-[#00574F] text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu cập nhật hồ sơ'}
          </button>
        </div>
      </form>
    </div>
  );
}
