import { useState } from 'react';

export default function JobManager({ jobs = [], onUpdateStatus, onDeleteJob, onEditJob }) {
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        description: ''
    });

    const handleOpenEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            location: job.location || '',
            salaryMin: job.salaryMin || '',
            salaryMax: job.salaryMax || '',
            description: job.description || ''
        });
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        onEditJob(editingJob.id, {
            ...formData,
            salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
            salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null
        });
        setEditingJob(null);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved':
                return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">Đã duyệt</span>;
            case 'Pending':
                return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-700">Chờ duyệt</span>;
            case 'Rejected':
                return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-700">Từ chối</span>;
            case 'Closed':
                return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-200 text-slate-700">Đã đóng</span>;
            default:
                return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">{status || 'Chờ duyệt'}</span>;
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-slate-900">Danh sách việc làm trên hệ thống</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Duyệt, từ chối, chỉnh sửa hoặc xóa tin tuyển dụng</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-lg text-slate-600">
                    Tổng: {jobs.length} tin
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="p-4">Tiêu đề việc làm</th>
                            <th className="p-4">Công ty</th>
                            <th className="p-4">Địa điểm</th>
                            <th className="p-4">Lương</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                    Chưa có tin tuyển dụng nào trên hệ thống.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-800">
                                        <p className="line-clamp-1">{job.title}</p>
                                        <span className="text-[11px] font-normal text-slate-400 block">{job.categoryName}</span>
                                    </td>
                                    <td className="p-4 text-slate-600">{job.companyName}</td>
                                    <td className="p-4 text-slate-500 text-xs">{job.location || 'Toàn quốc'}</td>
                                    <td className="p-4 text-brand font-semibold text-xs">
                                        {job.salaryMin || job.salaryMax
                                            ? `${job.salaryMin ? job.salaryMin / 1000000 : 0} - ${job.salaryMax ? job.salaryMax / 1000000 : 0} tr`
                                            : 'Thỏa thuận'}
                                    </td>
                                    <td className="p-4">{getStatusBadge(job.status)}</td>
                                    <td className="p-4 text-right space-x-1">
                                        {/* Nút Duyệt / Từ chối nhanh */}
                                        {job.status !== 'Approved' && (
                                            <button
                                                onClick={() => onUpdateStatus(job.id, 'Approved')}
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                                                title="Duyệt bài đăng"
                                            >
                                                Duyệt
                                            </button>
                                        )}
                                        {job.status !== 'Rejected' && (
                                            <button
                                                onClick={() => onUpdateStatus(job.id, 'Rejected')}
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition"
                                                title="Từ chối bài đăng"
                                            >
                                                Từ chối
                                            </button>
                                        )}
                                        {/* Nút Sửa */}
                                        <button
                                            onClick={() => handleOpenEdit(job)}
                                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition"
                                        >
                                            Sửa
                                        </button>
                                        {/* Nút Xóa */}
                                        <button
                                            onClick={() => onDeleteJob(job.id)}
                                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL SỬA VIỆC LÀM */}
            {editingJob && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Chỉnh sửa tin: #{editingJob.id}</h3>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Tiêu đề</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-brand"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Lương Min (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={formData.salaryMin}
                                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-brand"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Lương Max (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={formData.salaryMax}
                                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-brand"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Địa điểm</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-brand"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả công việc</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-brand"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingJob(null)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-brand hover:bg-brand-dark text-white shadow"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}