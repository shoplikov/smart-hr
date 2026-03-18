import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';

export const STATUS_CONFIG = {
    DRAFT:         { label: 'Черновик',        bg: 'bg-gray-100',    text: 'text-gray-700',    dot: 'bg-gray-400' },
    SUBMITTED:     { label: 'На рассмотрении', bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-400' },
    IN_PROGRESS:   { label: 'В работе',        bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400' },
    ACTIVE:        { label: 'Активна',         bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400' },
    APPROVED:      { label: 'Утверждено',      bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-500' },
    DONE:          { label: 'Выполнено',       bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    CANCELLED:     { label: 'Отменено',        bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400' },
    OVERDUE:       { label: 'Просрочено',      bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400' },
    ARCHIVED:      { label: 'В архиве',        bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-300' },
    NEEDS_CHANGES: { label: 'На доработке',    bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400' },
    REJECTED:      { label: 'Отклонено',       bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
};

export const LOCKED_STATUSES = ['APPROVED', 'DONE', 'ARCHIVED'];

export const VERDICT_LABELS = {
    approve:       { label: 'Утверждено',        bg: 'bg-green-100',  text: 'text-green-700' },
    reject:        { label: 'Отклонено',         bg: 'bg-red-100',    text: 'text-red-700' },
    needs_changes: { label: 'Требует доработки', bg: 'bg-orange-100', text: 'text-orange-700' },
    comment_only:  { label: 'Комментарий',       bg: 'bg-gray-100',   text: 'text-gray-600' },
};

export const GoalStatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

export const VerdictBadge = ({ verdict }) => {
    const cfg = VERDICT_LABELS[verdict] || { label: verdict, bg: 'bg-gray-100', text: 'text-gray-600' };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

export const Expandable = ({ title, badge, defaultOpen = false, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    const contentRef = useRef(null);
    const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px');

    useEffect(() => {
        if (open && contentRef.current) {
            setHeight(`${contentRef.current.scrollHeight}px`);
            const timer = setTimeout(() => setHeight('auto'), 300);
            return () => clearTimeout(timer);
        } else {
            if (contentRef.current) {
                setHeight(`${contentRef.current.scrollHeight}px`);
                requestAnimationFrame(() => setHeight('0px'));
            }
        }
    }, [open]);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-left"
            >
                <div className="flex items-center gap-2">
                    <svg
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">{title}</span>
                    {badge}
                </div>
            </button>
            <div
                ref={contentRef}
                style={{ maxHeight: height }}
                className="overflow-hidden transition-all duration-300 ease-in-out"
            >
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-indigo-600',
        warning: 'bg-orange-500',
    };

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`${colors[t.type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in max-w-sm`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const SkeletonLine = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const GoalCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
                <SkeletonLine className="h-4 w-3/4" />
                <SkeletonLine className="h-4 w-1/2" />
            </div>
            <SkeletonLine className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
            <SkeletonLine className="h-5 w-16 rounded-full" />
            <SkeletonLine className="h-5 w-24 rounded-full" />
        </div>
    </div>
);
