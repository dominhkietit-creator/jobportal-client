import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import GoogleLoginModal from '../components/auth/GoogleLoginModal';
import { triggerRealGoogleLogin, GOOGLE_CLIENT_ID } from '../utils/googleAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const initialRole = searchParams.get('role') === 'employer' ? 'Employer' : 'Candidate';
  const [role, setRole] = useState(initialRole); // 'Candidate' | 'Employer'

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('HR Specialist');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(isEn ? 'Password must be at least 6 characters.' : 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError(isEn ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!agreeTerms) {
      setError(isEn ? 'You must agree to the Terms of Service.' : 'Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post('/Auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        role
      });

      showToast(isEn ? 'Registration successful! Please sign in.' : 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.', 'success');
      navigate('/user-login');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || (isEn ? 'Registration failed. Email might already be taken.' : 'Đăng ký thất bại. Email có thể đã được sử dụng.');
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const existingId = 
      import.meta.env.VITE_GOOGLE_CLIENT_ID || 
      localStorage.getItem('jobportal_google_client_id') ||
      GOOGLE_CLIENT_ID;

    triggerRealGoogleLogin({
      role,
      clientId: existingId,
      onSuccess: (data) => {
        showToast(`Đăng nhập Google thành công! Xin chào ${data.fullName}`, 'success');
        if (data.role === 'Employer') {
          navigate('/employer');
        } else {
          navigate('/');
        }
      },
      onError: (err) => {
        if (err === 'MISSING_CLIENT_ID') {
          setShowGoogleModal(true);
        } else {
          showToast(typeof err === 'string' ? err : 'Đăng nhập Google thất bại.', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF] dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* LEFT COLUMN: BRAND STORY & SOCIAL PROOF (5 Cols) */}
        <div className="lg:col-span-5 relative flex flex-col justify-between p-8 sm:p-10 bg-gradient-to-br from-[#00288E] via-[#1E40AF] to-[#2563EB] text-white overflow-hidden">
          
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Top Brand Header */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-emerald-300 shadow-sm">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight block leading-none text-white">JobPortal</span>
                <span className="text-[10px] tracking-widest uppercase text-blue-200 font-semibold">Career Ecosystem</span>
              </div>
            </Link>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Gia nhập cùng 2,500,000+ thành viên
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                Nâng tầm vị thế sự nghiệp & tuyển dụng dẫn đầu
              </h1>

              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Hệ sinh thái kết nối thông minh, bảo mật và trực tiếp giữa các tài năng tinh hoa cùng hơn 15,000 doanh nghiệp hàng đầu tại Việt Nam.
              </p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="relative z-10 grid grid-cols-2 gap-3 my-6">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-xl font-black text-emerald-300 block">94.8%</span>
              <span className="text-[11px] text-blue-100">Tỷ lệ kết nối thành công</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-xl font-black text-emerald-300 block">3.5 Ngày</span>
              <span className="text-[11px] text-blue-100">Thời gian phản hồi CV</span>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1 text-amber-300 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[16px]">star</span>
              ))}
            </div>
            <p className="text-xs italic text-blue-50 leading-relaxed mb-3">
              “Nhờ JobPortal, tôi đã nhận được offer vị trí Senior Product Manager tại tập đoàn công nghệ chỉ sau 8 ngày nộp hồ sơ.”
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-300 text-[#00288E] font-bold flex items-center justify-center text-xs">
                HL
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">Nguyễn Hoàng Lan</p>
                <p className="text-[10px] text-blue-200">Senior Product Manager • Fintech VN</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REGISTRATION FORM (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white dark:bg-slate-800">
          <div className="max-w-md w-full mx-auto">
            
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isEn ? 'Create your Account' : 'Tạo tài khoản JobPortal'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isEn ? 'Select your role to get started' : 'Chọn vai trò của bạn để bắt đầu trải nghiệm'}
              </p>
            </div>

            {/* Role Toggle Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setRole('Candidate')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  role === 'Candidate'
                    ? 'bg-white dark:bg-slate-800 text-[#00288E] dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span>{isEn ? 'Job Seeker' : 'Tôi là Ứng viên'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('Employer')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  role === 'Employer'
                    ? 'bg-white dark:bg-slate-800 text-[#00288E] dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">domain</span>
                <span>{isEn ? 'Employer' : 'Tôi là Nhà tuyển dụng'}</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              
              {/* Họ tên */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {role === 'Candidate' ? 'Họ và tên của bạn' : 'Họ và tên người đại diện'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {role === 'Employer' ? 'Email công việc' : 'Địa chỉ Email'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* If Employer: Company Name & Position */}
              {role === 'Employer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/60 dark:bg-slate-900/60 rounded-2xl border border-blue-100 dark:border-slate-700">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Tên công ty / Doanh nghiệp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Tập đoàn FPT / Shopee..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Vị trí công tác
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="HR Specialist">Chuyên viên nhân sự (HR)</option>
                      <option value="Hiring Manager">Trưởng bộ phận tuyển dụng</option>
                      <option value="Director">Giám đốc / Founder</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Mật khẩu & Xác nhận */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-200">
                      Mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <span>
                    Tôi đồng ý với <a href="#terms" className="text-blue-600 underline">Điều khoản dịch vụ</a> và <a href="#privacy" className="text-blue-600 underline">Chính sách bảo mật</a> của JobPortal.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Hoàn tất đăng ký</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Social Separator */}
            <div className="relative my-6 text-center">
              <div className="w-full h-px bg-slate-200 dark:border-slate-700"></div>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                Hoặc đăng ký nhanh với
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.97 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Đăng ký nhanh với Google</span>
            </button>

            <GoogleLoginModal
              isOpen={showGoogleModal}
              onClose={() => setShowGoogleModal(false)}
              role={role}
              onSuccess={() => navigate('/')}
            />

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'Already have an account?' : 'Bạn đã có tài khoản JobPortal?'}{' '}
              <Link to="/user-login" className="text-[#00288E] dark:text-blue-400 font-bold hover:underline">
                {isEn ? 'Sign In here' : 'Đăng nhập ngay'}
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
