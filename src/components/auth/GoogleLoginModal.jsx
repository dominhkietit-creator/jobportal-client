import { useState } from 'react';
import { triggerRealGoogleLogin } from '../../utils/googleAuth';
import { useToast } from '../../contexts/ToastContext';

export default function GoogleLoginModal({ isOpen, onClose, role = 'Candidate', onSuccess }) {
  const { showToast } = useToast();
  const [clientIdInput, setClientIdInput] = useState(
    localStorage.getItem('jobportal_google_client_id') || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnectRealGoogle = async (e) => {
    if (e) e.preventDefault();
    const idToUse = clientIdInput.trim();
    if (!idToUse) {
      setError('Vui lòng nhập Google OAuth Client ID của bạn.');
      return;
    }

    setLoading(true);
    setError('');

    // Save for subsequent one-click logins
    localStorage.setItem('jobportal_google_client_id', idToUse);

    try {
      await triggerRealGoogleLogin({
        role,
        clientId: idToUse,
        onSuccess: (data) => {
          showToast(`Đăng nhập Google thành công! Xin chào ${data.fullName}`, 'success');
          if (onSuccess) onSuccess(data);
          onClose();
        },
        onError: (err) => {
          setError(typeof err === 'string' ? err : 'Đăng nhập Google bị hủy hoặc thất bại.');
        }
      });
    } catch (err) {
      setError(err?.message || 'Không thể mở cửa sổ đăng nhập Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden text-slate-900 dark:text-slate-100 transition-all scale-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-700/80 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {/* Google Logo SVG */}
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.97 0 12s.45 3.86 1.24 5.43l4.04-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Đăng nhập tài khoản Google thật
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mở cửa sổ ủy quyền bảo mật trực tiếp từ Google (<span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">accounts.google.com</span>)
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleConnectRealGoogle} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Google OAuth 2.0 Client ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="VD: 123456789-xxxx.apps.googleusercontent.com"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Google yêu cầu Client ID để mở cửa sổ chọn tài khoản Google thật trên thiết bị của bạn.
            </p>
          </div>

          {/* Quick instructions box */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 text-slate-700 dark:text-slate-300 space-y-1.5">
            <div className="font-bold text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>Cách lấy Google Client ID miễn phí trong 1 phút:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                Truy cập{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </li>
              <li>Bấm <strong>Create Credentials</strong> &rarr; Chọn <strong>OAuth client ID</strong>.</li>
              <li>Loại ứng dụng: <strong>Web application</strong>.</li>
              <li>
                Thêm vào mục <em>Authorized JavaScript origins</em>: <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono border">http://localhost:5173</code>
              </li>
              <li>Copy mã Client ID dán vào ô bên trên và bấm nút xác nhận bên dưới.</li>
            </ol>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#00288E] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang mở cửa sổ Google...</span>
                </>
              ) : (
                <>
                  <span>Mở cửa sổ chọn tài khoản Google thật</span>
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 text-center text-[10px] text-slate-400">
          Chỉ cần cấu hình một lần duy nhất. Những lần đăng nhập sau sẽ tự động mở cửa sổ tài khoản Google ngay lập tức.
        </div>
      </div>
    </div>
  );
}
