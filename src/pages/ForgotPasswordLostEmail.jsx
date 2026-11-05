import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ThemeToggle } from '../contexts/ThemeContext';
import { LanguageToggle, useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function ForgotPasswordLostEmail() {
    const navigate = useNavigate();
    const { t, isEn } = useLanguage();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('instant'); // 'instant' | 'ticket' | 'track'

    // Form Khôi phục tự động (Instant)
    const [step, setStep] = useState(1); // 1: verify, 2: send-otp, 3: reset
    const [accountEmail, setAccountEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifiedInfo, setVerifiedInfo] = useState(null);
    const [otpSentMessage, setOtpSentMessage] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [resetSuccessMessage, setResetSuccessMessage] = useState('');

    // Form Gửi Phiếu yêu cầu Ban Quản Trị (Ticket)
    const [ticketAccountEmail, setTicketAccountEmail] = useState('');
    const [ticketFullName, setTicketFullName] = useState('');
    const [ticketPhone, setTicketPhone] = useState('');
    const [ticketNewEmail, setTicketNewEmail] = useState('');
    const [ticketIdentityCard, setTicketIdentityCard] = useState('');
    const [ticketReason, setTicketReason] = useState('');
    const [ticketLoading, setTicketLoading] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState(null);

    // Form Tra cứu Phiếu yêu cầu (Track)
    const [trackTicketId, setTrackTicketId] = useState('');
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackResult, setTrackResult] = useState(null);

    // Xử lý Bước 1: Xác minh thông tin tài khoản
    const handleVerifyAccount = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosClient.post('/Auth/recovery/verify-account', {
                accountEmail,
                fullName,
                phoneNumber
            });
            setVerifiedInfo(res.data);
            setStep(2);
            showToast(isEn ? 'Account information verified successfully!' : 'Đã xác minh thông tin tài khoản thành công!', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Verification failed. Please check your information.' : 'Xác minh không thành công. Vui lòng kiểm tra lại thông tin.');
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý Bước 2: Gửi mã OTP về email mới
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosClient.post('/Auth/recovery/send-otp', {
                accountEmail,
                fullName,
                phoneNumber,
                newEmail
            });
            setOtpSentMessage(res.data.message);
            if (res.data.devOtp) {
                setDevOtp(res.data.devOtp);
                setOtpCode(res.data.devOtp); // Tự động điền nếu có mã dev
            }
            setStep(3);
            showToast(res.data.message, 'success');
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Failed to send OTP.' : 'Không thể gửi mã OTP.');
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý Bước 3: Đặt lại mật khẩu
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast(isEn ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.', 'warning');
            return;
        }
        if (newPassword.length < 6) {
            showToast(isEn ? 'Password must be at least 6 characters.' : 'Mật khẩu phải có ít nhất 6 ký tự.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await axiosClient.post('/Auth/recovery/reset-password', {
                accountEmail,
                fullName,
                phoneNumber,
                newEmail,
                otpCode,
                newPassword,
                confirmPassword
            });
            setResetSuccessMessage(res.data.message);
            showToast(res.data.message, 'success');
            setStep(4); // Hoàn tất
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Failed to reset password.' : 'Đặt lại mật khẩu thất bại.');
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Gửi Phiếu yêu cầu tới Ban Quản Trị
    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        setTicketLoading(true);
        try {
            const res = await axiosClient.post('/Auth/recovery/ticket', {
                accountEmail: ticketAccountEmail,
                fullName: ticketFullName,
                phoneNumber: ticketPhone,
                newContactEmail: ticketNewEmail,
                reason: ticketReason,
                identityCardNumber: ticketIdentityCard
            });
            setSubmittedTicket(res.data);
            showToast(res.data.message, 'success');
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Failed to submit recovery ticket.' : 'Gửi yêu cầu khôi phục thất bại.');
            showToast(msg, 'error');
        } finally {
            setTicketLoading(false);
        }
    };

    // Tra cứu Phiếu yêu cầu
    const handleTrackTicket = async (e) => {
        e.preventDefault();
        if (!trackTicketId) return;
        setTrackLoading(true);
        setTrackResult(null);
        try {
            const res = await axiosClient.get(`/Auth/recovery/ticket/${trackTicketId}`);
            setTrackResult(res.data);
            showToast(isEn ? 'Ticket status retrieved.' : 'Đã tải thông tin phiếu yêu cầu.', 'info');
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Ticket not found.' : 'Không tìm thấy phiếu yêu cầu với mã này.');
            showToast(msg, 'error');
        } finally {
            setTrackLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors flex flex-col justify-between p-3 sm:p-6">
            {/* Header thanh điều hướng góc trên */}
            <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-200">
                <Link to="/login" className="flex items-center space-x-2.5 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-700 transition">
                        T
                    </div>
                    <div>
                        <h1 className="font-bold text-base text-slate-900 tracking-tight leading-tight">TopJob</h1>
                        <p className="text-[11px] text-slate-500">Security & Account Assistance</p>
                    </div>
                </Link>

                <div className="flex items-center space-x-2">
                    <LanguageToggle />
                    <ThemeToggle />
                    <Link
                        to="/login"
                        className="ml-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                    >
                        ← {isEn ? 'Back to Sign In' : 'Về Đăng nhập'}
                    </Link>
                </div>
            </header>

            {/* Nội dung chính */}
            <main className="max-w-3xl w-full mx-auto my-6">
                {/* Banner phân biệt rõ với Quên mật khẩu thông thường */}
                <div className="mb-4 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2.5">
                        <span className="text-lg">🔑</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {isEn 
                                ? 'Still have access to your registered email?' 
                                : 'Bạn vẫn còn quyền đăng nhập vào hòm thư Email đăng ký?'}
                        </span>
                    </div>
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center text-blue-700 dark:text-blue-300 font-bold hover:underline"
                    >
                        {isEn ? 'Use Standard Password Reset →' : 'Dùng tính năng Quên Mật Khẩu thông thường →'}
                    </Link>
                </div>

                {/* Banner cảnh báo & hướng dẫn */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
                    <div className="flex items-start space-x-3.5">
                        <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs text-xl">
                            🛡️
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                                {isEn ? 'Account Recovery (Lost Registered Email)' : 'Khôi Phục Mật Khẩu Khi Bị Mất Quyền Truy Cập Email'}
                            </h2>
                            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                                {isEn
                                    ? 'If you forgot your password and can no longer log in to your old email address, use this secure process to verify your identity and restore access with a new email.'
                                    : 'Trong trường hợp bạn quên mật khẩu và đồng thời hòm thư email đăng ký cũ đã bị khóa hoặc mất quyền truy cập, hệ thống cung cấp quy trình bảo mật giúp xác minh danh tính và khôi phục tài khoản với email mới.'}
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setActiveTab('instant')}
                            className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                                activeTab === 'instant'
                                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            ⚡ {isEn ? '1. Instant Verification' : '1. Khôi phục trực tiếp'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('ticket')}
                            className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                                activeTab === 'ticket'
                                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            📝 {isEn ? '2. Submit Admin Ticket' : '2. Gửi phiếu Ban Quản Trị'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('track')}
                            className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                                activeTab === 'track'
                                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            🔍 {isEn ? '3. Track Ticket Status' : '3. Tra cứu tiến độ'}
                        </button>
                    </div>
                </div>

                {/* TAB 1: KHÔI PHỤC TỰ ĐỘNG QUA ĐỐI SOÁT & OTP EMAIL MỚI */}
                {activeTab === 'instant' && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7">
                        {/* Progress Stepper */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 text-xs">
                            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>1</span>
                                <span>{isEn ? 'Verify Account' : 'Xác minh tài khoản'}</span>
                            </div>
                            <span className="text-slate-300">───</span>
                            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>2</span>
                                <span>{isEn ? 'New Email & OTP' : 'Email mới & OTP'}</span>
                            </div>
                            <span className="text-slate-300">───</span>
                            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>3</span>
                                <span>{isEn ? 'Set Password' : 'Đặt mật khẩu mới'}</span>
                            </div>
                        </div>

                        {/* Bước 1: Đối soát thông tin chủ sở hữu */}
                        {step === 1 && (
                            <form onSubmit={handleVerifyAccount} className="space-y-4 text-xs">
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[11px] leading-relaxed">
                                    💡 <strong>{isEn ? 'Identity Check:' : 'Đối soát danh tính:'}</strong> {isEn 
                                        ? 'Please provide your account email and full name to confirm ownership of the account.' 
                                        : 'Vui lòng cung cấp chính xác địa chỉ email của tài khoản cần lấy lại và Họ tên đã đăng ký để hệ thống đối soát dữ liệu.'}
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'Account Email (Lost Access)' : 'Email tài khoản cần khôi phục (đã bị mất quyền truy cập)'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={accountEmail}
                                        onChange={(e) => setAccountEmail(e.target.value)}
                                        placeholder="vidu: candidate@gmail.com"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'Full Name Registered' : 'Họ và tên chủ tài khoản'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder={isEn ? 'e.g. Nguyen Van A' : 'ví dụ: Nguyễn Văn A (có thể gõ có dấu hoặc không dấu)'}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'Registered Phone Number (if any)' : 'Số điện thoại liên kết (nếu tài khoản đã có)'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="0912345678"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        {isEn ? 'If your account does not have a phone number, leave this blank.' : 'Nếu tài khoản chưa từng cập nhật số điện thoại, bạn có thể để trống mục này.'}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <span>{isEn ? 'Verifying...' : 'Đang đối soát dữ liệu...'}</span>
                                    ) : (
                                        <span>{isEn ? 'Next: Enter New Email →' : 'Tiếp tục: Nhập Email mới →'}</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Bước 2: Nhập email mới và gửi OTP */}
                        {step === 2 && (
                            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                                    ✓ <strong>{isEn ? 'Account matched:' : 'Đã tìm thấy tài khoản:'}</strong> {verifiedInfo?.fullName} ({verifiedInfo?.accountEmail})
                                    {verifiedInfo?.hasRegisteredPhone && (
                                        <div className="mt-1 text-[11px] text-emerald-700">
                                            {isEn ? 'Linked Phone: ' : 'Số điện thoại liên kết: '} {verifiedInfo.maskedPhone}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'New Contact Email (Active mailbox)' : 'Địa chỉ Email mới (Hòm thư bạn đang sử dụng)'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="email.moi@gmail.com"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        {isEn 
                                            ? 'A 6-digit OTP will be sent to this email. Once confirmed, this will become your new sign-in email.' 
                                            : 'Hệ thống sẽ gửi mã xác thực OTP 6 chữ số tới email này. Khi hoàn tất, đây sẽ là email đăng nhập mới của bạn.'}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        ← {isEn ? 'Back' : 'Quay lại'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                                    >
                                        {loading ? (
                                            <span>{isEn ? 'Sending OTP via Gmail...' : 'Đang gửi mã OTP qua Gmail SMTP...'}</span>
                                        ) : (
                                            <span>{isEn ? 'Send 6-digit OTP Code →' : 'Gửi mã OTP 6 số qua Email mới →'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Bước 3: Nhập OTP và Mật khẩu mới */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                                {otpSentMessage && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] leading-relaxed">
                                        📩 {otpSentMessage}
                                    </div>
                                )}

                                {devOtp && (
                                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-center justify-between">
                                        <div>
                                            <strong>{isEn ? 'Testing OTP Code: ' : 'Mã OTP thử nghiệm: '}</strong>
                                            <span className="font-mono text-base font-black text-blue-700 tracking-wider ml-1">{devOtp}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setOtpCode(devOtp)}
                                            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded text-[10px] font-bold transition cursor-pointer"
                                        >
                                            {isEn ? 'Use Code' : 'Áp dụng mã'}
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="font-semibold text-slate-700">
                                            {isEn ? 'Verification Code (OTP)' : 'Mã xác thực OTP (6 chữ số)'} <span className="text-rose-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                            className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium"
                                        >
                                            {isEn ? 'Resend OTP' : 'Gửi lại mã'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-center font-mono text-lg tracking-widest text-blue-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'New Password' : 'Mật khẩu mới'} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder={isEn ? 'At least 6 characters' : 'Tối thiểu 6 ký tự'}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'Confirm New Password' : 'Xác nhận lại mật khẩu mới'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        ← {isEn ? 'Back' : 'Quay lại'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                                    >
                                        {loading ? (
                                            <span>{isEn ? 'Updating Account...' : 'Đang cập nhật tài khoản...'}</span>
                                        ) : (
                                            <span>{isEn ? 'Confirm & Reset Password' : 'Xác nhận & Hoàn tất Đổi Mật Khẩu'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Bước 4: Thành công */}
                        {step === 4 && (
                            <div className="py-6 text-center space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                                    ✓
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isEn ? 'Account Recovery Succeeded!' : 'Khôi Phục Tài Khoản Thành Công!'}
                                </h3>
                                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                    {resetSuccessMessage || (isEn 
                                        ? 'Your password has been reset, and your sign-in email has been updated to your new address. You can now log in securely.' 
                                        : 'Mật khẩu của bạn đã được cập nhật thành công và email đăng nhập đã được chuyển sang địa chỉ email mới.')}
                                </p>
                                <div className="p-3 bg-slate-100 rounded-xl text-xs max-w-sm mx-auto font-mono text-slate-800">
                                    <strong>{isEn ? 'New Sign-in Email: ' : 'Email đăng nhập mới: '}</strong> {newEmail}
                                </div>
                                <div className="pt-2">
                                    <Link
                                        to="/login"
                                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition text-xs shadow-md"
                                    >
                                        {isEn ? 'Proceed to Sign In →' : 'Đăng nhập ngay bây giờ →'}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: GỬI PHIẾU YÊU CẦU TỚI BAN QUẢN TRỊ */}
                {activeTab === 'ticket' && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7">
                        <div className="mb-5 pb-4 border-b border-slate-100">
                            <h3 className="font-bold text-sm text-slate-900">
                                {isEn ? 'Submit Assisted Account Recovery Ticket' : 'Gửi Phiếu Yêu Cầu Khôi Phục Tới Ban Quản Trị'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isEn
                                    ? 'Use this if you cannot verify your account automatically or need manual review with identity documents.'
                                    : 'Dành cho trường hợp bạn không thể khôi phục tự động hoặc cần ban quản trị đối soát thủ công giấy tờ tùy thân / hồ sơ tuyển dụng.'}
                            </p>
                        </div>

                        {submittedTicket ? (
                            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto">
                                    ✓
                                </div>
                                <h4 className="font-bold text-sm text-emerald-900">
                                    {isEn ? 'Recovery Ticket Submitted Successfully' : 'Gửi Phiếu Yêu Cầu Thành Công'}
                                </h4>
                                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                                    {submittedTicket.message}
                                </p>
                                <div className="p-2.5 bg-white border border-emerald-300 rounded-lg inline-block text-xs font-mono font-bold text-blue-700">
                                    {isEn ? 'Your Ticket ID: #' : 'Mã phiếu của bạn: #'}{submittedTicket.ticketId}
                                </div>
                                <div className="pt-2 flex justify-center space-x-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTrackTicketId(submittedTicket.ticketId.toString());
                                            setActiveTab('track');
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition cursor-pointer"
                                    >
                                        🔍 {isEn ? 'Track This Ticket' : 'Theo dõi trạng thái phiếu'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubmittedTicket(null)}
                                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        {isEn ? 'Submit Another' : 'Gửi phiếu khác'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            {isEn ? 'Account Email (Lost Access)' : 'Email tài khoản cần khôi phục'} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={ticketAccountEmail}
                                            onChange={(e) => setTicketAccountEmail(e.target.value)}
                                            placeholder="email.bi.mat@gmail.com"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            {isEn ? 'Account Full Name' : 'Họ và tên chủ tài khoản'} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={ticketFullName}
                                            onChange={(e) => setTicketFullName(e.target.value)}
                                            placeholder={isEn ? 'Your Full Name' : 'Nguyễn Văn A'}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            {isEn ? 'Contact Phone Number' : 'Số điện thoại liên hệ hiện tại'} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={ticketPhone}
                                            onChange={(e) => setTicketPhone(e.target.value)}
                                            placeholder="0912345678"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            {isEn ? 'New Contact Email' : 'Email mới nhận phản hồi / mật khẩu tạm'} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={ticketNewEmail}
                                            onChange={(e) => setTicketNewEmail(e.target.value)}
                                            placeholder="email.lienhe.moi@gmail.com"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'ID / Citizen Card Number (Optional for high verification)' : 'Số CCCD / CMND hoặc Mã số ứng viên (tùy chọn)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={ticketIdentityCard}
                                        onChange={(e) => setTicketIdentityCard(e.target.value)}
                                        placeholder="07920100xxxx"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        {isEn ? 'Helps administrators verify your identity faster.' : 'Giúp Ban Quản Trị đối soát và xác thực quyền sở hữu nhanh chóng hơn.'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        {isEn ? 'Reason for Email Access Loss & Verification Details' : 'Lý do mất quyền truy cập email & Mô tả bổ sung'} <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={ticketReason}
                                        onChange={(e) => setTicketReason(e.target.value)}
                                        placeholder={isEn 
                                            ? 'Describe why you cannot access your old email (e.g. company domain terminated, two-factor lock, forgotten password)...' 
                                            : 'Mô tả lý do bạn không thể truy cập hòm thư cũ (ví dụ: mất số điện thoại xác minh 2 bước Google, tên miền công ty cũ đóng cửa, email thời sinh viên bị thu hồi)...'}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={ticketLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                                >
                                    {ticketLoading ? (
                                        <span>{isEn ? 'Submitting Ticket...' : 'Đang gửi phiếu yêu cầu...'}</span>
                                    ) : (
                                        <span>{isEn ? 'Submit Recovery Request to Admin' : 'Gửi Phiếu Yêu Cầu Tới Ban Quản Trị'}</span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* TAB 3: TRA CỨU TIẾN ĐỘ PHIẾU YÊU CẦU */}
                {activeTab === 'track' && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7">
                        <div className="mb-5 pb-4 border-b border-slate-100">
                            <h3 className="font-bold text-sm text-slate-900">
                                {isEn ? 'Track Recovery Ticket Status' : 'Tra Cứu Trạng Thái Phiếu Yêu Cầu Khôi Phục'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isEn
                                    ? 'Enter your ticket ID to check review progress by system administrators.'
                                    : 'Nhập mã phiếu yêu cầu để kiểm tra tiến độ xử lý từ Ban Quản Trị.'}
                            </p>
                        </div>

                        <form onSubmit={handleTrackTicket} className="flex items-center space-x-2 max-w-md mb-6">
                            <input
                                type="number"
                                required
                                value={trackTicketId}
                                onChange={(e) => setTrackTicketId(e.target.value)}
                                placeholder={isEn ? 'Enter Ticket ID (e.g. 1)' : 'Nhập mã phiếu (ví dụ: 1)'}
                                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                            />
                            <button
                                type="submit"
                                disabled={trackLoading}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                            >
                                {trackLoading ? (isEn ? 'Searching...' : 'Đang tìm...') : (isEn ? 'Track Status' : 'Tra cứu')}
                            </button>
                        </form>

                        {trackResult && (
                            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 text-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                    <span className="font-bold text-slate-900 text-sm">
                                        {isEn ? 'Ticket #' : 'Phiếu #'}{trackResult.id}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                                            trackResult.status === 'Approved'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                : trackResult.status === 'Rejected'
                                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                                        }`}
                                    >
                                        {trackResult.status === 'Approved'
                                            ? (isEn ? '✓ Approved' : '✓ Đã Phê Duyệt')
                                            : trackResult.status === 'Rejected'
                                            ? (isEn ? '✕ Rejected' : '✕ Từ Chối')
                                            : (isEn ? '⏳ Pending Review' : '⏳ Đang Chờ Duyệt')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-xs">
                                    <div>
                                        <span className="text-slate-400 block">{isEn ? 'Account Email:' : 'Email tài khoản:'}</span>
                                        <span className="font-semibold text-slate-800">{trackResult.accountEmail}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isEn ? 'Full Name:' : 'Chủ tài khoản:'}</span>
                                        <span className="font-semibold text-slate-800">{trackResult.fullName}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isEn ? 'New Contact Email:' : 'Email nhận phản hồi:'}</span>
                                        <span className="font-semibold text-slate-800">{trackResult.newContactEmail}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isEn ? 'Submitted Date:' : 'Ngày gửi:'}</span>
                                        <span className="font-semibold text-slate-800">
                                            {new Date(trackResult.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                {trackResult.adminNote && (
                                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-slate-700">
                                        <span className="font-bold text-slate-900 block mb-1">
                                            {isEn ? 'Admin Note & Feedback:' : 'Phản hồi từ Ban Quản Trị:'}
                                        </span>
                                        {trackResult.adminNote}
                                    </div>
                                )}

                                {trackResult.status === 'Approved' && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] leading-relaxed">
                                        🎉 {isEn 
                                            ? 'Your recovery ticket has been approved! Login instructions with your temporary password have been sent to your new contact email.' 
                                            : 'Yêu cầu của bạn đã được duyệt thành công! Thông tin đăng nhập và mật khẩu tạm thời đã được gửi tới email mới của bạn.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="max-w-4xl w-full mx-auto text-center pt-4 border-t border-slate-200 text-slate-400 text-xs">
                TopJob Recruitment Management Platform • {isEn ? 'Enterprise Security Assistance' : 'Hệ thống Hỗ trợ Bảo mật & Khôi phục Tài khoản'}
            </footer>
        </div>
    );
}
