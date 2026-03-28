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
