import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import GoogleLoginModal from '../components/auth/GoogleLoginModal';
import { triggerRealGoogleLogin, GOOGLE_CLIENT_ID } from '../utils/googleAuth';

export default function UserLoginPage() {
  const navigate = useNavigate();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [roleTab, setRoleTab] = useState('candidate'); // 'candidate' | 'employer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/Auth/user-login', {
        email: email.trim(),
        password
      });

      const { token, email: userEmail, fullName, role } = res.data;

      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_email', userEmail);
      localStorage.setItem('user_name', fullName);
      localStorage.setItem('user_role', role);

      showToast(`Xin chào mừng ${fullName}!`, 'success');

      // Khi đăng nhập thành công thì chuyển sang trang chủ
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || (isEn ? 'Invalid email or password.' : 'Email hoặc mật khẩu không chính xác.');
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const fillCandidateDemo = () => {
    setEmail('candidate1@gmail.com');
    setPassword('123456');
    setRoleTab('candidate');
  };

  const fillEmployerDemo = () => {
    setEmail('employer2@gmail.com');
    setPassword('123456');
    setRoleTab('employer');
  };

  const handleGoogleClick = () => {
    const existingId = 
      import.meta.env.VITE_GOOGLE_CLIENT_ID || 
      localStorage.getItem('jobportal_google_client_id') ||
      GOOGLE_CLIENT_ID;

    triggerRealGoogleLogin({
      role: roleTab,
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
    <div className="min-h-screen bg-[#FAF8FF] dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: CAREER NARRATIVE & SOCIAL PROOF (5 Cols) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-8 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-sm relative overflow-hidden">
          
          {/* Decorative Glows */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="relative z-10 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00288E] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <span className="material-symbols-outlined text-lg">workspace_premium</span>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#00288E] dark:text-blue-400">JobPortal</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-700 shadow-xs border border-slate-200 dark:border-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Hơn 50,000+ Cơ hội việc làm
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              Khởi đầu bước tiến mới cho sự nghiệp
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Kết nối trực tiếp cùng các nhà tuyển dụng hàng đầu và những tập đoàn tiên phong tại Việt Nam & quốc tế.
            </p>
          </div>

          {/* Trust Card */}
          <div className="relative z-10 bg-white dark:bg-slate-700 p-4 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-600 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                MP
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">Nguyễn Mai Phương</h4>
                <p className="text-[10px] text-slate-400 truncate">Head of Talent Acquisition - VNP Group</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
              “JobPortal giúp chúng tôi tiếp cận 85% ứng viên tài năng với độ chuẩn xác chuyên môn vượt trội.”
            </p>

            <div className="pt-2">
              <div className="flex items-center justify-between pb-1 text-[10px] font-bold">
                <span className="text-slate-500">Tỷ lệ phản hồi phỏng vấn</span>
                <span className="text-emerald-600">94.2%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[94%]"></div>
              </div>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="relative z-10 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs border border-slate-200/60 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-200">
              <span className="material-symbols-outlined text-blue-600 text-lg">verified_user</span>
              <span>Hồ sơ bảo mật</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs border border-slate-200/60 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-200">
              <span className="material-symbols-outlined text-emerald-600 text-lg">bolt</span>
              <span>Ứng tuyển 1 chạm</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LOGIN CARD (7 Cols) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center w-full">
          <div className="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-6 sm:p-10">
            
            {/* Header Branding */}
            <div className="flex flex-col items-center text-center space-y-1.5 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#00288E] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-[#00288E] dark:text-blue-400">
                  Job<span className="text-emerald-600 dark:text-emerald-400">Portal</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Đồng hành cùng sự nghiệp tương lai của bạn
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex items-center mb-6">
              <button
                type="button"
                onClick={() => setRoleTab('candidate')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  roleTab === 'candidate'
                    ? 'bg-white dark:bg-slate-800 text-[#00288E] dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">person</span>
                <span>Ứng viên</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleTab('employer')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  roleTab === 'employer'
                    ? 'bg-white dark:bg-slate-800 text-[#00288E] dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">domain</span>
                <span>Nhà tuyển dụng</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              
              {/* Email Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Email đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-lg pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={roleTab === 'candidate' ? 'candidate1@gmail.com' : 'employer2@gmail.com'}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <Link to="/forgot-password" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                {/* Quick Fill Demo buttons */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>Thử nhanh:</span>
                  <button
                    type="button"
                    onClick={fillCandidateDemo}
                    className="px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold hover:underline cursor-pointer"
                  >
                    Ứng viên
                  </button>
                  <button
                    type="button"
                    onClick={fillEmployerDemo}
                    className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
                  >
                    NTD
                  </button>
                </div>
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
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập</span>
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
                Hoặc tiếp tục với
              </span>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleClick}
                className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer active:scale-98"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.97 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Tính năng đăng nhập LinkedIn đang được tích hợp.', 'info')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <span className="font-bold text-blue-600">in</span>
                <span>LinkedIn</span>
              </button>
            </div>

            {/* Google Login Modal Popup */}
            <GoogleLoginModal
              isOpen={showGoogleModal}
              onClose={() => setShowGoogleModal(false)}
              role={roleTab}
              onSuccess={() => navigate('/')}
            />

            {/* Register Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'Don\'t have an account?' : 'Chưa có tài khoản JobPortal?'}{' '}
              <Link to="/register" className="text-[#00288E] dark:text-blue-400 font-bold hover:underline">
                {isEn ? 'Register here' : 'Đăng ký ngay'}
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
