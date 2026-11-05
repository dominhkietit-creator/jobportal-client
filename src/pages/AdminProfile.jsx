import { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
    RefreshIcon,
    CheckIcon,
    AlertTriangleIcon,
    LockIcon,
    EyeIcon
} from '../components/admin/AdminCommon';

export default function AdminProfile() {
    const { t, language } = useLanguage();
    const toast = useToast();
    const fileInputRef = useRef(null);

    // Tab đang chọn: 'info' | 'email' | 'password' | 'smtp'
    const [activeTab, setActiveTab] = useState('info');

    // Dữ liệu profile từ API
    const [profile, setProfile] = useState({
        id: 0,
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'Admin',
        avatarUrl: '',
        createdAt: ''
    });
    const [loading, setLoading] = useState(true);

    // Form Thông tin cá nhân
    const [nameForm, setNameForm] = useState({
        fullName: '',
        phoneNumber: '',
        avatarUrl: ''
    });
    const [savingInfo, setSavingInfo] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Form Thay đổi Email
    const [emailForm, setEmailForm] = useState({
        newEmail: '',
        password: '',
        otpCode: ''
    });
    const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [savingEmail, setSavingEmail] = useState(false);
    const [emailOtpSentTo, setEmailOtpSentTo] = useState('');
    const [devEmailOtp, setDevEmailOtp] = useState('');

    // Form Thay đổi Mật khẩu
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otpCode: ''
    });
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [sendingPwdOtp, setSendingPwdOtp] = useState(false);
    const [pwdOtpCooldown, setPwdOtpCooldown] = useState(0);

    // Form Test SMTP
    const [testEmailTarget, setTestEmailTarget] = useState('dkiet4532@gmail.com');
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [smtpResult, setSmtpResult] = useState(null);

    // Tải dữ liệu Profile từ API
    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/Admin/profile');
            setProfile(res.data);
            setNameForm({
                fullName: res.data.fullName || '',
                phoneNumber: res.data.phoneNumber || '',
                avatarUrl: res.data.avatarUrl || ''
            });
            if (res.data.email) {
                setTestEmailTarget(res.data.email);
            }
            // Đồng bộ localStorage
            if (res.data.fullName) localStorage.setItem('user_name', res.data.fullName);
            if (res.data.email) localStorage.setItem('user_email', res.data.email);
            if (res.data.avatarUrl) localStorage.setItem('user_avatar', res.data.avatarUrl);
        } catch (err) {
            console.error('Lỗi nạp profile:', err);
            // Fallback từ localStorage
            const localName = localStorage.getItem('user_name') || 'Super Administrator';
            const localEmail = localStorage.getItem('user_email') || 'admin@jobportal.com';
            const localAvatar = localStorage.getItem('user_avatar') || '';
            setProfile((prev) => ({
                ...prev,
                fullName: localName,
                email: localEmail,
                avatarUrl: localAvatar
            }));
            setNameForm((prev) => ({
                ...prev,
                fullName: localName,
                avatarUrl: localAvatar
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    // Đếm ngược Cooldown gửi OTP Email
    useEffect(() => {
        if (otpCooldown > 0) {
            const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpCooldown]);

    // Đếm ngược Cooldown gửi OTP Password
    useEffect(() => {
        if (pwdOtpCooldown > 0) {
            const timer = setTimeout(() => setPwdOtpCooldown(pwdOtpCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [pwdOtpCooldown]);

    // 1. Tải ảnh lên làm Avatar
    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Giới hạn 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error(
                language === 'en' ? 'File too large' : 'Tệp quá lớn',
                language === 'en' ? 'Please choose an image under 5MB.' : 'Vui lòng chọn ảnh dung lượng dưới 5MB.'
            );
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingAvatar(true);
        try {
            const res = await axiosClient.post('/Upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const uploadedUrl = res.data.imageUrl;
            setNameForm((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
            setProfile((prev) => ({ ...prev, avatarUrl: uploadedUrl }));

            toast.info(
                language === 'en' ? 'Avatar Preview' : 'Xem trước ảnh đại diện',
                language === 'en' ? 'Please click "Save Changes" below to apply this avatar.' : 'Đã chọn ảnh đại diện xem trước. Vui lòng nhấn nút "Lưu thay đổi" bên dưới để áp dụng lưu.'
            );
        } catch (err) {
            console.error('Lỗi tải ảnh:', err);
            toast.error(
                language === 'en' ? 'Upload Failed' : 'Tải ảnh thất bại',
                err.response?.data?.message || (language === 'en' ? 'Could not upload image.' : 'Không thể tải ảnh lên máy chủ.')
            );
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 2. Lưu cập nhật họ tên & thông tin cá nhân
    const handleSaveInfo = async (e) => {
        e.preventDefault();
        const trimmedName = nameForm.fullName.trim();
        if (!trimmedName) {
            toast.warning(
                language === 'en' ? 'Validation Error' : 'Chưa nhập họ tên',
                language === 'en' ? 'Full name cannot be empty.' : 'Họ và tên không được để trống.'
            );
            return;
        }

        setSavingInfo(true);
        try {
            const finalAvatar = nameForm.avatarUrl || profile.avatarUrl || '';
            const res = await axiosClient.put('/Admin/profile', {
                fullName: trimmedName,
                phoneNumber: nameForm.phoneNumber,
                avatarUrl: finalAvatar
            });

            setProfile(res.data.profile || { ...profile, fullName: trimmedName, phoneNumber: nameForm.phoneNumber, avatarUrl: finalAvatar });
            localStorage.setItem('user_name', trimmedName);
            if (finalAvatar) localStorage.setItem('user_avatar', finalAvatar);

            // Dispatch event để Header nhận ngay tên & avatar mới
            window.dispatchEvent(new Event('admin_profile_updated'));

            toast.success(
                language === 'en' ? 'Profile Updated' : 'Cập nhật thành công',
                language === 'en' ? 'Your personal info has been saved.' : 'Thông tin hồ sơ quản trị đã được lưu an toàn.'
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Failed' : 'Lỗi cập nhật',
                err.response?.data?.message || (language === 'en' ? 'Could not update profile.' : 'Không thể lưu thay đổi.')
            );
        } finally {
            setSavingInfo(false);
        }
    };

    // 3. Gửi OTP xác thực đổi Email
    const handleSendEmailOtp = async () => {
        const target = emailForm.newEmail.trim();
        if (!target || !target.includes('@')) {
            toast.warning(
                language === 'en' ? 'Invalid Email' : 'Email không hợp lệ',
                language === 'en' ? 'Please enter a valid new email address.' : 'Vui lòng nhập địa chỉ email mới hợp lệ.'
            );
            return;
        }

        setSendingEmailOtp(true);
        setDevEmailOtp('');
        try {
            const res = await axiosClient.post('/Admin/profile/send-otp', {
                targetEmail: target,
                actionType: 'ChangeEmail'
            });

            setEmailOtpSentTo(target);
            setOtpCooldown(60);

            if (res.data.devOtp) {
                setDevEmailOtp(res.data.devOtp);
            }

            toast.success(
                language === 'en' ? 'OTP Sent' : 'Đã gửi mã xác thực',
                res.data.message || (language === 'en' ? `OTP sent to ${target}` : `Mã OTP đã gửi về ${target}`)
            );
        } catch (err) {
            console.error('Lỗi gửi OTP:', err);
            toast.error(
                language === 'en' ? 'Send Failed' : 'Không thể gửi email',
                err.response?.data?.message || (language === 'en' ? 'SMTP error sending email.' : 'Lỗi kết nối máy chủ gửi email.')
            );
        } finally {
            setSendingEmailOtp(false);
        }
    };

    // 4. Xác nhận thay đổi Email
    const handleConfirmChangeEmail = async (e) => {
        e.preventDefault();
        if (!emailForm.newEmail.trim() || !emailForm.password || !emailForm.otpCode.trim()) {
            toast.warning(
                language === 'en' ? 'Incomplete form' : 'Thiếu thông tin',
                language === 'en' ? 'Please provide new email, current password and OTP.' : 'Vui lòng nhập đầy đủ email mới, mật khẩu xác nhận và mã OTP.'
            );
            return;
        }

        setSavingEmail(true);
        try {
            const res = await axiosClient.put('/Admin/profile/email', {
                newEmail: emailForm.newEmail.trim(),
                password: emailForm.password,
                otpCode: emailForm.otpCode.trim()
            });

            setProfile((prev) => ({ ...prev, email: res.data.newEmail }));
            localStorage.setItem('user_email', res.data.newEmail);

            // Reset form
            setEmailForm({ newEmail: '', password: '', otpCode: '' });
            setEmailOtpSentTo('');
            setDevEmailOtp('');

            window.dispatchEvent(new Event('admin_profile_updated'));

            toast.success(
                language === 'en' ? 'Email Changed' : 'Đổi Email thành công',
                language === 'en' ? `Admin email updated to ${res.data.newEmail}` : `Đã chuyển email quản trị thành ${res.data.newEmail}`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Update Failed' : 'Đổi Email thất bại',
                err.response?.data?.message || (language === 'en' ? 'Could not change email.' : 'Mã OTP hoặc mật khẩu không chính xác.')
            );
        } finally {
            setSavingEmail(false);
        }
    };

    // 5. Gửi OTP bảo mật đổi Mật khẩu (tùy chọn bảo vệ tăng cường)
    const handleSendPasswordOtp = async () => {
        if (!profile.email) return;

        setSendingPwdOtp(true);
        try {
            const res = await axiosClient.post('/Admin/profile/send-otp', {
                targetEmail: profile.email,
                actionType: 'ChangePassword'
            });
            setPwdOtpCooldown(60);
            toast.success(
                language === 'en' ? 'OTP Sent' : 'Đã gửi mã xác thực',
                language === 'en' ? `Security OTP sent to ${profile.email}` : `Mã bảo mật đã được gửi về ${profile.email}`
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Send Failed' : 'Không thể gửi email',
                err.response?.data?.message || (language === 'en' ? 'Error sending OTP.' : 'Lỗi kết nối máy chủ gửi email.')
            );
        } finally {
            setSendingPwdOtp(false);
        }
    };

    // 6. Cập nhật Mật khẩu mới
    const handleSavePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword, otpCode } = passwordForm;

        if (!currentPassword) {
            toast.warning(
                language === 'en' ? 'Current Password Required' : 'Thiếu mật khẩu hiện tại',
                language === 'en' ? 'Please enter your current password.' : 'Vui lòng nhập mật khẩu hiện tại.'
            );
            return;
        }

        if (newPassword.length < 6) {
            toast.warning(
                language === 'en' ? 'Password Too Short' : 'Mật khẩu quá ngắn',
                language === 'en' ? 'New password must have at least 6 characters.' : 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.warning(
                language === 'en' ? 'Password Mismatch' : 'Mật khẩu không khớp',
                language === 'en' ? 'Confirmation does not match new password.' : 'Mật khẩu xác nhận không khớp với mật khẩu mới.'
            );
            return;
        }

        setSavingPassword(true);
        try {
            const res = await axiosClient.put('/Admin/profile/password', {
                currentPassword,
                newPassword,
                confirmPassword,
                otpCode: otpCode.trim() || null
            });

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                otpCode: ''
            });

            toast.success(
                language === 'en' ? 'Password Changed' : 'Đổi mật khẩu thành công',
                res.data.message || (language === 'en' ? 'Password updated.' : 'Mật khẩu mới đã được cập nhật an toàn.')
            );
        } catch (err) {
            toast.error(
                language === 'en' ? 'Change Failed' : 'Đổi mật khẩu thất bại',
                err.response?.data?.message || (language === 'en' ? 'Current password incorrect.' : 'Mật khẩu hiện tại không đúng.')
            );
        } finally {
            setSavingPassword(false);
        }
    };

    // 7. Kiểm tra kết nối SMTP Gmail thực tế
    const handleTestSmtp = async () => {
        const target = testEmailTarget.trim();
        if (!target || !target.includes('@')) {
            toast.warning(
                language === 'en' ? 'Invalid Email' : 'Email không hợp lệ',
                language === 'en' ? 'Please enter a valid email address to test.' : 'Vui lòng nhập địa chỉ email hợp lệ để nhận thử nghiệm.'
            );
            return;
        }

        setTestingSmtp(true);
        setSmtpResult(null);
        try {
            const res = await axiosClient.post('/Admin/profile/send-otp', {
                targetEmail: target,
                actionType: 'ProfileSecurity'
            });

            setSmtpResult({
                success: true,
                message: res.data.message,
                detail: `Kết nối SMTP Gmail thành công qua cổng 587 (TLS). Mã thử nghiệm đã gửi tới ${target}.`
            });

            toast.success(
                language === 'en' ? 'SMTP Test Success' : 'Kiểm tra SMTP thành công',
                language === 'en' ? `Email successfully delivered to ${target}` : `Đã gửi email thử nghiệm thành công tới ${target}`
            );
        } catch (err) {
            const errDetail = err.response?.data?.error || err.response?.data?.message || err.message;
            setSmtpResult({
                success: false,
                message: 'Máy chủ Gmail phản hồi lỗi xác thực',
                detail: errDetail
            });

            toast.error(
                language === 'en' ? 'SMTP Test Error' : 'Lỗi xác thực Gmail SMTP',
                err.response?.data?.message || err.message
            );
        } finally {
            setTestingSmtp(false);
        }
    };

    // Tạo avatar fallback chữ cái
    const getInitials = (name) => {
        if (!name) return 'AD';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* TIÊU ĐỀ TRANG */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                        <span>{t('title_profile')}</span>
                        <span className="text-xs bg-blue-100 text-[#1E40AF] px-2 py-0.5 rounded-full font-semibold">
                            Admin
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                        {t('sub_profile')}
                    </p>
                </div>
            </div>

            {/* HERO PROFILE CARD */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar Preview & Upload Trigger */}
                <div className="relative group shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-100 flex items-center justify-center">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `http://localhost:5249${profile.avatarUrl}`}
                                alt="Admin Avatar"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                    setProfile((p) => ({ ...p, avatarUrl: '' }));
                                }}
                            />
                        ) : (
                            <span className="font-extrabold text-2xl sm:text-3xl text-[#1E40AF]">
                                {getInitials(profile.fullName)}
                            </span>
                        )}
                    </div>

                    {/* Nút bấm tải ảnh lên đè lên Avatar */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        title={t('btn_change_avatar')}
                        className="absolute inset-0 bg-slate-900/60 rounded-full flex flex-col items-center justify-center text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        {uploadingAvatar ? (
                            <RefreshIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{t('btn_change_avatar')}</span>
                            </>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                    />
                </div>

                {/* Thông tin vắn tắt */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                                {profile.fullName || 'Super Administrator'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {profile.email || 'admin@jobportal.com'}
                            </p>
                        </div>
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold self-center sm:self-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{t('super_admin')}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs text-slate-500">
                        <div>
                            <span className="text-slate-400">ID Quản trị:</span>{' '}
                            <strong className="text-slate-700 font-mono">#{profile.id || 1}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400">Số điện thoại:</span>{' '}
                            <strong className="text-slate-700">{profile.phoneNumber || (language === 'en' ? 'Not set' : 'Chưa cập nhật')}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400">SMTP Server:</span>{' '}
                            <span className="inline-flex items-center text-blue-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                                smtp.gmail.com:587
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB CONTROLS */}
            <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-2xs flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
                        activeTab === 'info'
                            ? 'border-[#1E40AF] text-[#1E40AF]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{t('profile_tab_info')}</span>
                </button>

                <button
                    onClick={() => setActiveTab('email')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
                        activeTab === 'email'
                            ? 'border-[#1E40AF] text-[#1E40AF]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{t('profile_tab_email')}</span>
                </button>

                <button
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
                        activeTab === 'password'
                            ? 'border-[#1E40AF] text-[#1E40AF]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <LockIcon className="w-4 h-4" />
                    <span>{t('profile_tab_password')}</span>
                </button>

                <button
                    onClick={() => setActiveTab('smtp')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
                        activeTab === 'smtp'
                            ? 'border-[#1E40AF] text-[#1E40AF]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{t('profile_tab_smtp')}</span>
                </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-5 sm:p-7 shadow-xs">
                {/* 1. TAB THÔNG TIN CÁ NHÂN & AVATAR */}
                {activeTab === 'info' && (
                    <form onSubmit={handleSaveInfo} className="space-y-5 max-w-xl">
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 mb-1">{t('profile_tab_info')}</h3>
                            <p className="text-xs text-slate-500">
                                {language === 'en'
                                    ? 'Update your public admin display name, contact phone, and avatar image.'
                                    : 'Thay đổi tên hiển thị quản trị viên, số điện thoại liên hệ và ảnh đại diện.'}
                            </p>
                        </div>

                        {/* Tải ảnh đại diện */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                {t('profile_tab_avatar')}
                            </label>
                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition shadow-xs flex items-center space-x-1.5"
                                >
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>{uploadingAvatar ? t('btn_adding') : t('btn_upload_avatar')}</span>
                                </button>
                                {nameForm.avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNameForm((prev) => ({ ...prev, avatarUrl: '' }));
                                            setProfile((prev) => ({ ...prev, avatarUrl: '' }));
                                            localStorage.removeItem('user_avatar');
                                            window.dispatchEvent(new Event('admin_profile_updated'));
                                        }}
                                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                                    >
                                        {language === 'en' ? 'Remove avatar' : 'Xóa ảnh đại diện'}
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5">{t('upload_avatar_hint')}</p>
                        </div>

                        {/* Họ và tên */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_full_name')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={nameForm.fullName}
                                onChange={(e) => setNameForm({ ...nameForm, fullName: e.target.value })}
                                placeholder="VD: Super Administrator"
                                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        {/* Số điện thoại */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_phone')}
                            </label>
                            <input
                                type="text"
                                value={nameForm.phoneNumber}
                                onChange={(e) => setNameForm({ ...nameForm, phoneNumber: e.target.value })}
                                placeholder="VD: 0901234567"
                                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        {/* Email hiện tại (chỉ đọc) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_current_email')}
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="email"
                                    disabled
                                    value={profile.email}
                                    className="w-full bg-slate-100 border border-slate-200 text-xs px-3.5 py-2 rounded text-slate-500 cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('email')}
                                    className="px-3 py-2 text-xs font-medium text-[#1E40AF] hover:underline whitespace-nowrap cursor-pointer"
                                >
                                    {language === 'en' ? 'Change' : 'Thay đổi'} &rarr;
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={savingInfo}
                                className="px-5 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                            >
                                {savingInfo ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                <span>{savingInfo ? (language === 'en' ? 'Saving...' : 'Đang lưu...') : t('btn_save_profile')}</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* 2. TAB THAY ĐỔI EMAIL & XÁC THỰC OTP QUA GMAIL SMTP */}
                {activeTab === 'email' && (
                    <form onSubmit={handleConfirmChangeEmail} className="space-y-5 max-w-xl">
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 mb-1">{t('profile_tab_email')}</h3>
                            <p className="text-xs text-slate-500">
                                {language === 'en'
                                    ? 'For security, changing email requires entering current password and verifying a 6-digit OTP code sent via Gmail SMTP.'
                                    : 'Để bảo vệ an toàn, đổi email yêu cầu nhập mật khẩu quản trị và xác thực mã OTP 6 chữ số được gửi tự động qua Gmail SMTP.'}
                            </p>
                        </div>

                        {/* Email hiện tại */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_current_email')}
                            </label>
                            <input
                                type="email"
                                disabled
                                value={profile.email}
                                className="w-full bg-slate-100 border border-slate-200 text-xs px-3.5 py-2 rounded text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        {/* Email mới */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_new_email')} *
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                    type="email"
                                    required
                                    value={emailForm.newEmail}
                                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                                    placeholder="VD: dkiet4532@gmail.com"
                                    className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendEmailOtp}
                                    disabled={sendingEmailOtp || otpCooldown > 0 || !emailForm.newEmail.includes('@')}
                                    className={`px-4 py-2 text-xs font-semibold rounded whitespace-nowrap transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                                        otpCooldown > 0 || !emailForm.newEmail.includes('@')
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                            : 'bg-[#1E40AF] hover:bg-[#1E3A8A] text-white shadow-xs'
                                    }`}
                                >
                                    {sendingEmailOtp ? (
                                        <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    )}
                                    <span>
                                        {otpCooldown > 0
                                            ? `${t('btn_resend_otp')} (${otpCooldown}s)`
                                            : t('btn_send_otp')}
                                    </span>
                                </button>
                            </div>
                            {emailOtpSentTo && (
                                <p className="text-[11px] text-emerald-600 mt-1.5 font-medium flex items-center space-x-1">
                                    <CheckIcon className="w-3.5 h-3.5 inline shrink-0" />
                                    <span>
                                        {t('otp_sent_to')} <strong>{emailOtpSentTo}</strong>. {t('otp_expire_hint')}.
                                    </span>
                                </p>
                            )}
                            {devEmailOtp && (
                                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                                    🔔 <strong>Môi trường thử nghiệm:</strong> Mã OTP của bạn là: <strong className="font-mono text-sm font-bold text-blue-700">{devEmailOtp}</strong> (áp dụng khi đang kiểm tra tài khoản Gmail).
                                </div>
                            )}
                        </div>

                        {/* Mật khẩu xác nhận */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_current_password')} *
                            </label>
                            <input
                                type="password"
                                required
                                value={emailForm.password}
                                onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                                placeholder="Nhập mật khẩu quản trị để xác thực quyền"
                                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        {/* Mã OTP 6 chữ số */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_otp_code')} *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={emailForm.otpCode}
                                onChange={(e) => setEmailForm({ ...emailForm, otpCode: e.target.value.replace(/\D/g, '') })}
                                placeholder="6 số từ email (VD: 829143)"
                                className="w-48 bg-slate-50 border border-slate-200 text-base font-mono tracking-widest font-bold text-center px-3 py-1.5 rounded focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={savingEmail || !emailForm.otpCode || !emailForm.password}
                                className={`px-5 py-2.5 text-xs font-semibold rounded shadow-xs transition cursor-pointer flex items-center space-x-1.5 ${
                                    !emailForm.otpCode || !emailForm.password
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-[#1E40AF] hover:bg-[#1E3A8A] text-white'
                                }`}
                            >
                                {savingEmail ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                <span>{savingEmail ? (language === 'en' ? 'Verifying...' : 'Đang xác thực...') : t('btn_update_email')}</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* 3. TAB THAY ĐỔI MẬT KHẨU */}
                {activeTab === 'password' && (
                    <form onSubmit={handleSavePassword} className="space-y-5 max-w-xl">
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 mb-1">{t('profile_tab_password')}</h3>
                            <p className="text-xs text-slate-500">
                                {language === 'en'
                                    ? 'Change your administrator account password. A security alert will be automatically sent to your email.'
                                    : 'Thay đổi mật khẩu đăng nhập cổng quản trị. Thông báo bảo mật sẽ được gửi tự động về email quản trị viên.'}
                            </p>
                        </div>

                        {/* Mật khẩu hiện tại */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_current_password')} *
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPwd ? 'text' : 'password'}
                                    required
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 pr-9 rounded focus:outline-none focus:border-[#2563EB]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Mật khẩu mới */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_new_password')} *
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPwd ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 pr-9 rounded focus:outline-none focus:border-[#2563EB]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPwd(!showNewPwd)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Xác nhận mật khẩu mới */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {t('field_confirm_password')} *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPwd ? 'text' : 'password'}
                                    required
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 pr-9 rounded focus:outline-none focus:border-[#2563EB]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                            </div>
                            {passwordForm.newPassword && passwordForm.confirmPassword && (
                                <p className={`text-[11px] mt-1 font-medium ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {passwordForm.newPassword === passwordForm.confirmPassword
                                        ? '✓ Mật khẩu xác nhận trùng khớp'
                                        : '✕ Mật khẩu xác nhận không khớp'}
                                </p>
                            )}
                        </div>

                        {/* Tùy chọn gửi OTP bảo mật qua Email */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">Mã OTP bảo mật Email (Tùy chọn)</span>
                                <button
                                    type="button"
                                    onClick={handleSendPasswordOtp}
                                    disabled={sendingPwdOtp || pwdOtpCooldown > 0}
                                    className="text-xs text-[#1E40AF] hover:underline font-semibold cursor-pointer disabled:text-slate-400"
                                >
                                    {pwdOtpCooldown > 0 ? `Gửi lại sau ${pwdOtpCooldown}s` : 'Nhận mã OTP qua Email'}
                                </button>
                            </div>
                            <input
                                type="text"
                                maxLength={6}
                                value={passwordForm.otpCode}
                                onChange={(e) => setPasswordForm({ ...passwordForm, otpCode: e.target.value.replace(/\D/g, '') })}
                                placeholder="Nhập mã OTP nếu đã bấm nhận mã"
                                className="w-full bg-white border border-slate-200 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                                className="px-5 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded shadow-xs transition cursor-pointer flex items-center space-x-1.5 disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                {savingPassword ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <LockIcon className="w-4 h-4" />}
                                <span>{savingPassword ? (language === 'en' ? 'Updating...' : 'Đang cập nhật...') : t('btn_update_password')}</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* 4. TAB KIỂM TRA SMTP GMAIL & CHẨN ĐOÁN */}
                {activeTab === 'smtp' && (
                    <div className="space-y-5 max-w-xl">
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 mb-1">{t('profile_tab_smtp')}</h3>
                            <p className="text-xs text-slate-500">
                                {language === 'en'
                                    ? 'Verify MailKit / MimeKit integration with Gmail SMTP using Google App Password.'
                                    : 'Kiểm tra và xác thực kết nối MailKit / MimeKit với dịch vụ Gmail SMTP sử dụng Mật khẩu ứng dụng.'}
                            </p>
                        </div>

                        {/* Thẻ cấu hình SMTP hiện hành */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs">
                            <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">
                                Cấu hình SMTP hệ thống (appsettings.json)
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Dịch vụ gửi:</span>
                                <span className="font-semibold text-slate-800">Gmail SMTP (smtp.gmail.com)</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Cổng kết nối (Port):</span>
                                <span className="font-mono text-slate-800">587 (STARTTLS)</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Tài khoản gửi (Sender):</span>
                                <span className="font-medium text-slate-800">dkiet4532@gmail.com</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Thư viện xử lý:</span>
                                <span className="font-medium text-blue-700">MailKit v4.18.1 / MimeKit v4.18.1 (.NET 10)</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500">Mật khẩu ứng dụng (App Password):</span>
                                <span className="font-mono text-slate-700">•••• •••• •••• •••</span>
                            </div>
                        </div>

                        {/* Form gửi email thử nghiệm */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Địa chỉ Email nhận thư kiểm tra
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                    type="email"
                                    value={testEmailTarget}
                                    onChange={(e) => setTestEmailTarget(e.target.value)}
                                    placeholder="Nhập email để nhận thư test"
                                    className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded focus:outline-none focus:border-[#2563EB]"
                                />
                                <button
                                    type="button"
                                    onClick={handleTestSmtp}
                                    disabled={testingSmtp || !testEmailTarget.includes('@')}
                                    className="px-4 py-2 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded shadow-xs transition cursor-pointer flex items-center justify-center space-x-1.5 disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                    {testingSmtp ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                    <span>{testingSmtp ? 'Đang gửi...' : t('test_email_btn')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Kết quả kiểm tra */}
                        {smtpResult && (
                            <div className={`p-4 rounded-lg border text-xs space-y-2 ${
                                smtpResult.success
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}>
                                <div className="font-bold flex items-center space-x-1.5">
                                    {smtpResult.success ? (
                                        <CheckIcon className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <AlertTriangleIcon className="w-4 h-4 text-rose-600" />
                                    )}
                                    <span>{smtpResult.message}</span>
                                </div>
                                <div className="text-[11px] leading-relaxed break-words font-mono bg-white/70 p-2.5 rounded border border-current/20">
                                    {smtpResult.detail}
                                </div>
                                {!smtpResult.success && (
                                    <div className="text-[11px] text-slate-600 mt-2 p-2 bg-white rounded border border-slate-200 space-y-1">
                                        <div className="font-bold text-amber-700">💡 Hướng dẫn xử lý:</div>
                                        <div>Mật khẩu ứng dụng Google chuẩn gồm <strong>16 ký tự</strong> (4 nhóm x 4 chữ cái, ví dụ: <code>abcd efgh ijkl mnop</code>).</div>
                                        <div>Chuỗi bạn cung cấp <code>iijr uwtv cgvx cxf</code> chỉ có <strong>15 ký tự</strong> (nhóm cuối <code>cxf</code> chỉ có 3 chữ cái). Vui lòng vào <strong>Google Account &rarr; Bảo mật &rarr; Mật khẩu ứng dụng</strong> để lấy lại chuỗi đủ 16 ký tự.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
