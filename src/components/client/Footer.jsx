import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { isEn } = useLanguage();

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-12 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Contact Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00288E] via-[#1E40AF] to-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#00288E] dark:text-blue-400">
                Job<span className="text-emerald-600 dark:text-emerald-400">Portal</span>
              </span>
            </Link>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEn 
                ? 'Your trusted bridge to tomorrow\'s career, empowering over 50,000+ top enterprises and millions of talents nationwide.'
                : 'Cầu nối vững chắc kiến tạo sự nghiệp tương lai, đồng hành cùng hơn 50.000+ doanh nghiệp hàng đầu tại Việt Nam.'}
            </p>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p><strong className="text-slate-900 dark:text-white">TP.HCM:</strong> Tầng 12, Tòa nhà Bitexco, Q.1, TP. Hồ Chí Minh</p>
              <p><strong className="text-slate-900 dark:text-white">Hà Nội:</strong> Tầng 8, Tòa Keangnam Landmark 72, Hà Nội</p>
              <p><strong className="text-slate-900 dark:text-white">Hotline:</strong> 1900 6868 - contact@jobportal.vn</p>
              <p className="text-[11px] text-slate-400 pt-1">Giấy phép sàn TMĐT số: 0312345678</p>
            </div>
          </div>

          {/* Column 2: Candidates */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              {isEn ? 'For Job Seekers' : 'Dành Cho Ứng Viên'}
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link to="/jobs?category=it" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'IT & Software Jobs' : 'Việc làm IT & Công nghệ phần mềm'}
                </Link>
              </li>
              <li>
                <Link to="/jobs?category=marketing" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Marketing & PR Jobs' : 'Việc làm Marketing & Truyền thông'}
                </Link>
              </li>
              <li>
                <Link to="/jobs?category=finance" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Finance & Accounting Jobs' : 'Việc làm Tài chính - Kế toán'}
                </Link>
              </li>
              <li>
                <Link to="/jobs?category=sales" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Sales & Business Jobs' : 'Việc làm Kinh doanh & Bán hàng'}
                </Link>
              </li>
              <li>
                <Link to="/candidate/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Online CV Builder' : 'Tạo & Quản lý CV trực tuyến'}
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? '2025 Salary Survey' : 'Khảo sát mức lương thị trường 2025'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Employers */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              {isEn ? 'For Employers' : 'Dành Cho Doanh Nghiệp'}
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link to="/register?role=employer" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Post a Job Listing' : 'Đăng tin tuyển dụng miễn phí'}
                </Link>
              </li>
              <li>
                <Link to="/register?role=employer" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Search 2.5M+ Profiles' : 'Tìm kiếm 2.500.000+ hồ sơ tài năng'}
                </Link>
              </li>
              <li>
                <Link to="/register?role=employer" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Executive Search (Headhunt)' : 'Dịch vụ tuyển dụng cao cấp Headhunt'}
                </Link>
              </li>
              <li>
                <Link to="/register?role=employer" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {isEn ? 'Enterprise ATS Solutions' : 'Giải pháp quản lý tuyển dụng ATS'}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {isEn ? 'TalentOS Admin Management' : 'Cổng Quản Trị Hệ Thống (Admin)'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: App Download & Socials */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isEn ? 'Mobile Experience' : 'Tải Ứng Dụng JobPortal'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn 
                ? 'Search and apply for jobs instantly anywhere with our mobile app.' 
                : 'Tìm việc và ứng tuyển tức thì mọi lúc mọi nơi trên điện thoại thông minh.'}
            </p>

            <div className="flex flex-col gap-2">
              <a 
                href="#appstore" 
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition border border-slate-200 dark:border-slate-700"
              >
                <span className="material-symbols-outlined text-2xl text-slate-800 dark:text-slate-200">
                  apple
                </span>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 leading-none">Download on</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">App Store</p>
                </div>
              </a>

              <a 
                href="#googleplay" 
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition border border-slate-200 dark:border-slate-700"
              >
                <span className="material-symbols-outlined text-2xl text-emerald-600 dark:text-emerald-400">
                  play_arrow
                </span>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 leading-none">Get it on</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">Google Play</p>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="#fb" className="hover:text-blue-600 transition" aria-label="Facebook">
                <span className="material-symbols-outlined text-xl">share</span>
              </a>
              <a href="#web" className="hover:text-blue-600 transition" aria-label="Website">
                <span className="material-symbols-outlined text-xl">language</span>
              </a>
              <a href="#chat" className="hover:text-blue-600 transition" aria-label="Chat Support">
                <span className="material-symbols-outlined text-xl">forum</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} JobPortal Corporation. {isEn ? 'All rights reserved.' : 'Tất cả các quyền được bảo lưu.'}</p>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#terms" className="hover:text-blue-600 transition">{isEn ? 'Terms of Service' : 'Điều khoản sử dụng'}</a>
            <a href="#privacy" className="hover:text-blue-600 transition">{isEn ? 'Privacy Policy' : 'Chính sách bảo mật'}</a>
            <a href="#rules" className="hover:text-blue-600 transition">{isEn ? 'Platform Regulations' : 'Quy chế hoạt động'}</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
