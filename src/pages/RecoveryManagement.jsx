import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

export default function RecoveryManagement() {
    const { t, isEn } = useLanguage();
    const { showToast } = useToast();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    // Modals
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Form Duyệt / Từ chối
    const [actionLoading, setActionLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [updateEmailToNew, setUpdateEmailToNew] = useState(true);

    // Tải danh sách phiếu
    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'All') params.status = statusFilter;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const res = await axiosClient.get('/Admin/recovery-tickets', { params });
            setTickets(res.data);
            setCurrentPage(1);
        } catch (err) {
            showToast(isEn ? 'Failed to load recovery tickets.' : 'Không thể tải danh sách phiếu khôi phục.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchTickets();
    };

    // Mở modal duyệt
    const handleOpenApproveModal = (ticket) => {
        setSelectedTicket(ticket);
        const randomPass = 'TopJob@' + Math.floor(100000 + Math.random() * 900000);
        setTempPassword(randomPass);
        setAdminNote('Thông tin hồ sơ và yêu cầu đã được Ban Quản Trị đối soát và xác thực.');
        setUpdateEmailToNew(true);
        setShowApproveModal(true);
    };

    // Xác nhận duyệt
    const handleConfirmApprove = async () => {
        if (!selectedTicket) return;
        setActionLoading(true);
        try {
            const res = await axiosClient.put(`/Admin/recovery-tickets/${selectedTicket.id}/approve`, {
                temporaryPassword: tempPassword,
                adminNote,
                updateAccountEmailToNewEmail: updateEmailToNew
            });
            showToast(res.data.message || (isEn ? 'Ticket approved successfully!' : 'Đã duyệt yêu cầu thành công!'), 'success');
            setShowApproveModal(false);
            fetchTickets();
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Failed to approve ticket.' : 'Phê duyệt thất bại.');
            showToast(msg, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Mở modal từ chối
    const handleOpenRejectModal = (ticket) => {
        setSelectedTicket(ticket);
        setAdminNote('');
        setShowRejectModal(true);
    };

    // Xác nhận từ chối
    const handleConfirmReject = async () => {
        if (!selectedTicket) return;
        if (!adminNote.trim()) {
            showToast(isEn ? 'Please provide a rejection reason.' : 'Vui lòng nhập lý do từ chối.', 'warning');
            return;
        }
        setActionLoading(true);
        try {
            const res = await axiosClient.put(`/Admin/recovery-tickets/${selectedTicket.id}/reject`, {
                adminNote
            });
            showToast(res.data.message || (isEn ? 'Ticket rejected.' : 'Đã từ chối yêu cầu.'), 'info');
            setShowRejectModal(false);
            fetchTickets();
        } catch (err) {
            const msg = err.response?.data?.message || (isEn ? 'Failed to reject ticket.' : 'Từ chối thất bại.');
            showToast(msg, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // KPI thống kê
    const totalCount = tickets.length;
    const pendingCount = tickets.filter(t => t.status === 'Pending').length;
    const approvedCount = tickets.filter(t => t.status === 'Approved').length;
    const rejectedCount = tickets.filter(t => t.status === 'Rejected').length;

    // Phân trang
    const totalPages = Math.ceil(tickets.length / pageSize) || 1;
    const paginatedTickets = tickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6">
            {/* Tiêu đề trang */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-lg">🛡️</span>
                        {isEn ? 'Account Recovery Requests' : 'Quản Lý Yêu Cầu Khôi Phục Tài Khoản'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {isEn
                            ? 'Review and approve access restoration for users who forgot passwords and lost email access'
                            : 'Xét duyệt và cấp lại thông tin đăng nhập cho người dùng bị mất quyền truy cập vào email đăng ký'}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {isEn ? 'Total Requests' : 'Tổng số yêu cầu'}
                    </span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                        ⏳ {isEn ? 'Pending Review' : 'Chờ xử lý'}
                    </span>
                    <span className="text-2xl font-bold text-amber-900 mt-1 block">{pendingCount}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                        ✓ {isEn ? 'Approved' : 'Đã phê duyệt'}
                    </span>
                    <span className="text-2xl font-bold text-emerald-900 mt-1 block">{approvedCount}</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                        ✕ {isEn ? 'Rejected' : 'Đã từ chối'}
                    </span>
                    <span className="text-2xl font-bold text-rose-900 mt-1 block">{rejectedCount}</span>
                </div>
            </div>

            {/* Bộ lọc & Tìm kiếm */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                {/* Status tabs */}
                <div className="flex items-center space-x-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {[
                        { id: 'All', label: isEn ? 'All' : 'Tất cả' },
                        { id: 'Pending', label: isEn ? 'Pending' : 'Chờ duyệt' },
                        { id: 'Approved', label: isEn ? 'Approved' : 'Đã duyệt' },
                        { id: 'Rejected', label: isEn ? 'Rejected' : 'Đã từ chối' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                                statusFilter === tab.id
                                    ? 'bg-blue-600 text-white font-semibold'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form tìm kiếm */}
                <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isEn ? 'Search email, name, phone...' : 'Tìm email, họ tên, số điện thoại...'}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs"
                    >
                        {isEn ? 'Search' : 'Tìm'}
                    </button>
                </form>
            </div>

            {/* Bảng danh sách phiếu */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">{isEn ? 'Account (Lost Email)' : 'Tài khoản cần khôi phục'}</th>
                                <th className="px-4 py-3">{isEn ? 'Requester / Identity' : 'Người yêu cầu / Danh tính'}</th>
                                <th className="px-4 py-3">{isEn ? 'New Contact Email' : 'Email mới nhận thông tin'}</th>
                                <th className="px-4 py-3">{isEn ? 'Loss Reason' : 'Lý do mất quyền truy cập'}</th>
                                <th className="px-4 py-3">{isEn ? 'Created At' : 'Thời gian gửi'}</th>
                                <th className="px-4 py-3">{isEn ? 'Status' : 'Trạng thái'}</th>
                                <th className="px-4 py-3 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-slate-400">
                                        <div className="inline-block animate-spin mr-2">🔄</div>
                                        {isEn ? 'Loading recovery requests...' : 'Đang tải danh sách yêu cầu khôi phục...'}
                                    </td>
                                </tr>
                            ) : paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-slate-400">
                                        {isEn ? 'No recovery requests found.' : 'Không có yêu cầu khôi phục nào.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                            #{ticket.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{ticket.accountEmail}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {ticket.accountExists ? (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                        ✓ {ticket.matchedRole || 'Tài khoản tồn tại'}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                                        ✕ Không tồn tại
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{ticket.fullName}</div>
                                            <div className="text-[11px] text-slate-500 font-mono">{ticket.phoneNumber || '—'}</div>
                                            {ticket.identityCardNumber && (
                                                <div className="text-[10px] text-indigo-600 font-mono font-semibold">
                                                    CCCD: {ticket.identityCardNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-blue-700 font-medium">{ticket.newContactEmail}</span>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs truncate" title={ticket.reason}>
                                            <span className="text-slate-600">{ticket.reason}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                            {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    ticket.status === 'Approved'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : ticket.status === 'Rejected'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {ticket.status === 'Approved'
                                                    ? (isEn ? 'Approved' : 'Đã duyệt')
                                                    : ticket.status === 'Rejected'
                                                    ? (isEn ? 'Rejected' : 'Đã từ chối')
                                                    : (isEn ? 'Pending' : 'Chờ duyệt')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setShowDetailModal(true);
                                                }}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                                            >
                                                {isEn ? 'Details' : 'Chi tiết'}
                                            </button>

                                            {ticket.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenApproveModal(ticket)}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
                                                    >
                                                        ✓ {isEn ? 'Approve' : 'Duyệt'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenRejectModal(ticket)}
                                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
                                                    >
                                                        ✕ {isEn ? 'Reject' : 'Từ chối'}
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            {isEn ? 'Showing page' : 'Trang'} <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
                        </span>
                        <div className="flex items-center space-x-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                            >
                                ←
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                        currentPage === p
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                            >
                                →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT */}
            {showDetailModal && selectedTicket && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900">
                                {isEn ? 'Ticket Details' : 'Chi Tiết Phiếu Khôi Phục'} #{selectedTicket.id}
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-slate-400 block text-[11px]">{isEn ? 'Account Email:' : 'Email tài khoản:'}</span>
                                    <span className="font-bold text-slate-900">{selectedTicket.accountEmail}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[11px]">{isEn ? 'Status in DB:' : 'Trạng thái CSDL:'}</span>
                                    <span className={`font-bold ${selectedTicket.accountExists ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {selectedTicket.accountExists ? `Tồn tại (${selectedTicket.matchedRole})` : 'Không tìm thấy'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[11px]">{isEn ? 'Full Name:' : 'Họ và tên:'}</span>
                                    <span className="font-semibold text-slate-800">{selectedTicket.fullName}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[11px]">{isEn ? 'Phone Number:' : 'Số điện thoại:'}</span>
                                    <span className="font-semibold text-slate-800">{selectedTicket.phoneNumber || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[11px]">{isEn ? 'New Contact Email:' : 'Email mới:'}</span>
                                    <span className="font-semibold text-blue-700">{selectedTicket.newContactEmail}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[11px]">{isEn ? 'Citizen Card (CCCD):' : 'Số CCCD/CMND:'}</span>
                                    <span className="font-semibold text-indigo-700">{selectedTicket.identityCardNumber || '—'}</span>
                                </div>
                            </div>

                            <div>
                                <span className="font-semibold text-slate-700 block mb-1">
                                    {isEn ? 'Reason & Loss Description:' : 'Lý do mất quyền truy cập email:'}
                                </span>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedTicket.reason}
                                </div>
                            </div>

                            {selectedTicket.adminNote && (
                                <div>
                                    <span className="font-semibold text-slate-700 block mb-1">
                                        {isEn ? 'Admin Feedback Note:' : 'Phản hồi từ Quản trị viên:'}
                                    </span>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                                        {selectedTicket.adminNote}
                                    </div>
                                </div>
                            )}

                            {selectedTicket.temporaryPasswordProvided && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                                    <div>
                                        <span className="block text-[11px]">{isEn ? 'Generated Temporary Password:' : 'Mật khẩu tạm thời đã cấp:'}</span>
                                        <code className="font-bold text-sm text-red-600">{selectedTicket.temporaryPasswordProvided}</code>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition cursor-pointer"
                            >
                                {isEn ? 'Close' : 'Đóng'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DUYỆT YÊU CẦU */}
            {showApproveModal && selectedTicket && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                                <span>✓</span> {isEn ? 'Approve Recovery Request' : 'Phê Duyệt Yêu Cầu Khôi Phục'} #{selectedTicket.id}
                            </h3>
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                            {isEn 
                                ? 'Approving this request will update the user account with a temporary password and notify their new email via Gmail SMTP.' 
                                : 'Hệ thống sẽ cập nhật mật khẩu đăng nhập của tài khoản và tự động gửi email thông báo kèm mật khẩu tạm thời tới hòm thư mới của người dùng.'}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    {isEn ? 'Temporary Password' : 'Mật khẩu tạm thời cấp cho người dùng'}
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        required
                                        value={tempPassword}
                                        onChange={(e) => setTempPassword(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-red-600 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setTempPassword('TopJob@' + Math.floor(100000 + Math.random() * 900000))}
                                        className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                                    >
                                        🎲 {isEn ? 'Random' : 'Tạo mới'}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={updateEmailToNew}
                                    onChange={(e) => setUpdateEmailToNew(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-semibold text-slate-800">
                                    {isEn ? 'Change sign-in email to new contact email' : 'Đồng thời chuyển Email đăng nhập sang Email mới'} ({selectedTicket.newContactEmail})
                                </span>
                            </label>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    {isEn ? 'Admin Note (Included in user email)' : 'Ghi chú phản hồi (gửi kèm trong email)'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder={isEn ? 'e.g. Verified by citizen card...' : 'ví dụ: Đã đối soát CCCD và xác minh hợp lệ...'}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowApproveModal(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                {isEn ? 'Cancel' : 'Hủy'}
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmApprove}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                            >
                                {actionLoading ? (
                                    <span>{isEn ? 'Approving & Sending Email...' : 'Đang duyệt & Gửi email...'}</span>
                                ) : (
                                    <span>✓ {isEn ? 'Confirm Approval' : 'Xác nhận Phê Duyệt'}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TỪ CHỐI YÊU CẦU */}
            {showRejectModal && selectedTicket && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                                <span>✕</span> {isEn ? 'Reject Recovery Request' : 'Từ Chối Yêu Cầu Khôi Phục'} #{selectedTicket.id}
                            </h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                {isEn ? 'Rejection Reason (Sent to user email)' : 'Lý do từ chối (bắt buộc, sẽ gửi về email người dùng)'} <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder={isEn 
                                    ? 'Explain why this request is rejected (e.g. Identity info does not match system records, invalid phone number)...' 
                                    : 'Nêu rõ lý do từ chối (ví dụ: Thông tin số điện thoại / họ tên không khớp với hồ sơ ứng viên; cần bổ sung thêm ảnh chụp CCCD)...'}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                {isEn ? 'Cancel' : 'Hủy'}
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmReject}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                            >
                                {actionLoading ? (
                                    <span>{isEn ? 'Rejecting...' : 'Đang xử lý...'}</span>
                                ) : (
                                    <span>✕ {isEn ? 'Confirm Rejection' : 'Xác nhận Từ Chối'}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
