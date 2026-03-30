import React, { useState, useEffect, useCallback } from 'react';
import { GoalCard } from '../components/GoalCard';
import { GoalCardSkeleton } from '../components/shared';
import { api } from '../api';
import { useUser } from '../UserContext';

const SortToggle = ({ sortBy, onToggle }) => (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
        <button
            onClick={() => onToggle('updated')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                sortBy === 'updated'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
            Последние изменённые
        </button>
        <button
            onClick={() => onToggle('created')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                sortBy === 'created'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
            По дате создания
        </button>
        <button
            onClick={() => onToggle('status')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                sortBy === 'status'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
            По статусу
        </button>
    </div>
);

const STATUS_ORDER = {
    DRAFT: 0,
    NEEDS_CHANGES: 1,
    REJECTED: 2,
    SUBMITTED: 3,
    ACTIVE: 4,
    IN_PROGRESS: 5,
    APPROVED: 6,
    DONE: 7,
    ARCHIVED: 8,
    CANCELLED: 9,
    OVERDUE: 10,
};

const StatusFilter = ({ statuses, activeFilter, onFilter }) => (
    <div className="flex flex-wrap gap-1.5">
        <button
            onClick={() => onFilter(null)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition border ${
                !activeFilter
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
            Все
        </button>
        {statuses.map(status => (
            <button
                key={status}
                onClick={() => onFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition border ${
                    activeFilter === status
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
                {status}
            </button>
        ))}
    </div>
);

const formatRelativeDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const MyGoalsView = ({ onEditGoal }) => {
    const user = useUser();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('updated');
    const [statusFilter, setStatusFilter] = useState(null);

    const fetchGoals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getEmployeeGoals(user.employee.id);
            setGoals(data);
        } catch (error) {
            console.error('Failed to fetch my goals', error);
        } finally {
            setLoading(false);
        }
    }, [user.employee.id]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const sortedGoals = [...goals].sort((a, b) => {
        if (sortBy === 'updated') {
            return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        }
        if (sortBy === 'created') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        if (sortBy === 'status') {
            return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        }
        return 0;
    });

    const filteredGoals = statusFilter
        ? sortedGoals.filter(g => g.status === statusFilter)
        : sortedGoals;

    const uniqueStatuses = [...new Set(goals.map(g => g.status))].sort(
        (a, b) => (STATUS_ORDER[a] ?? 99) - (STATUS_ORDER[b] ?? 99)
    );

    const handleDeleteClick = async (goalId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту цель?')) return;
        try {
            await api.deleteGoal(goalId);
            await fetchGoals();
        } catch {
        }
    };

    const handleEditClick = (goal) => {
        if (onEditGoal) {
            onEditGoal(goal);
        }
    };

    const statsData = {
        total: goals.length,
        draft: goals.filter(g => g.status === 'DRAFT').length,
        submitted: goals.filter(g => ['SUBMITTED', 'ACTIVE', 'IN_PROGRESS'].includes(g.status)).length,
        approved: goals.filter(g => g.status === 'APPROVED').length,
        needsWork: goals.filter(g => ['NEEDS_CHANGES', 'REJECTED'].includes(g.status)).length,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Мои цели</h1>
                <p className="mt-1 text-sm text-gray-500">Все ваши цели в одном месте</p>
            </div>


            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" id="tour-employee-goals-stats">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-gray-900">{statsData.total}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Всего целей</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-yellow-600">{statsData.draft}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Черновики</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-green-600">{statsData.approved}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Утверждено</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-orange-600">{statsData.needsWork}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Требуют доработки</div>
                </div>
            </div>


            {goals.length > 0 && goals.length < 3 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 font-medium">
                    {`У вас ${goals.length} цел${goals.length === 1 ? 'ь' : 'и'} — рекомендуется минимум 3 для полноценного набора.`}
                </div>
            )}


            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4" id="tour-employee-goals-sorting">
                <SortToggle sortBy={sortBy} onToggle={setSortBy} />
                {uniqueStatuses.length > 1 && (
                    <StatusFilter
                        statuses={uniqueStatuses}
                        activeFilter={statusFilter}
                        onFilter={setStatusFilter}
                    />
                )}
            </div>


            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <GoalCardSkeleton key={i} />)}
                </div>
            ) : filteredGoals.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {statusFilter
                            ? 'Нет целей с выбранным статусом'
                            : 'У вас пока нет сохраненных целей'}
                    </div>
                    <p className="text-sm text-gray-400">
                        {statusFilter
                            ? 'Попробуйте убрать фильтр'
                            : 'Создайте новую цель на странице «Кабинет»'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredGoals.map(goal => (
                        <div key={goal.id} className="relative">

                            {(goal.updated_at || goal.created_at) && (
                                <div className="absolute -top-2 right-4 z-10">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] text-gray-400 shadow-sm">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {sortBy === 'created'
                                            ? formatRelativeDate(goal.created_at)
                                            : formatRelativeDate(goal.updated_at)}
                                    </span>
                                </div>
                            )}
                            <GoalCard
                                goal={goal}
                                mode="employee"
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onApplyImproved={null}
                            />
                        </div>
                    ))}
                </div>
            )}


            {!loading && filteredGoals.length > 0 && (
                <div className="mt-4 text-center text-xs text-gray-400">
                    Показано {filteredGoals.length} из {goals.length} целей
                </div>
            )}
        </div>
    );
};

export default MyGoalsView;
