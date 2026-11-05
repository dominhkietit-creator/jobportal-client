export default function UserTable({ users, onToggleStatus }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Danh sách tài khoản thành viên</h2>
                <span className="text-xs text-slate-400">Khóa hoặc kích hoạt tài khoản</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="p-4">Họ và tên</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                            <tr><td colSpan="5" className="p-6 text-center text-slate-400">Chưa có người dùng nào.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-800">{u.fullName}</td>
                                    <td className="p-4 text-slate-500">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'Employer' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {u.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => onToggleStatus(u.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${u.isActive
                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                                }`}
                                        >
                                            {u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}