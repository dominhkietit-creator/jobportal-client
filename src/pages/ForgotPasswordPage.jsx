import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ThemeToggle } from '../contexts/ThemeContext';
import { LanguageToggle, useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { isEn } = useLanguage();
    const { showToast } = useToast();

    // Step 1: Input email | Step 2: Input OTP + new password | Step 3: Success
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

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

    // Step 1: Send OTP to registered email
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email.trim()) return;

        setError('');
        setInfoMessage('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/Auth/forgot-password/send-otp', {
                email: email.trim()
            });

            setStep(2);
            setCountdown(60);
            setInfoMessage(res.data.message || (isEn ? `A 6-digit reset code has been sent to ${email}.` : `Mã OTP đặt lại mật khẩu gồm 6 chữ số đã được gửi tới ${email}.`));
            if (res.data.devOtp) {
                setDevOtp(res.data.devOtp);
                setOtpCode(res.data.devOtp);
            }
            showToast(isEn ? 'OTP code sent to your email!' : 'Đã gửi mã xác thực OTP về email của bạn!', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 
                (isEn ? 'Could not find account with this email.' : 'Không tìm thấy tài khoản với email này hoặc tài khoản đã bị khóa.');
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            showToast(typeof msg === 'string' ? msg : 'Lỗi gửi OTP', 'error');
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
            const res = await axiosClient.post('/Auth/forgot-password/send-otp', {
                email: email.trim()
            });

            setCountdown(60);
            setInfoMessage(res.data.message || (isEn ? 'A new OTP has been sent to your email.' : 'Mã OTP mới đã được gửi tới email của bạn.'));
            if (res.data.devOtp) {
                setDevOtp(res.data.devOtp);
                setOtpCode(res.data.devOtp);
            }
            showToast(isEn ? 'New OTP code sent!' : 'Đã gửi lại mã OTP mới!', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || (isEn ? 'Failed to resend OTP.' : 'Không thể gửi lại mã OTP.');
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            showToast(typeof msg === 'string' ? msg : 'Lỗi gửi lại OTP', 'error');
        } finally {
            setResendLoading(false);
        }
    };

    // Step 2: Reset password
    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError(isEn ? 'Password must be at least 6 characters.' : 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(isEn ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);

        try {
            const res = await axiosClient.post('/Auth/forgot-password/reset', {
                email: email.trim(),
                otpCode: otpCode.trim(),
                newPassword,
                confirmPassword
            });

            setStep(3);
            showToast(res.data.message || (isEn ? 'Password reset successfully!' : 'Đặt lại mật khẩu thành công!'), 'success');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 
                (isEn ? 'Failed to reset password. Please verify your OTP code.' : 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP.');
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            showToast(typeof msg === 'string' ? msg : 'Lỗi đặt lại mật khẩu', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-3 sm:p-4 transition-colors">
            {/* Top Bar Toggles */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-2">
                <LanguageToggle />
                <ThemeToggle />
            </div>

            <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 sm:p-8 transition-colors">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-3">
                        🔑
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight text-center">
                        {isEn ? 'Forgot Password' : 'Quên Mật Khẩu'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                        {isEn 
                            ? 'Reset your password using a 6-digit OTP sent to your registered email' 
                            : 'Đặt lại mật khẩu qua mã xác thực OTP gửi về địa chỉ email đã đăng ký'}
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2 text-xs">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                            step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>1</span>
                        <span className={`text-[11px] ${step >= 1 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                            {isEn ? 'Enter Email' : 'Nhập Email'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">→</span>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                            step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>2</span>
                        <span className={`text-[11px] ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                            {isEn ? 'OTP & Password' : 'OTP & Mật khẩu'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">→</span>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                            step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>✓</span>
                    </div>
                </div>

                {/* Status Messages */}
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

                {/* STEP 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                {isEn ? 'Registered Email Address' : 'Địa chỉ Email đã đăng ký'}
                            </label>
                            <input
                                type="email"
                                required
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="dkiet4532@gmail.com"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {isEn 
                                    ? 'We will send a 6-digit confirmation OTP to this email.' 
                                    : 'Hệ thống sẽ gửi một mã OTP gồm 6 chữ số đến hòm thư này để xác minh quyền sở hữu.'}
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading 
                                    ? (isEn ? 'Sending OTP code...' : 'Đang gửi mã OTP...') 
                                    : (isEn ? 'Send Verification OTP' : 'Gửi mã xác thực OTP')}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: Enter OTP & New Password */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                            <p className="text-slate-700 dark:text-slate-200 text-xs">
                                {isEn ? 'Verification code sent to:' : 'Mã OTP đã được gửi về:'}
                            </p>
                            <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm mt-0.5 break-all">
                                {email}
                            </p>
                        </div>

                        {devOtp && (
                            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-center text-[11px] text-amber-800 dark:text-amber-300">
                                ⚡ {isEn ? 'Quick Test OTP Code:' : 'Mã OTP thử nghiệm nhanh:'} <strong className="font-mono text-sm tracking-widest">{devOtp}</strong>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-semibold text-slate-700 dark:text-slate-200">
                                    {isEn ? '6-digit OTP Code' : 'Mã xác thực OTP (6 chữ số)'}
                                </label>
                                <button
                                    type="button"
                                    disabled={countdown > 0 || resendLoading}
                                    onClick={handleResendOtp}
                                    className={`text-[11px] font-semibold ${
                                        countdown > 0 || resendLoading
                                            ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                            : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer underline'
                                    }`}
                                >
                                    {resendLoading
                                        ? (isEn ? 'Sending...' : 'Đang gửi...')
                                        : countdown > 0 
                                            ? (isEn ? `Resend (${countdown}s)` : `Gửi lại (${countdown}s)`)
                                            : (isEn ? 'Resend OTP' : 'Gửi lại mã')}
                                </button>
                            </div>
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

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-semibold text-slate-700 dark:text-slate-200">
                                    {isEn ? 'New Password' : 'Mật khẩu mới'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    {showPassword ? (isEn ? 'Hide' : 'Ẩn') : (isEn ? 'Show' : 'Hiện')}
                                </button>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                {isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="pt-2 flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setError('');
                                    setInfoMessage('');
                                }}
                                className="w-1/3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                                {isEn ? 'Back' : 'Quay lại'}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || otpCode.length < 6 || !newPassword || !confirmPassword}
                                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading 
                                    ? (isEn ? 'Resetting...' : 'Đang xử lý...') 
                                    : (isEn ? 'Update Password' : 'Xác nhận đổi mật khẩu')}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: Success Screen */}
                {step === 3 && (
                    <div className="text-center py-4 space-y-4">
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl font-bold">
                            ✓
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {isEn ? 'Password Reset Successfully!' : 'Đặt lại mật khẩu thành công!'}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {isEn 
                                ? 'Your account password has been updated. You can now log in using your new credentials.' 
                                : 'Mật khẩu tài khoản của bạn đã được cập nhật thành công. Bạn có thể đăng nhập ngay với mật khẩu mới.'}
                        </p>
                        <div className="pt-2">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-sm"
                            >
                                {isEn ? 'Back to Login' : 'Đăng nhập ngay'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Back to Login and Distinct Lost Email Banner */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="text-center">
                        <Link
                            to="/login"
                            className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition"
                        >
                            ← {isEn ? 'Back to Sign In' : 'Quay lại trang Đăng nhập'}
                        </Link>
                    </div>

                    {/* Distinct card pointing to Lost Email recovery */}
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60">
                        <div className="flex items-start space-x-2.5">
                            <span className="text-base mt-0.5">🛡️</span>
                            <div className="text-left flex-1">
                                <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                                    {isEn ? 'Lost access to registered email?' : 'Bạn bị mất luôn quyền truy cập vào Email?'}
                                </div>
                                <div className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                                    {isEn 
                                        ? 'If you cannot receive OTP via email, use our identity verification and support service.' 
                                        : 'Nếu không thể nhận OTP qua email, hãy sử dụng quy trình khôi phục danh tính qua SĐT/CMND.'}
                                </div>
                                <Link
                                    to="/recovery"
                                    className="inline-block mt-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200 underline"
                                >
                                    {isEn ? 'Go to Lost Email Account Recovery →' : 'Tới trang Khôi phục khi mất Email →'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
