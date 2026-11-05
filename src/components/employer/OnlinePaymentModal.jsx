import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../../contexts/ToastContext';

export default function OnlinePaymentModal({ isOpen, onClose, onSuccess, initialAmount = 50000 }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Select amount & method, 2: Show QR & Payment info
  const [amount, setAmount] = useState(initialAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VietQR'); // 'VietQR' | 'VNPay' | 'MoMo'
  const [loading, setLoading] = useState(false);
  const [quickSimulating, setQuickSimulating] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount(initialAmount || 50000);
      setCustomAmount('');
      setOrderData(null);
    }
  }, [isOpen, initialAmount]);

  if (!isOpen) return null;

  const handleSelectAmount = (val) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val) {
      setAmount(Number(val));
    }
  };

  // Mở cổng thanh toán checkout toàn diện
  const handleOpenGateway = async () => {
    if (amount < 10000) {
      showToast('Số tiền nạp tối thiểu là 10.000 VNĐ.', 'warning');
      return;
    }
    try {
      setLoading(true);
      const res = await axiosClient.post('/Employer/wallet/deposit', {
        amount,
        paymentMethod
      });
      onClose();
      navigate(`/payment/checkout?transactionId=${res.data.transactionId}&ref=${res.data.referenceCode}&amount=${amount}&method=${paymentMethod}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể mở cổng thanh toán.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Nạp tiền nhanh giả lập tức thì (1 chạm cộng tiền luôn vào ví)
  const handleQuickSimulateDeposit = async () => {
    if (amount < 10000) {
      showToast('Số tiền nạp tối thiểu là 10.000 VNĐ.', 'warning');
      return;
    }

    try {
      setQuickSimulating(true);
      // Tạo giao dịch trước
      const depRes = await axiosClient.post('/Employer/wallet/deposit', {
        amount,
        paymentMethod
      });

      // Xác nhận hoàn tất ngay lập tức
      const confirmRes = await axiosClient.post('/Employer/wallet/confirm-deposit', {
        transactionId: depRes.data.transactionId,
        referenceCode: depRes.data.referenceCode,
        amount: amount,
        paymentMethod: paymentMethod
      });

      const updatedBalance = confirmRes.data?.newBalance;
      showToast(`⚡ Giả lập nạp thành công! +${amount.toLocaleString('vi-VN')} đ đã vào ví.`, 'success');
      
      // Bắn event để cập nhật Header và trang Billing
      window.dispatchEvent(new CustomEvent('wallet_updated', {
        detail: { newBalance: updatedBalance }
      }));

      if (onSuccess) onSuccess(confirmRes.data);
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi khi thực hiện giả lập nạp tiền.', 'error');
    } finally {
      setQuickSimulating(false);
    }
  };

  // Tạo và hiển thị mã QR tại chỗ
  const handleCreatePayment = async (e) => {
    if (e) e.preventDefault();
    if (amount < 10000) {
      showToast('Số tiền nạp tối thiểu là 10.000 VNĐ.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/Employer/wallet/deposit', {
        amount,
        paymentMethod
      });
      setOrderData(res.data);
      setStep(2);
      showToast('Đã tạo lệnh thanh toán! Vui lòng quét mã QR để chuyển khoản.', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tạo yêu cầu nạp tiền.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận đã chuyển khoản ở Step 2
  const handleConfirmPayment = async () => {
    if (!orderData) return;
    try {
      setConfirming(true);
      const res = await axiosClient.post('/Employer/wallet/confirm-deposit', {
        transactionId: orderData.transactionId,
        referenceCode: orderData.referenceCode,
        amount: orderData.amount,
        paymentMethod: orderData.paymentMethod
      });

      showToast(res.data?.message || 'Nạp tiền vào tài khoản thành công!', 'success');
      window.dispatchEvent(new CustomEvent('wallet_updated', {
        detail: { newBalance: res.data?.newBalance }
      }));
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xác nhận thanh toán thất bại.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Đã sao chép ${fieldName}!`, 'success');
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Luôn cố định phía trên */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Nạp tiền vào Ví Tuyển Dụng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Phí dịch vụ: <strong className="text-emerald-600 font-bold">50.000 đ / 1 tin tuyển dụng</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body Step 1: Chọn số tiền & phương thức */}
        {step === 1 && (
          <>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* 1. Chọn gói nạp */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  1. Chọn số tiền muốn nạp
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSelectAmount(q)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        amount === q && !customAmount
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{q.toLocaleString('vi-VN')} đ</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({Math.floor(q / 50000)} tin)
                      </span>
                    </button>
                  ))}
                </div>

                {/* Nhập số tiền tùy chỉnh */}
                <div className="pt-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={customAmount ? Number(customAmount).toLocaleString('vi-VN') : ''}
                      onChange={handleCustomAmountChange}
                      placeholder="Hoặc nhập số tiền khác (VNĐ)..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-bold">VNĐ</span>
                  </div>
                </div>
              </div>

              {/* 2. Chọn phương thức thanh toán */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  2. Chọn phương thức thanh toán
                </label>
                <div className="space-y-2">
                  {/* VietQR */}
                  <label
                    onClick={() => setPaymentMethod('VietQR')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'VietQR'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                        QR
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Chuyển khoản VietQR (Napas 247)</span>
                          <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                            Tự động 24/7
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">Quét mã bằng App hơn 40 ngân hàng</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="method"
                      checked={paymentMethod === 'VietQR'}
                      onChange={() => setPaymentMethod('VietQR')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* MoMo */}
                  <label
                    onClick={() => setPaymentMethod('MoMo')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'MoMo'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        MoMo
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">Ví điện tử MoMo</p>
                        <p className="text-[10px] text-slate-400">Thanh toán tức thì qua ví MoMo QR</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="method"
                      checked={paymentMethod === 'MoMo'}
                      onChange={() => setPaymentMethod('MoMo')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* VNPAY */}
                  <label
                    onClick={() => setPaymentMethod('VNPay')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'VNPay'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0">
                        VNPAY
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">Thẻ ATM / VNPAY-QR</p>
                        <p className="text-[10px] text-slate-400">Thẻ nội địa & thẻ quốc tế Visa / MasterCard</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="method"
                      checked={paymentMethod === 'VNPay'}
                      onChange={() => setPaymentMethod('VNPay')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Step 1: Luôn cố định phía dưới không bị che khuất */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-850/60 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block leading-tight">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Nút giả lập nạp tiền nhanh 1 chạm */}
                <button
                  type="button"
                  onClick={handleQuickSimulateDeposit}
                  disabled={quickSimulating || loading || amount < 10000}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Nhấn để cộng tiền trực tiếp vào tài khoản ngay lập tức"
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>{quickSimulating ? 'Đang nạp...' : '⚡ Giả lập nạp tiền ngay'}</span>
                </button>
              </div>

              {/* Hàng 2 nút điều hướng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenGateway}
                  disabled={loading || quickSimulating || amount < 10000}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00288E] to-[#004D40] hover:from-blue-800 hover:to-teal-800 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Mở giao diện Cổng thanh toán VNPAY / Checkout với mô phỏng OTP ngân hàng"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Mở Cổng VNPAY / Checkout</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreatePayment}
                  disabled={loading || quickSimulating || amount < 10000}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                  <span>{loading ? 'Đang tạo...' : 'Hiện mã QR tại đây'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Body Step 2: Quét mã QR & Thông tin chuyển khoản */}
        {step === 2 && orderData && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                <img
                  src={orderData.qrUrl}
                  alt="VietQR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Mở ứng dụng Ngân hàng hoặc Ví MoMo để quét mã thanh toán
              </p>
            </div>

            {/* Thông tin chuyển khoản chi tiết */}
            <div className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {orderData.bankInfo.bankName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {orderData.bankInfo.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderData.bankInfo.accountNumber, 'Số tài khoản')}
                    className="p-1 rounded text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Sao chép"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedField === 'Số tài khoản' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {orderData.bankInfo.accountName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {orderData.amount.toLocaleString('vi-VN')} đ
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderData.amount.toString(), 'Số tiền')}
                    className="p-1 rounded text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Sao chép"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedField === 'Số tiền' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-rose-600 font-bold">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {orderData.bankInfo.memo}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderData.bankInfo.memo, 'Nội dung chuyển khoản')}
                    className="p-1 rounded text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Sao chép"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedField === 'Nội dung chuyển khoản' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmation actions */}
            <div className="pt-2 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang xác nhận giao dịch...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Tôi đã chuyển khoản thành công</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
