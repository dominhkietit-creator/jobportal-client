import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import OnlinePaymentModal from '../components/employer/OnlinePaymentModal';
import SmartPagination from '../components/common/SmartPagination';

export default function EmployerBillingPage() {
  const navigate = useNavigate();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [balance, setBalance] = useState(0);
  const [postJobFee, setPostJobFee] = useState(50000);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Pagination for transactions
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/Employer/wallet');
      if (res.data) {
        setBalance(res.data.balance || 0);
        setPostJobFee(res.data.postJobFee || 50000);
        setTransactions(res.data.recentTransactions || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Không thể tải thông tin ví tuyển dụng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    const handleWalletUpdated = (e) => {
      if (e.detail?.newBalance !== undefined) {
        setBalance(e.detail.newBalance);
      }
      fetchWallet();
    };

    window.addEventListener('wallet_updated', handleWalletUpdated);
    return () => window.removeEventListener('wallet_updated', handleWalletUpdated);
  }, []);

  const paginatedTransactions = transactions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#081534] via-[#1E2A4A] to-[#00288E] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Cổng Thanh Toán Trực Tuyến Doanh Nghiệp</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Ví Dịch Vụ & Quản Lý Thanh Toán
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Nạp tiền trực tuyến qua VietQR, MoMo hoặc Thẻ ATM để đăng tin tuyển dụng và sử dụng các dịch vụ cao cấp.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/payment/checkout?amount=100000&method=VietQR')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs backdrop-blur-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Mở giao diện Cổng thanh toán VNPAY / Ngân hàng mô phỏng"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span>Cổng VNPAY / MoMo Checkout</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDepositModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              <span>+ Nạp tiền nhanh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS & BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Số dư khả dụng */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Số dư tài khoản hiện tại</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {balance.toLocaleString('vi-VN')} <span className="text-base font-bold">VNĐ</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Đủ để đăng <strong className="text-slate-700 dark:text-slate-200">{Math.floor(balance / postJobFee)}</strong> tin tuyển dụng mới
          </p>
        </div>

        {/* Phí đăng tin */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Phí đăng tin tuyển dụng</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">post_add</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {postJobFee.toLocaleString('vi-VN')} <span className="text-base font-bold">VNĐ / tin</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Tin tuyển dụng hiển thị công khai ngay sau khi thanh toán thành công
          </p>
        </div>

        {/* Tổng giao dịch */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Tổng số giao dịch</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {transactions.length} <span className="text-base font-bold">giao dịch</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Lịch sử nạp tiền và trừ phí đăng tin chi tiết
          </p>
        </div>
      </div>

      {/* 3. LỊCH SỬ BIẾN ĐỘNG SỐ DƯ (TRANSACTION HISTORY) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006A61]">receipt_long</span>
              <span>Lịch sử biến động số dư & Nạp tiền</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ghi nhận minh bạch mọi giao dịch nạp tiền trực tuyến và chi phí đăng tin
            </p>
          </div>

          <button
            type="button"
            onClick={fetchWallet}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer text-slate-600 dark:text-slate-300"
            title="Làm mới"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FF] dark:bg-slate-900/60 text-slate-500 uppercase font-semibold tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-700/60">
              <tr>
                <th className="py-3.5 px-5">Mã GD</th>
                <th className="py-3.5 px-4">Loại giao dịch</th>
                <th className="py-3.5 px-4 text-right">Số tiền</th>
                <th className="py-3.5 px-4 text-right">Số dư sau GD</th>
                <th className="py-3.5 px-4">Phương thức</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-5 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải lịch sử giao dịch...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">receipt</span>
                      <p>Chưa có giao dịch nào phát sinh.</p>
                      <button
                        type="button"
                        onClick={() => setShowDepositModal(true)}
                        className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                      >
                        Nạp tiền ngay
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isDeposit = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500 font-bold">
                        {tx.referenceCode || `#${tx.id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isDeposit ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-xs">
                        <span className={isDeposit ? 'text-emerald-600' : 'text-rose-600'}>
                          {isDeposit ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {tx.balanceAfter ? `${tx.balanceAfter.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === 'Completed' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            Thành công
                          </span>
                        ) : tx.status === 'Pending' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            Chờ thanh toán
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                            {tx.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang lịch sử */}
        <SmartPagination
          currentPage={page}
          totalItems={transactions.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
          itemName="giao dịch"
          className="border-none rounded-none border-t border-slate-100 dark:border-slate-700/60"
        />
      </div>

      {/* ONLINE PAYMENT MODAL */}
      <OnlinePaymentModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => fetchWallet()}
      />
    </div>
  );
}
