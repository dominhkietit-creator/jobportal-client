import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/client/Navbar';
import Footer from './components/client/Footer';

// User Client Pages (JobPortal Design System)
import HomePage from './pages/HomePage';
import JobListingPage from './pages/JobListingPage';
import JobDetailPage from './pages/JobDetailPage';
import RegisterPage from './pages/RegisterPage';
import UserLoginPage from './pages/UserLoginPage';
import CandidateProfilePage from './pages/CandidateProfilePage';

// Admin Auth Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ForgotPasswordLostEmail from './pages/ForgotPasswordLostEmail';
import AdminLayout from './layouts/AdminLayout';

// Admin Management Pages
import AdminDashboard from './pages/AdminDashboard';
import JobManagement from './pages/JobManagement';
import CategoryManagement from './pages/CategoryManagement';
import CompanyManagement from './pages/CompanyManagement';
import CandidateManagement from './pages/CandidateManagement';
import EmployerManagement from './pages/EmployerManagement';
import ApplicationManagement from './pages/ApplicationManagement';
import ReportManagement from './pages/ReportManagement';
import AdminProfile from './pages/AdminProfile';
import RecoveryManagement from './pages/RecoveryManagement';

// Employer Portal Pages
import EmployerLayout from './layouts/EmployerLayout';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerCompanyPage from './pages/EmployerCompanyPage';
import EmployerJobManagement from './pages/EmployerJobManagement';
import EmployerApplicationsPage from './pages/EmployerApplicationsPage';
import EmployerProfilePage from './pages/EmployerProfilePage';
import EmployerBillingPage from './pages/EmployerBillingPage';
import PaymentGatewayPage from './pages/PaymentGatewayPage';

// Client Layout with Header & Footer
function ClientLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

// Protected Route for Admin Portal
function ProtectedAdminRoute({ children }) {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    if (role !== 'Admin') {
        return <Navigate to="/user-login" replace />;
    }
    return children;
}

// Protected Route for Employer Portal
function ProtectedEmployerRoute({ children }) {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    if (!token) {
        return <Navigate to="/user-login" replace />;
    }
    if (role !== 'Employer' && role !== 'Admin') {
        return <Navigate to="/user-login" replace />;
    }
    return children;
}

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <ToastProvider>
                    <BrowserRouter>
                    <Routes>
                        {/* Tuyến đường Đăng nhập & Đăng ký User (JobPortal) */}
                        <Route path="/user-login" element={<UserLoginPage />} />
                        <Route path="/dang-nhap" element={<UserLoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/dang-ky" element={<RegisterPage />} />

                        {/* Tuyến đường Đăng nhập & Khôi phục Admin */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/recovery" element={<ForgotPasswordLostEmail />} />

                        {/* Tuyến đường Cổng Thanh Toán Trực Tuyến Giả Lập (VNPAY / VietQR / MoMo) */}
                        <Route path="/payment/checkout" element={<PaymentGatewayPage />} />

                        {/* Tuyến đường Client (User Portal) */}
                        <Route element={<ClientLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/jobs" element={<JobListingPage />} />
                            <Route path="/jobs/:id" element={<JobDetailPage />} />
                            <Route path="/candidate/profile" element={<CandidateProfilePage />} />
                            <Route path="/profile" element={<CandidateProfilePage />} />
                            <Route path="/ho-so" element={<CandidateProfilePage />} />
                        </Route>

                        {/* Tuyến đường Dành Cho Nhà Tuyển Dụng (Employer Portal) */}
                        <Route
                            path="/employer"
                            element={
                                <ProtectedEmployerRoute>
                                    <EmployerLayout />
                                </ProtectedEmployerRoute>
                            }
                        >
                            {/* 1. Bảng điều khiển nhà tuyển dụng */}
                            <Route index element={<EmployerDashboard />} />

                            {/* 2. Hồ sơ công ty */}
                            <Route path="company" element={<EmployerCompanyPage />} />

                            {/* 3. Quản lý việc làm */}
                            <Route path="jobs" element={<EmployerJobManagement />} />

                            {/* 4, 5, 6. Xem hồ sơ ứng tuyển, Cập nhật trạng thái, Xem hồ sơ ứng viên */}
                            <Route path="applications" element={<EmployerApplicationsPage />} />
                            <Route path="candidates" element={<EmployerApplicationsPage />} />
                            <Route path="candidate-profile" element={<EmployerApplicationsPage />} />

                            {/* 7. Hồ sơ cá nhân của Nhà tuyển dụng */}
                            <Route path="profile" element={<EmployerProfilePage />} />

                            {/* 8. Ví dịch vụ & Thanh toán trực tuyến */}
                            <Route path="billing" element={<EmployerBillingPage />} />
                        </Route>

                        {/* Tuyến đường Admin Portal có Sidebar quản trị */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedAdminRoute>
                                    <AdminLayout />
                                </ProtectedAdminRoute>
                            }
                        >
                            {/* 1. Bảng điều khiển */}
                            <Route index element={<AdminDashboard />} />

                            {/* 2. Quản lý việc làm */}
                            <Route path="jobs" element={<JobManagement />} />

                            {/* 3. Quản lý danh mục việc làm */}
                            <Route path="categories" element={<CategoryManagement />} />

                            {/* 4. Quản lý công ty */}
                            <Route path="companies" element={<CompanyManagement />} />

                            {/* 5. Quản lý ứng viên */}
                            <Route path="candidates" element={<CandidateManagement />} />

                            {/* 6. Quản lý nhà tuyển dụng */}
                            <Route path="employers" element={<EmployerManagement />} />

                            {/* 7. Quản lý hồ sơ ứng tuyển */}
                            <Route path="applications" element={<ApplicationManagement />} />

                            {/* 8. Quản lý báo cáo/đánh giá */}
                            <Route path="reports" element={<ReportManagement />} />

                            {/* 9. Quản lý Hồ sơ & Bảo mật Admin */}
                            <Route path="profile" element={<AdminProfile />} />

                            {/* 10. Quản lý Yêu cầu Khôi phục Tài khoản */}
                            <Route path="recovery-requests" element={<RecoveryManagement />} />
                        </Route>

                        {/* Tuyến đường mặc định */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </BrowserRouter>
                </ToastProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
