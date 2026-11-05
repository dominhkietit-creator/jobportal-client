import { useState } from 'react';

export default function CategoryManager({ categories, onAddCategory }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAddCategory(name);
        setName('');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-bold text-slate-900 mb-2">Thêm ngành nghề mới</h3>
                <p className="text-xs text-slate-500 mb-4">Danh mục hiển thị ở bộ lọc ứng viên</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        required
                        placeholder="VD: Trí tuệ nhân tạo (AI)..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-brand focus:border-brand"
                    />
                    <button
                        type="submit"
                        className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl transition text-sm shadow"
                    >
                        + Thêm danh mục
                    </button>
                </form>
            </div>

            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Danh mục hiện có ({categories.length})</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {categories.map((c, idx) => (
                        <li key={c.id || idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                            <span className="font-semibold text-slate-800 text-sm">#{c.id} - {c.name}</span>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Đang áp dụng</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}