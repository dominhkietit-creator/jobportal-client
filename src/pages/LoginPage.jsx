import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ThemeToggle } from '../contexts/ThemeContext';
import { LanguageToggle, useLanguage } from '../contexts/LanguageContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { isEn } = useLanguage();

    // Step 1: Credentials | Step 2: OTP Verification
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('dkiet4532@gmail.com');
    const [password, setPassword] = useState('123456');
    const [otpCode, setOtpCode] = useState('');
    const [devOtp, setDevOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [countdown, setCountdown] = useState(60);

    // Countdown timer for OTP
    useEffect(() => {
        let timer;
        if (step === 2 && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    // Handle Step 1: Check credentials & send login OTP
    const handleCredentialSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setInfoMessage('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/Auth/login', { 
                email: email.trim(), 
                password 
            });
            
            // Backend returns requiresOtp: true
            if (res.data?.requiresOtp) {
                setStep(2);
                setCountdown(60);
                setInfoMessage(
                    res.data.message || 
                    (isEn 
                        ? `A 6-digit login verification code was sent to ${email}.` 
                        : `Mã OTP xác thực đăng nhập 6 chữ số đã được gửi về hòm thư ${email}.`)
                );
                if (res.data.devOtp) {
                    setDevOtp(res.data.devOtp);
                    setOtpCode(res.data.devOtp); // Auto-fill for testing ease
                }
            } else {
                // In case OTP was not required (fallback)
                completeLogin(res.data);
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.title || err.response?.data;
            const fallback = isEn 
                ? 'Sign in failed. Please verify your email and password.' 
                : 'Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.';
            setError(typeof serverMsg === 'string' ? serverMsg : fallback);
        } finally {
            setLoading(false);
        }
    };

    // Handle Step 2: Verify OTP
    const handleOtpSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/Auth/login/verify-otp', {
                email: email.trim(),
                otpCode: otpCode.trim()
            });

            completeLogin(res.data);
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.title || err.response?.data;
            const fallback = isEn 
                ? 'Invalid or expired OTP code.' 
                : 'Mã OTP không hợp lệ hoặc đã hết hạn.';
            setError(typeof serverMsg === 'string' ? serverMsg : fallback);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (countdown > 0 || resendLoading) return;
        setError('');
        setResendLoading(true);

        try {
            const res = await axiosClient.post('/Auth/login/resend-otp', { 
                email: email.trim() 
            });
            setCountdown(60);
            setInfoMessage(res.data?.message || (isEn ? 'A new OTP has been sent to your email.' : 'Mã OTP mới đã được gửi tới email của bạn.'));
            if (res.data?.devOtp) {
                setDevOtp(res.data.devOtp);
                setOtpCode(res.data.devOtp);
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.title || err.response?.data;
            const fallback = isEn ? 'Failed to resend OTP.' : 'Không thể gửi lại mã OTP.';
            setError(typeof serverMsg === 'string' ? serverMsg : fallback);
        } finally {
            setResendLoading(false);
        }
    };

    // Store auth info and navigate
    const completeLogin = (data) => {
        const { token, email: userEmail, fullName, role } = data;

        if (role !== 'Admin') {
            setError(isEn ? 'Your account does not have Admin access privileges.' : 'Tài khoản của bạn không có quyền truy cập trang Quản trị (Admin).');
            return;
        }

        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user_email', userEmail);
        localStorage.setItem('user_name', fullName);
        localStorage.setItem('user_role', role);

        navigate('/admin');
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-3 sm:p-4 transition-colors">
            {/* Theme & Language Toggles */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-2">
                <LanguageToggle />
                <ThemeToggle />
            </div>

            <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 sm:p-8 transition-colors">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md mb-3">
                        Job
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight text-center">JobPortal Management</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                        {isEn ? 'Enterprise Recruitment Operations & Administration' : 'Hệ thống Quản Trị Cổng Thông Tin Tuyển Dụng'}
                    </p>
                </div>

                {/* Status Banners */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                        {error}
                    </div>
                )}
                {infoMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                        {infoMessage}
                    </div>
                )}

                {/* STEP 1: Email & Password */}
                {step === 1 && (
                    <form onSubmit={handleCredentialSubmit} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                {isEn ? 'Email Address' : 'Email đăng nhập'}
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="dkiet4532@gmail.com"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-semibold text-slate-700 dark:text-slate-200">
                                    {isEn ? 'Password' : 'Mật khẩu'}
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium transition"
                                >
                                    {isEn ? 'Forgot password?' : 'Quên mật khẩu?'}
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading 
                                    ? (isEn ? 'Verifying credentials & sending OTP...' : 'Đang kiểm tra & gửi mã OTP...') 
                                    : (isEn ? 'Continue (Verify with Email OTP)' : 'Tiếp tục (Xác thực mã OTP qua Email)')}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: Enter OTP Code */}
                {step === 2 && (
                    <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                            <p className="text-slate-700 dark:text-slate-200 text-xs">
                                {isEn ? 'Verification code sent to:' : 'Mã xác thực đã được gửi về:'}
                            </p>
                            <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm mt-0.5 break-all">
                                {email}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {isEn ? 'Please check your inbox or spam folder.' : 'Vui lòng kiểm tra hộp thư đến hoặc mục thư rác (Spam).'}
                            </p>
                        </div>

                        {devOtp && (
                            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-center text-[11px] text-amber-800 dark:text-amber-300">
                                ⚡ {isEn ? 'Quick Test OTP Code:' : 'Mã OTP thử nghiệm nhanh:'} <strong className="font-mono text-sm tracking-widest">{devOtp}</strong>
                            </div>
                        )}

                        <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 text-center">
                                {isEn ? 'Enter 6-digit OTP Code' : 'Nhập mã xác thực OTP (6 chữ số)'}
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                required
                                autoFocus
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-blue-500 rounded-lg px-3 py-2.5 text-center font-mono text-xl tracking-[0.4em] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setError('');
                                    setInfoMessage('');
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                            >
                                ← {isEn ? 'Back to password' : 'Quay lại nhập mật khẩu'}
                            </button>

                            <button
                                type="button"
                                disabled={countdown > 0 || resendLoading}
                                onClick={handleResendOtp}
                                className={`font-semibold ${
                                    countdown > 0 || resendLoading
                                        ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                        : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer underline'
                                }`}
                            >
                                {resendLoading
                                    ? (isEn ? 'Sending...' : 'Đang gửi...')
                                    : countdown > 0 
                                        ? (isEn ? `Resend code in (${countdown}s)` : `Gửi lại mã sau (${countdown}s)`)
                                        : (isEn ? 'Resend OTP code' : 'Gửi lại mã OTP')}
                            </button>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || otpCode.length < 6}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading 
                                    ? (isEn ? 'Verifying OTP...' : 'Đang xác thực OTP...') 
                                    : (isEn ? 'Verify & Sign in' : 'Xác thực & Đăng nhập')}
                            </button>
                        </div>
                    </form>
                )}

               
            </div>
        </div>
    );
}
