import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function PaymentGatewayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const transactionId = searchParams.get('transactionId');
  const refCode = searchParams.get('ref') || `VNPAY${Date.now()}`;
  const amountParam = parseInt(searchParams.get('amount') || '50000', 10);
  const initialMethod = searchParams.get('method') || 'VietQR';

  const [activeTab, setActiveTab] = useState(
    initialMethod === 'MoMo' ? 'momo' : initialMethod === 'VNPay' ? 'atm' : 'vietqr'
  );

  // Countdown timer 15:00
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Transaction details from backend
  const [txData, setTxData] = useState(null);
  const [loadingTx, setLoadingTx] = useState(true);

  // ATM Card Form
  const [selectedBank, setSelectedBank] = useState('MB');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardDate, setCardDate] = useState('');

  // Processing & OTP Flow
  const [step, setStep] = useState('checkout'); // 'checkout' | 'otp' | 'processing' | 'success' | 'failed'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [progress, setProgress] = useState(0);
  const [newBalance, setNewBalance] = useState(0);

  const bankList = [
    { code: 'MB', name: 'MB Bank', color: 'from-blue-600 to-indigo-700' },
    { code: 'VCB', name: 'Vietcombank', color: 'from-emerald-600 to-teal-700' },
    { code: 'TCB', name: 'Techcombank', color: 'from-red-600 to-rose-700' },
    { code: 'BIDV', name: 'BIDV', color: 'from-teal-600 to-cyan-700' },
    { code: 'CTG', name: 'VietinBank', color: 'from-blue-700 to-blue-900' },
    { code: 'ACB', name: 'ACB Bank', color: 'from-blue-500 to-sky-600' },
    { code: 'TPB', name: 'TPBank', color: 'from-purple-600 to-pink-600' },
    { code: 'VPB', name: 'VPBank', color: 'from-emerald-500 to-green-600' }
  ];

  // Fetch transaction info if transactionId provided
  useEffect(() => {
    if (transactionId) {
      axiosClient.get(`/Employer/wallet/transaction/${transactionId}`)
        .then(res => {
          setTxData(res.data);
          setLoadingTx(false);
        })
        .catch(() => {
          setLoadingTx(false);
        });
    } else {
      setLoadingTx(false);
    }
  }, [transactionId]);

  // Countdown clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep('failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const amount = txData?.amount || amountParam;
  const qrUrl = txData?.qrUrl || `https://img.vietqr.io/image/970422-0901234567-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(refCode)}&accountName=JOBPORTAL%20VIETNAM`;

  // Điền thẻ test mẫu
  const fillTestAtm = () => {
    setCardNumber('9704 1985 2614 8888');
    setCardHolder('NGUYEN VAN A');
    setCardDate('07/28');
  };

  const fillTestVisa = () => {
    setCardNumber('4000 1234 5678 9010');
    setCardHolder('NGUYEN VAN A');
    setCardDate('12/29');
  };

  // Submit to OTP step
  const handleCardContinue = (e) => {
    e.preventDefault();
    if (!cardNumber.trim()) {
      alert('Vui lòng nhập số thẻ hoặc nhấn nút "Dùng thẻ mẫu".');
      return;
    }
    setStep('otp');
  };

  // Trigger Final Simulated Payment
  const handleFinalizePayment = async () => {
    setStep('processing');
    setProgress(15);

    // Simulate progress animation
    const p1 = setTimeout(() => setProgress(45), 400);
    const p2 = setTimeout(() => setProgress(85), 800);

    try {
      // Call backend to credit wallet
      const currentMethod = activeTab === 'vietqr' ? 'VietQR' : activeTab === 'momo' ? 'MoMo' : 'VNPay';
      const res = await axiosClient.post('/Employer/wallet/confirm-deposit', {
        transactionId: transactionId ? parseInt(transactionId, 10) : 0,
        referenceCode: refCode,
        amount: amount,
        paymentMethod: currentMethod
      });

      setTimeout(() => {
        setProgress(100);
        setNewBalance(res.data?.newBalance || 0);
        setStep('success');

        window.dispatchEvent(new CustomEvent('wallet_updated', {
          detail: { newBalance: res.data?.newBalance }
        }));
      }, 1000);
    } catch (err) {
      console.warn('Backend confirmation error:', err);
      // Nếu có lỗi mạng hoặc lỗi API, báo lỗi thay vì âm thầm bỏ qua
      setTimeout(() => {
        setProgress(100);
        if (err.response?.status === 401) {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setStep('failed');
        }
      }, 1000);
    }

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
    };
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp !== '123456' && otp.length < 4) {
      setOtpError('Mã OTP không đúng. Vui lòng nhập mã thử nghiệm: 123456');
      return;
    }
    setOtpError('');
    handleFinalizePayment();
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 flex flex-col justify-between font-sans antialiased">
      {/* 1. TOP SECURE BAR */}
      <div className="bg-[#00288E] text-white px-4 py-2 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
          <span className="material-symbols-outlined text-emerald-400 text-sm">lock</span>
          <span className="font-semibold">CỔNG THANH TOÁN ĐIỆN TỬ AN TOÀN LIÊN NGÂN HÀNG (SANDBOX SIMULATOR)</span>
          <span className="hidden sm:inline-block text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            SSL 256-Bit • PCI-DSS Level 1
          </span>
        </div>
      </div>

      {/* 2. MAIN CHECKOUT CONTAINER */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 my-auto">
        {/* Header Branding */}
        <div className="bg-white rounded-t-3xl p-5 border border-b-0 border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00288E] to-[#00574F] text-white flex items-center justify-center font-black text-xl shadow-md">
              JP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-none">
                  Job<span className="text-[#006A61]">Portal</span> Checkout Gateway
                </h1>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  Môi trường thử nghiệm
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Đơn vị thụ hưởng: <strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ JOBPORTAL VIỆT NAM</strong>
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2 shrink-0">
            <span className="material-symbols-outlined text-rose-600 animate-pulse">timer</span>
            <div className="text-left leading-none">
              <span className="text-[10px] text-rose-500 font-semibold block">Hết hạn sau</span>
              <span className="text-base font-mono font-black text-rose-700">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* PROCESSING SCREEN */}
        {step === 'processing' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 p-12 text-center shadow-lg space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center">
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                Đang xử lý giao dịch an toàn...
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hệ thống đang kết nối với Ngân hàng phát hành để xác thực thanh toán. Vui lòng không đóng trình duyệt hoặc nhấn F5.
              </p>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-teal-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {step === 'success' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl shadow-inner">
              <span className="material-symbols-outlined text-[48px]">check_circle</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Thanh toán thành công
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                +{amount.toLocaleString('vi-VN')} VNĐ
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Giao dịch nạp tiền vào Ví Tuyển Dụng đã được hoàn tất và ghi nhận ngay vào tài khoản của bạn!
              </p>
            </div>

            {/* Receipt Dossier */}
            <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono font-bold text-slate-800">{refCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-bold text-slate-800">
                  {activeTab === 'vietqr' ? 'VietQR Napas247' : activeTab === 'momo' ? 'Ví MoMo' : 'Thẻ ATM / VNPAY'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-medium text-slate-800">{new Date().toLocaleString('vi-VN')}</span>
              </div>
              {newBalance > 0 && (
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-emerald-700 font-bold">Số dư ví khả dụng mới:</span>
                  <span className="font-bold text-emerald-700 text-sm">{newBalance.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/employer/jobs')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#006A61] hover:bg-[#00574F] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                <span>Tiếp tục đăng tin việc làm</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/employer/billing')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Xem lịch sử ví
              </button>
            </div>
          </div>
        )}

        {/* STEP OTP SCREEN */}
        {step === 'otp' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 p-8 sm:p-12 shadow-lg max-w-lg mx-auto">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                <span className="material-symbols-outlined">mark_email_read</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Xác thực giao dịch bảo mật (3D-Secure)
              </h2>
              <p className="text-xs text-slate-500">
                Ngân hàng {selectedBank} vừa gửi mã OTP xác nhận thanh toán <strong>{amount.toLocaleString('vi-VN')} đ</strong>
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 mb-4 text-center">
              💡 <strong>Mã OTP giả lập thử nghiệm là:</strong> <span className="font-mono font-black text-sm text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">123456</span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nhập mã OTP (6 số):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono font-bold text-lg tracking-widest outline-none focus:ring-2 focus:ring-blue-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setOtp('123456')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Điền nhanh
                  </button>
                </div>
                {otpError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{otpError}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={otp.length === 0}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  Xác nhận thanh toán
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MAIN 2-COLUMN CHECKOUT SCREEN */}
        {step === 'checkout' && (
          <div className="bg-white rounded-b-3xl border border-slate-200/90 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* LEFT COLUMN: ORDER DETAILS (4 Cols) */}
            <div className="lg:col-span-4 p-6 bg-slate-50/70 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Thông tin đơn hàng
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Dịch vụ:</span>
                    <span className="font-bold text-slate-900">Nạp ví tuyển dụng JobPortal</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mã đơn hàng:</span>
                    <span className="font-mono font-bold text-slate-800">{refCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Đơn vị quản lý:</span>
                    <span className="font-medium text-slate-800">JobPortal Enterprise VN</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500 block">Số tiền cần thanh toán:</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#00288E] tracking-tight mt-0.5">
                    {amount.toLocaleString('vi-VN')} <span className="text-sm font-bold">VNĐ</span>
                  </div>
                </div>

                {/* Safe guarantee badge */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                    <span>Bảo mật giao dịch thanh toán</span>
                  </div>
                  <p>Mọi giao dịch thanh toán trực tuyến đều được mã hóa bằng chuẩn an toàn của Cổng Napas & VNPAY.</p>
                </div>
              </div>

              {/* Cancel button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn hủy giao dịch và quay lại trang quản lý?')) {
                      navigate('/employer/billing');
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 font-semibold transition cursor-pointer"
                >
                  &larr; Hủy giao dịch & Quay lại
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: PAYMENT METHODS & TEST CONTROLS (8 Cols) */}
            <div className="lg:col-span-8 p-6 space-y-6">
              {/* Method Selector Tabs */}
              <div className="flex border-b border-slate-200 gap-2 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('vietqr')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeTab === 'vietqr'
                      ? 'bg-[#00288E] text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  <span>VNPAY / VietQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('atm')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeTab === 'atm'
                      ? 'bg-[#00288E] text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  <span>Thẻ ATM Nội Địa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('visa')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeTab === 'visa'
                      ? 'bg-[#00288E] text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">public</span>
                  <span>Thẻ Quốc Tế Visa/Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('momo')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeTab === 'momo'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-extrabold text-xs">MoMo</span>
                  <span>Ví MoMo</span>
                </button>
              </div>

              {/* TAB 1: VIETQR / VNPAY-QR */}
              {activeTab === 'vietqr' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                      <img
                        src={qrUrl}
                        alt="QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 text-sm">
                        Quét mã QR để thanh toán tức thì
                      </h4>
                      <p className="text-slate-500">
                        Sử dụng <strong>App Ngân hàng bất kỳ</strong> (Vietcombank, MB, Techcombank...) hoặc <strong>Ví VNPAY</strong> để quét mã.
                      </p>
                      <div className="pt-2 text-[11px] space-y-1">
                        <div>Ngân hàng: <strong>MB Bank (Quân Đội)</strong></div>
                        <div>Số tài khoản: <strong className="font-mono">0901234567</strong></div>
                        <div>Nội dung CK: <strong className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{refCode}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Simulator action */}
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs">
                      <span className="material-symbols-outlined text-emerald-600 text-base">bolt</span>
                      <span>Chế độ giả lập thanh toán (Simulation Test Mode)</span>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Bạn không cần dùng tài khoản ngân hàng thật để chuyển tiền. Nhấn nút dưới đây để giả lập tín hiệu thanh toán thành công từ cổng Napas/VNPAY:
                    </p>
                    <button
                      type="button"
                      onClick={handleFinalizePayment}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">verified</span>
                      <span>[Giả lập] Xác nhận đã quét mã & Thanh toán thành công (+{amount.toLocaleString('vi-VN')} đ)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: THẺ ATM NỘI ĐỊA */}
              {activeTab === 'atm' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      Chọn ngân hàng phát hành thẻ ATM:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {bankList.map((b) => (
                        <button
                          key={b.code}
                          type="button"
                          onClick={() => setSelectedBank(b.code)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            selectedBank === b.code
                              ? 'border-blue-600 bg-blue-50/80 text-blue-800 ring-1 ring-blue-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="font-extrabold text-[11px]">{b.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{b.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleCardContinue} className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Số thẻ ATM</label>
                        <button
                          type="button"
                          onClick={fillTestAtm}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          + Dùng thẻ test mẫu
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="9704 1985 2614 8888"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Tên chủ thẻ (không dấu)</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 uppercase text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Ngày phát hành (MM/YY)</label>
                        <input
                          type="text"
                          required
                          value={cardDate}
                          onChange={(e) => setCardDate(e.target.value)}
                          placeholder="07/28"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Tiếp tục xác thực OTP</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: THẺ QUỐC TẾ VISA/MASTER */}
              {activeTab === 'visa' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Cổng thanh toán thẻ quốc tế Visa / MasterCard</span>
                    <button
                      type="button"
                      onClick={fillTestVisa}
                      className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      + Dùng thẻ Visa test
                    </button>
                  </div>

                  <form onSubmit={handleCardContinue} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Số thẻ Visa / MasterCard</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4000 1234 5678 9010"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Tên in trên thẻ</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 uppercase text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Ngày hết hạn (MM/YY)</label>
                        <input
                          type="text"
                          required
                          value={cardDate}
                          onChange={(e) => setCardDate(e.target.value)}
                          placeholder="12/29"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Xác nhận thông tin thẻ</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: MOMO */}
              {activeTab === 'momo' && (
                <div className="space-y-5">
                  <div className="p-4 bg-pink-50 rounded-2xl border border-pink-200 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-pink-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                      MoMo
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-pink-900">
                        Cổng thanh toán MoMo Checkout
                      </h4>
                      <p className="text-xs text-pink-700 mt-0.5">
                        Thanh toán bảo mật chuẩn MoMo E-Wallet API
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
                    <div className="w-44 h-44 mx-auto p-2 bg-pink-50 rounded-2xl border border-pink-200">
                      <img src={qrUrl} alt="MoMo QR" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Mở ứng dụng Ví MoMo trên điện thoại để quét mã QR thanh toán
                    </p>

                    <button
                      type="button"
                      onClick={handleFinalizePayment}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">verified</span>
                      <span>[Giả lập] Xác nhận đã thanh toán qua Ví MoMo (+{amount.toLocaleString('vi-VN')} đ)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. FOOTER */}
      <div className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 JobPortal Electronic Payment Gateway Simulator. All rights reserved. PCI-DSS Certified.
      </div>
    </div>
  );
}
