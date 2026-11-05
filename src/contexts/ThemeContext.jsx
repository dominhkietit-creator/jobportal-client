import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('jobportal_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('jobportal_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Reusable ThemeToggle button with Sun/Moon icons
export function ThemeToggle({ className = '', showLabel = false }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border transition cursor-pointer select-none ${
                isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            } ${className}`}
            title={isDark ? 'Chuyển sang Giao diện sáng (Light mode)' : 'Chuyển sang Giao diện tối (Dark mode)'}
            aria-label="Chuyển đổi giao diện Sáng / Tối"
        >
            {isDark ? (
                // Icon Mặt trời (cho chế độ Dark để chuyển về Light)
                <svg className="w-4 h-4 shrink-0 text-amber-400 animate-in spin-in-180 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Icon Mặt trăng (cho chế độ Light để chuyển sang Dark)
                <svg className="w-4 h-4 shrink-0 text-slate-600 animate-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
            {showLabel && (
                <span className="text-xs font-semibold">
                    {isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}
                </span>
            )}
        </button>
    );
}
