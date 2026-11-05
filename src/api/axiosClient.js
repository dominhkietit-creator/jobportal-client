import axios from 'axios';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'https://towers-contract-toolbox-distinguished.trycloudflare.com';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${API_ORIGIN}/api`;

export const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_ORIGIN}${cleanPath}`;
};

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
});

// Tự động gắn Bearer Token nếu đã đăng nhập & tự động cấu hình Content-Type
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Đa doanh nghiệp: Gắn mã công ty đang làm việc nếu đã chọn
    const activeCompanyId = localStorage.getItem('active_company_id');
    if (activeCompanyId) {
        config.headers['X-Company-Id'] = activeCompanyId;
    }

    // Nếu gửi FormData (upload file/CV/ảnh), xóa Content-Type để trình duyệt tự động sinh boundary
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});

export default axiosClient;
