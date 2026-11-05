export default function StatCards({ stats = {} }) {
    const items = [
        { label: 'TỔNG VIỆC LÀM', value: stats.totalJobs ?? 0, color: 'text-slate-900', border: 'border-l-4 border-l-slate-900' },
        { label: 'ỨNG VIÊN', value: stats.totalCandidates ?? 0, color: 'text-brand', border: 'border-l-4 border-l-brand' },
        { label: 'NHÀ TUYỂN DỤNG', value: stats.totalEmployers ?? 0, color: 'text-indigo-600', border: 'border-l-4 border-l-indigo-500' },
        { label: 'DOANH NGHIỆP', value: stats.totalCompanies ?? 0, color: 'text-sky-600', border: 'border-l-4 border-l-sky-500' },
        { label: 'LƯỢT ỨNG TUYỂN', value: stats.totalApplications ?? 0, color: 'text-amber-500', border: 'border-l-4 border-l-amber-500' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            {items.map((it, idx) => (
                <div
                    key={idx}
                    className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition ${it.border}`}
                >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {it.label}
                    </span>
                    <p className={`text-3xl font-black mt-2 ${it.color}`}>
                        {it.value}
                    </p>
                </div>
            ))}
        </div>
    );
}