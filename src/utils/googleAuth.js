import axiosClient from '../api/axiosClient';

export const GOOGLE_CLIENT_ID = '872193882236-ld23d7tl1ue7tiphj1it0obn6bivm1g3.apps.googleusercontent.com';

/**
 * Trigger Real Google OAuth 2.0 Account Chooser Popup
 * Opens accounts.google.com with device's actual Google accounts
 */
export async function triggerRealGoogleLogin({ role = 'Candidate', clientId, onSuccess, onError }) {
  const activeClientId = 
    clientId || 
    import.meta.env.VITE_GOOGLE_CLIENT_ID || 
    localStorage.getItem('jobportal_google_client_id') ||
    GOOGLE_CLIENT_ID;

  if (!activeClientId) {
    if (onError) onError('MISSING_CLIENT_ID');
    return;
  }

  // Ensure Google Identity Services SDK is loaded
  if (!window.google?.accounts?.oauth2) {
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', () => reject(new Error('Không thể tải thư viện Google SDK')));
        // If already loaded
        if (window.google?.accounts?.oauth2) resolve();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không thể tải thư viện Google SDK'));
        document.head.appendChild(script);
      }
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google OAuth Error:', tokenResponse);
            if (onError) onError(tokenResponse.error_description || tokenResponse.error);
            reject(new Error(tokenResponse.error));
            return;
          }

          try {
            // Fetch real user profile from Google's UserInfo API
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!userInfoRes.ok) {
              throw new Error('Không thể lấy thông tin tài khoản từ máy chủ Google.');
            }

            const googleProfile = await userInfoRes.json();

            // Send real Google account credentials to JobPortal Backend
            const backendRes = await axiosClient.post('/Auth/google-login', {
              email: googleProfile.email,
              fullName: googleProfile.name,
              avatarUrl: googleProfile.picture || '',
              role: role === 'employer' ? 'Employer' : 'Candidate',
            });

            const data = backendRes.data;

            // Save login session
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_email', data.email);
            localStorage.setItem('user_name', data.fullName);
            localStorage.setItem('user_role', data.role);
            if (data.avatarUrl) {
              localStorage.setItem('user_avatar', data.avatarUrl);
              window.dispatchEvent(
                new CustomEvent('avatar_updated', {
                  detail: { avatarUrl: data.avatarUrl, userName: data.fullName },
                })
              );
            }

            window.dispatchEvent(new Event('auth_changed'));

            if (onSuccess) onSuccess(data);
            resolve(data);
          } catch (err) {
            console.error('Lỗi xác thực Backend với Google:', err);
            const msg = err.response?.data?.message || err.message || 'Đăng nhập Google thất bại.';
            if (onError) onError(msg);
            reject(err);
          }
        },
      });

      // Request token with select_account prompt to show all real Google accounts on device
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error('Khởi tạo Google Token Client lỗi:', err);
      if (onError) onError(err.message || 'Lỗi khởi động Google OAuth.');
      reject(err);
    }
  });
}
